import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { CONFIG } from "../config";
import { getRazorpayInstance } from "../config/razorpay";
import CartModel from "../models/cart.model";
import EcommerceOrderModel from "../models/ecommerceOrder.model";

// Get Razorpay Public Key
export const getRazorpayKey = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      success: true,
      key: CONFIG.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    });
  }
);

// Create Razorpay Order
export const createRazorpayOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { amount, receipt } = req.body;

      let payableAmount = Number(amount);

      // If amount not explicitly passed, compute directly from user's cart for security
      if (!payableAmount || payableAmount <= 0) {
        const cart = await CartModel.findOne({ userId });
        if (!cart || cart.items.length === 0) {
          return next(new ErrorHandler("Cart is empty", 400));
        }

        let subtotal = 0;
        for (const item of cart.items) {
          subtotal += item.price * item.quantity;
        }
        const discount = cart.couponDiscount || 0;
        const taxableAmount = Math.max(0, subtotal - discount);
        const tax = Math.round(taxableAmount * 0.18 * 100) / 100;
        const shipping = subtotal > 500 ? 0 : 50;
        payableAmount = Math.round((taxableAmount + tax + shipping) * 100) / 100;
      }

      const razorpay = getRazorpayInstance();
      const amountInPaise = Math.round(payableAmount * 100);

      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: {
          userId: userId?.toString(),
        },
      };

      let razorpayOrder: any;
      try {
        const razorpay = getRazorpayInstance();
        razorpayOrder = await razorpay.orders.create(options);
      } catch (rzpErr: any) {
        if (
          CONFIG.RAZORPAY_KEY_ID?.includes("placeholder") ||
          !CONFIG.RAZORPAY_KEY_SECRET ||
          CONFIG.RAZORPAY_KEY_SECRET?.includes("placeholder") ||
          process.env.NODE_ENV !== "production"
        ) {
          razorpayOrder = {
            id: `order_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            entity: "order",
            amount: amountInPaise,
            amount_paid: 0,
            amount_due: amountInPaise,
            currency: "INR",
            receipt: options.receipt,
            status: "created",
            attempts: 0,
            notes: options.notes,
            created_at: Math.floor(Date.now() / 1000),
          };
        } else {
          throw rzpErr;
        }
      }

      res.status(200).json({
        success: true,
        order: razorpayOrder,
        amount: payableAmount,
        currency: "INR",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Cryptographic Signature Verification
export const verifyRazorpayPayment = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return next(
          new ErrorHandler("Missing required payment verification parameters", 400)
        );
      }

      const secret =
        CONFIG.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      const isAuthentic = expectedSignature === razorpay_signature;

      if (!isAuthentic) {
        return next(
          new ErrorHandler("Payment verification failed! Invalid signature", 400)
        );
      }

      res.status(200).json({
        success: true,
        message: "Payment successfully verified",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Razorpay Webhook Handler
export const razorpayWebhook = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const webhookSecret =
        CONFIG.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || "";

      if (webhookSecret) {
        const signature = req.headers["x-razorpay-signature"] as string;
        const shasum = crypto.createHmac("sha256", webhookSecret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest("hex");

        if (digest !== signature) {
          return res.status(400).json({ status: "invalid signature" });
        }
      }

      const event = req.body?.event;
      const paymentEntity = req.body?.payload?.payment?.entity;

      if (event === "payment.captured") {
        if (!paymentEntity) {
          return res.status(400).json({ success: false, message: "Missing payment entity in payload" });
        }
        // Find order by razorpay_order_id and mark paid if not already
        await EcommerceOrderModel.findOneAndUpdate(
          { "paymentInfo.orderId": paymentEntity.order_id },
          {
            "paymentInfo.status": "paid",
            "paymentInfo.id": paymentEntity.id,
            "paymentInfo.paidAt": new Date(),
            orderStatus: "Confirmed",
          }
        );
      } else if (event === "payment.failed") {
        if (!paymentEntity) {
          return res.status(400).json({ success: false, message: "Missing payment entity in payload" });
        }
        await EcommerceOrderModel.findOneAndUpdate(
          { "paymentInfo.orderId": paymentEntity.order_id },
          {
            "paymentInfo.status": "failed",
          }
        );
      }

      res.status(200).json({ status: "ok" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Admin Process Refund
export const processRefund = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { paymentId, amount } = req.body;

      if (!paymentId) {
        return next(new ErrorHandler("Payment ID is required for refund", 400));
      }

      const razorpay = getRazorpayInstance();
      const refundOptions: any = {};
      if (amount) {
        refundOptions.amount = Math.round(Number(amount) * 100);
      }

      const refund = await razorpay.payments.refund(paymentId, refundOptions);

      res.status(200).json({
        success: true,
        message: "Refund initiated successfully",
        refund,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
