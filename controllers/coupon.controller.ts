import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import CouponModel from "../models/coupon.model";
import CartModel from "../models/cart.model";

// Create Coupon (Admin)
export const createCoupon = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const code = req.body.code;
      const discountType = req.body.discountType;
      const discountValue = req.body.discountValue !== undefined ? req.body.discountValue : req.body.discountAmount;
      const minOrderAmount = req.body.minOrderAmount !== undefined ? req.body.minOrderAmount : req.body.minPurchaseAmount;
      const maxDiscountLimit = req.body.maxDiscountLimit !== undefined ? req.body.maxDiscountLimit : req.body.maxDiscountAmount;
      const startDate = req.body.startDate;
      const endDate = req.body.endDate || req.body.expiryDate || req.body.expiresAt;
      const usageLimit = req.body.usageLimit;

      if (!code || !discountType || discountValue === undefined || !endDate) {
        return next(
          new ErrorHandler("Code, discount type, value, and expiration date are required", 400)
        );
      }

      const existing = await CouponModel.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        return next(new ErrorHandler("Coupon code already exists", 400));
      }

      const coupon = await CouponModel.create({
        code: code.toUpperCase().trim(),
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscountLimit: maxDiscountLimit ? Number(maxDiscountLimit) : undefined,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
      });

      res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        coupon,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get All Coupons (Admin)
export const getAllCoupons = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupons = await CouponModel.find().sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        count: coupons.length,
        coupons,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Apply Coupon to Cart
export const applyCoupon = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { code } = req.body;

      if (!code) {
        return next(new ErrorHandler("Please enter a coupon code", 400));
      }

      const coupon = await CouponModel.findOne({
        code: code.toUpperCase().trim(),
        isActive: true,
      });

      if (!coupon) {
        return next(new ErrorHandler("Invalid coupon code", 404));
      }

      const now = new Date();
      if (now < coupon.startDate || now > coupon.endDate) {
        return next(new ErrorHandler("Coupon has expired or is not yet active", 400));
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return next(new ErrorHandler("Coupon usage limit reached", 400));
      }

      const cart = await CartModel.findOne({ userId });
      if (!cart || cart.items.length === 0) {
        return next(new ErrorHandler("Your cart is empty", 400));
      }

      // Calculate subtotal
      let subtotal = 0;
      for (const item of cart.items) {
        subtotal += item.price * item.quantity;
      }

      if (subtotal < coupon.minOrderAmount) {
        return next(
          new ErrorHandler(
            `Minimum order amount to apply this coupon is ₹${coupon.minOrderAmount}`,
            400
          )
        );
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === "percentage") {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountLimit && discount > coupon.maxDiscountLimit) {
          discount = coupon.maxDiscountLimit;
        }
      } else {
        discount = coupon.discountValue;
      }

      discount = Math.min(discount, subtotal);

      cart.appliedCoupon = coupon.code;
      cart.couponDiscount = Math.round(discount * 100) / 100;
      await cart.save();

      res.status(200).json({
        success: true,
        message: `Coupon '${coupon.code}' applied! You saved ₹${cart.couponDiscount}`,
        discount: cart.couponDiscount,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Remove Coupon from Cart
export const removeCoupon = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const cart = await CartModel.findOne({ userId });
      if (!cart) {
        return next(new ErrorHandler("Cart not found", 404));
      }

      cart.appliedCoupon = undefined;
      cart.couponDiscount = 0;
      await cart.save();

      res.status(200).json({
        success: true,
        message: "Coupon removed successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete Coupon (Admin)
export const deleteCoupon = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const coupon = await CouponModel.findByIdAndDelete(id);
      if (!coupon) {
        return next(new ErrorHandler("Coupon not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Coupon deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
