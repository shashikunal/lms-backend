import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import EcommerceOrderModel, {
  IOrderItem,
  IShippingDetails,
} from "../models/ecommerceOrder.model";
import CartModel from "../models/cart.model";
import ProductModel from "../models/product.model";
import AddressModel from "../models/address.model";
import NotificationModel from "../models/notificationModel";
import sendMail from "../utils/sendMail";

// Create Order from Cart or Direct Items
export const createEcommerceOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const addressId = req.body.addressId || req.body.shippingAddressId;
      const { shippingAddress, paymentInfo } = req.body;

      // 1. Resolve Shipping Address
      let finalShippingAddress: IShippingDetails;
      if (addressId) {
        const savedAddress = await AddressModel.findOne({ _id: addressId, userId });
        if (!savedAddress) {
          return next(new ErrorHandler("Selected shipping address not found", 404));
        }
        finalShippingAddress = {
          fullName: savedAddress.fullName,
          phone: savedAddress.phone,
          addressLine1: savedAddress.addressLine1,
          addressLine2: savedAddress.addressLine2,
          landmark: savedAddress.landmark,
          city: savedAddress.city,
          state: savedAddress.state,
          postalCode: savedAddress.postalCode,
          country: savedAddress.country,
        };
      } else if (shippingAddress) {
        finalShippingAddress = shippingAddress;
      } else {
        return next(new ErrorHandler("Shipping address is required", 400));
      }

      // 2. Fetch User's Cart
      const cart = await CartModel.findOne({ userId }).populate({
        path: "items.product",
        select: "title slug price discountPrice images stockQuantity inStock sku",
      });

      if (!cart || cart.items.length === 0) {
        return next(new ErrorHandler("Your cart is empty", 400));
      }

      // 3. Validate Stock & Prepare Order Items
      const orderItems: IOrderItem[] = [];
      let itemsPrice = 0;

      for (const cartItem of cart.items) {
        const product: any = cartItem.product;
        if (!product) {
          return next(new ErrorHandler("One of the products in your cart was deleted", 400));
        }

        if (product.stockQuantity < cartItem.quantity) {
          return next(
            new ErrorHandler(
              `Insufficient stock for "${product.title}". Available: ${product.stockQuantity}`,
              400
            )
          );
        }

        const price = cartItem.price;
        itemsPrice += price * cartItem.quantity;

        orderItems.push({
          product: product._id,
          name: product.title,
          image: product.images?.[0]?.url || "",
          price,
          quantity: cartItem.quantity,
          variantSku: cartItem.variantSku,
        });
      }

      // 4. Calculate Financials
      const discountPrice = cart.couponDiscount || 0;
      const taxableAmount = Math.max(0, itemsPrice - discountPrice);
      const taxPrice = Math.round(taxableAmount * 0.18 * 100) / 100;
      const shippingPrice = itemsPrice > 500 ? 0 : 50;
      const totalPrice = Math.round((taxableAmount + taxPrice + shippingPrice) * 100) / 100;

      // 5. Generate unique human-readable order number
      const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 6. Decrement Product Stock
      for (const item of orderItems) {
        await ProductModel.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: -item.quantity },
        });
      }

      // 7. Determine initial payment & order status
      const paymentMethod = paymentInfo?.method || "razorpay";
      const isPaid = paymentMethod === "razorpay" && paymentInfo?.signature;

      const order = await EcommerceOrderModel.create({
        orderNumber,
        userId,
        items: orderItems,
        shippingAddress: finalShippingAddress,
        paymentInfo: {
          id: paymentInfo?.id,
          orderId: paymentInfo?.orderId,
          signature: paymentInfo?.signature,
          method: paymentMethod,
          status: isPaid ? "paid" : "pending",
          paidAt: isPaid ? new Date() : undefined,
        },
        itemsPrice,
        taxPrice,
        shippingPrice,
        discountPrice,
        totalPrice,
        orderStatus: isPaid ? "Confirmed" : "Processing",
      });

      // 8. Clear user's cart
      cart.items = [];
      cart.appliedCoupon = undefined;
      cart.couponDiscount = 0;
      await cart.save();

      // 9. Send In-App Notification
      await NotificationModel.create({
        user: userId,
        title: "Order Placed Successfully",
        message: `Your order #${orderNumber} for ₹${totalPrice} has been placed.`,
      });

      // 10. Send Order Confirmation Email
      try {
        if (req.user?.email) {
          const mailData = {
            order: {
              _id: order.orderNumber,
              name: orderItems.map(i => `${i.name} (x${i.quantity})`).join(", "),
              price: totalPrice,
              date: new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
          };
          await sendMail({
            email: req.user.email,
            subject: `Order Confirmation - #${orderNumber}`,
            template: "order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (mailErr: any) {
        console.error("Order confirmation email error:", mailErr.message);
      }

      res.status(201).json({
        success: true,
        message: "Order placed successfully",
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Authenticated User's Orders
export const getMyEcommerceOrders = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const orders = await EcommerceOrderModel.find({ userId }).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Single Order Details (User or Admin)
export const getSingleEcommerceOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const role = req.user?.role;

      const order = await EcommerceOrderModel.findById(id).populate(
        "items.product",
        "title slug images sku"
      );

      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      // Check ownership
      if (role !== "admin" && order.userId.toString() !== userId?.toString()) {
        return next(new ErrorHandler("Access denied to this order", 403));
      }

      res.status(200).json({
        success: true,
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Cancel Order (User or Admin)
export const cancelEcommerceOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?._id;
      const role = req.user?.role;

      const order = await EcommerceOrderModel.findById(id);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (role !== "admin" && order.userId.toString() !== userId?.toString()) {
        return next(new ErrorHandler("Unauthorized to cancel this order", 403));
      }

      if (["Shipped", "OutForDelivery", "Delivered"].includes(order.orderStatus)) {
        return next(
          new ErrorHandler(`Order cannot be cancelled in '${order.orderStatus}' state`, 400)
        );
      }

      if (order.orderStatus === "Cancelled") {
        return next(new ErrorHandler("Order is already cancelled", 400));
      }

      // Restock inventory
      for (const item of order.items) {
        await ProductModel.findByIdAndUpdate(item.product, {
          $inc: { stockQuantity: item.quantity },
        });
      }

      order.orderStatus = "Cancelled";
      order.cancelledAt = new Date();
      order.cancellationReason = reason || "User requested cancellation";
      await order.save();

      res.status(200).json({
        success: true,
        message: "Order cancelled and items returned to stock",
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get All Orders (Admin Dashboard)
export const getAllOrdersAdmin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const query: any = {};
      if (status) {
        query.orderStatus = status;
      }

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Number(limit));
      const skip = (pageNum - 1) * limitNum;

      const totalOrders = await EcommerceOrderModel.countDocuments(query);
      const orders = await EcommerceOrderModel.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.status(200).json({
        success: true,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limitNum),
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update Order Status (Admin only)
export const updateOrderStatusAdmin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status, trackingNumber, courierPartner } = req.body;

      const order = await EcommerceOrderModel.findById(id);
      if (!order) {
        return next(new ErrorHandler("Order not found", 404));
      }

      if (status) {
        order.orderStatus = status;
        if (status === "Shipped") order.shippedAt = new Date();
        if (status === "Delivered") {
          order.deliveredAt = new Date();
          if (order.paymentInfo.method === "cod") {
            order.paymentInfo.status = "paid";
            order.paymentInfo.paidAt = new Date();
          }
        }
      }

      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (courierPartner) order.courierPartner = courierPartner;

      await order.save();

      // Send notification to user
      await NotificationModel.create({
        user: order.userId,
        title: `Order Status: ${order.orderStatus}`,
        message: `Your order #${order.orderNumber} is now ${order.orderStatus}.${
          trackingNumber ? ` Tracking: ${trackingNumber} (${courierPartner || "Standard"})` : ""
        }`,
      });

      res.status(200).json({
        success: true,
        message: "Order status updated successfully",
        order,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
