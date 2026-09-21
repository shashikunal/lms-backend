"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatusAdmin = exports.getAllOrdersAdmin = exports.cancelEcommerceOrder = exports.getSingleEcommerceOrder = exports.getMyEcommerceOrders = exports.createEcommerceOrder = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const ecommerceOrder_model_1 = __importDefault(require("../models/ecommerceOrder.model"));
const cart_model_1 = __importDefault(require("../models/cart.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const address_model_1 = __importDefault(require("../models/address.model"));
const notificationModel_1 = __importDefault(require("../models/notificationModel"));
const sendMail_1 = __importDefault(require("../utils/sendMail"));
// Create Order from Cart or Direct Items
exports.createEcommerceOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const addressId = req.body.addressId || req.body.shippingAddressId;
        const { shippingAddress, paymentInfo } = req.body;
        // 1. Resolve Shipping Address
        let finalShippingAddress;
        if (addressId) {
            const savedAddress = yield address_model_1.default.findOne({ _id: addressId, userId });
            if (!savedAddress) {
                return next(new ErrorHandler_1.default("Selected shipping address not found", 404));
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
        }
        else if (shippingAddress) {
            finalShippingAddress = shippingAddress;
        }
        else {
            return next(new ErrorHandler_1.default("Shipping address is required", 400));
        }
        // 2. Fetch User's Cart
        const cart = yield cart_model_1.default.findOne({ userId }).populate({
            path: "items.product",
            select: "title slug price discountPrice images stockQuantity inStock sku",
        });
        if (!cart || cart.items.length === 0) {
            return next(new ErrorHandler_1.default("Your cart is empty", 400));
        }
        // 3. Validate Stock & Prepare Order Items
        const orderItems = [];
        let itemsPrice = 0;
        for (const cartItem of cart.items) {
            const product = cartItem.product;
            if (!product) {
                return next(new ErrorHandler_1.default("One of the products in your cart was deleted", 400));
            }
            if (product.stockQuantity < cartItem.quantity) {
                return next(new ErrorHandler_1.default(`Insufficient stock for "${product.title}". Available: ${product.stockQuantity}`, 400));
            }
            const price = cartItem.price;
            itemsPrice += price * cartItem.quantity;
            orderItems.push({
                product: product._id,
                name: product.title,
                image: ((_c = (_b = product.images) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) || "",
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
            yield product_model_1.default.findByIdAndUpdate(item.product, {
                $inc: { stockQuantity: -item.quantity },
            });
        }
        // 7. Determine initial payment & order status
        const paymentMethod = (paymentInfo === null || paymentInfo === void 0 ? void 0 : paymentInfo.method) || "razorpay";
        const isPaid = paymentMethod === "razorpay" && (paymentInfo === null || paymentInfo === void 0 ? void 0 : paymentInfo.signature);
        const order = yield ecommerceOrder_model_1.default.create({
            orderNumber,
            userId,
            items: orderItems,
            shippingAddress: finalShippingAddress,
            paymentInfo: {
                id: paymentInfo === null || paymentInfo === void 0 ? void 0 : paymentInfo.id,
                orderId: paymentInfo === null || paymentInfo === void 0 ? void 0 : paymentInfo.orderId,
                signature: paymentInfo === null || paymentInfo === void 0 ? void 0 : paymentInfo.signature,
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
        yield cart.save();
        // 9. Send In-App Notification
        yield notificationModel_1.default.create({
            user: userId,
            title: "Order Placed Successfully",
            message: `Your order #${orderNumber} for ₹${totalPrice} has been placed.`,
        });
        // 10. Send Order Confirmation Email
        try {
            if ((_d = req.user) === null || _d === void 0 ? void 0 : _d.email) {
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
                yield (0, sendMail_1.default)({
                    email: req.user.email,
                    subject: `Order Confirmation - #${orderNumber}`,
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (mailErr) {
            console.error("Order confirmation email error:", mailErr.message);
        }
        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            order,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Authenticated User's Orders
exports.getMyEcommerceOrders = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        const orders = yield ecommerceOrder_model_1.default.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get Single Order Details (User or Admin)
exports.getSingleEcommerceOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    try {
        const { id } = req.params;
        const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
        const role = (_g = req.user) === null || _g === void 0 ? void 0 : _g.role;
        const order = yield ecommerceOrder_model_1.default.findById(id).populate("items.product", "title slug images sku");
        if (!order) {
            return next(new ErrorHandler_1.default("Order not found", 404));
        }
        // Check ownership
        if (role !== "admin" && order.userId.toString() !== (userId === null || userId === void 0 ? void 0 : userId.toString())) {
            return next(new ErrorHandler_1.default("Access denied to this order", 403));
        }
        res.status(200).json({
            success: true,
            order,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Cancel Order (User or Admin)
exports.cancelEcommerceOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h, _j;
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = (_h = req.user) === null || _h === void 0 ? void 0 : _h._id;
        const role = (_j = req.user) === null || _j === void 0 ? void 0 : _j.role;
        const order = yield ecommerceOrder_model_1.default.findById(id);
        if (!order) {
            return next(new ErrorHandler_1.default("Order not found", 404));
        }
        if (role !== "admin" && order.userId.toString() !== (userId === null || userId === void 0 ? void 0 : userId.toString())) {
            return next(new ErrorHandler_1.default("Unauthorized to cancel this order", 403));
        }
        if (["Shipped", "OutForDelivery", "Delivered"].includes(order.orderStatus)) {
            return next(new ErrorHandler_1.default(`Order cannot be cancelled in '${order.orderStatus}' state`, 400));
        }
        if (order.orderStatus === "Cancelled") {
            return next(new ErrorHandler_1.default("Order is already cancelled", 400));
        }
        // Restock inventory
        for (const item of order.items) {
            yield product_model_1.default.findByIdAndUpdate(item.product, {
                $inc: { stockQuantity: item.quantity },
            });
        }
        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();
        order.cancellationReason = reason || "User requested cancellation";
        yield order.save();
        res.status(200).json({
            success: true,
            message: "Order cancelled and items returned to stock",
            order,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get All Orders (Admin Dashboard)
exports.getAllOrdersAdmin = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) {
            query.orderStatus = status;
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const totalOrders = yield ecommerceOrder_model_1.default.countDocuments(query);
        const orders = yield ecommerceOrder_model_1.default.find(query)
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Update Order Status (Admin only)
exports.updateOrderStatusAdmin = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { status, trackingNumber, courierPartner } = req.body;
        const order = yield ecommerceOrder_model_1.default.findById(id);
        if (!order) {
            return next(new ErrorHandler_1.default("Order not found", 404));
        }
        if (status) {
            order.orderStatus = status;
            if (status === "Shipped")
                order.shippedAt = new Date();
            if (status === "Delivered") {
                order.deliveredAt = new Date();
                if (order.paymentInfo.method === "cod") {
                    order.paymentInfo.status = "paid";
                    order.paymentInfo.paidAt = new Date();
                }
            }
        }
        if (trackingNumber)
            order.trackingNumber = trackingNumber;
        if (courierPartner)
            order.courierPartner = courierPartner;
        yield order.save();
        // Send notification to user
        yield notificationModel_1.default.create({
            user: order.userId,
            title: `Order Status: ${order.orderStatus}`,
            message: `Your order #${order.orderNumber} is now ${order.orderStatus}.${trackingNumber ? ` Tracking: ${trackingNumber} (${courierPartner || "Standard"})` : ""}`,
        });
        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=ecommerceOrder.controller.js.map