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
exports.processRefund = exports.razorpayWebhook = exports.verifyRazorpayPayment = exports.createRazorpayOrder = exports.getRazorpayKey = void 0;
const crypto_1 = __importDefault(require("crypto"));
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const config_1 = require("../config");
const razorpay_1 = require("../config/razorpay");
const cart_model_1 = __importDefault(require("../models/cart.model"));
const ecommerceOrder_model_1 = __importDefault(require("../models/ecommerceOrder.model"));
// Get Razorpay Public Key
exports.getRazorpayKey = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({
        success: true,
        key: config_1.CONFIG.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
    });
}));
// Create Razorpay Order
exports.createRazorpayOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { amount, receipt } = req.body;
        let payableAmount = Number(amount);
        // If amount not explicitly passed, compute directly from user's cart for security
        if (!payableAmount || payableAmount <= 0) {
            const cart = yield cart_model_1.default.findOne({ userId });
            if (!cart || cart.items.length === 0) {
                return next(new ErrorHandler_1.default("Cart is empty", 400));
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
        const razorpay = (0, razorpay_1.getRazorpayInstance)();
        const amountInPaise = Math.round(payableAmount * 100);
        const options = {
            amount: amountInPaise,
            currency: "INR",
            receipt: receipt || `rcpt_${Date.now()}`,
            notes: {
                userId: userId === null || userId === void 0 ? void 0 : userId.toString(),
            },
        };
        let razorpayOrder;
        try {
            const razorpay = (0, razorpay_1.getRazorpayInstance)();
            razorpayOrder = yield razorpay.orders.create(options);
        }
        catch (rzpErr) {
            if (((_b = config_1.CONFIG.RAZORPAY_KEY_ID) === null || _b === void 0 ? void 0 : _b.includes("placeholder")) ||
                !config_1.CONFIG.RAZORPAY_KEY_SECRET ||
                ((_c = config_1.CONFIG.RAZORPAY_KEY_SECRET) === null || _c === void 0 ? void 0 : _c.includes("placeholder")) ||
                process.env.NODE_ENV !== "production") {
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
            }
            else {
                throw rzpErr;
            }
        }
        res.status(200).json({
            success: true,
            order: razorpayOrder,
            amount: payableAmount,
            currency: "INR",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Cryptographic Signature Verification
exports.verifyRazorpayPayment = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return next(new ErrorHandler_1.default("Missing required payment verification parameters", 400));
        }
        const secret = config_1.CONFIG.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto_1.default
            .createHmac("sha256", secret)
            .update(body.toString())
            .digest("hex");
        const isAuthentic = expectedSignature === razorpay_signature;
        if (!isAuthentic) {
            return next(new ErrorHandler_1.default("Payment verification failed! Invalid signature", 400));
        }
        res.status(200).json({
            success: true,
            message: "Payment successfully verified",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Razorpay Webhook Handler
exports.razorpayWebhook = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d, _e, _f, _g;
    try {
        const webhookSecret = config_1.CONFIG.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || "";
        if (webhookSecret) {
            const signature = req.headers["x-razorpay-signature"];
            const shasum = crypto_1.default.createHmac("sha256", webhookSecret);
            shasum.update(JSON.stringify(req.body));
            const digest = shasum.digest("hex");
            if (digest !== signature) {
                return res.status(400).json({ status: "invalid signature" });
            }
        }
        const event = (_d = req.body) === null || _d === void 0 ? void 0 : _d.event;
        const paymentEntity = (_g = (_f = (_e = req.body) === null || _e === void 0 ? void 0 : _e.payload) === null || _f === void 0 ? void 0 : _f.payment) === null || _g === void 0 ? void 0 : _g.entity;
        if (event === "payment.captured") {
            if (!paymentEntity) {
                return res.status(400).json({ success: false, message: "Missing payment entity in payload" });
            }
            // Find order by razorpay_order_id and mark paid if not already
            yield ecommerceOrder_model_1.default.findOneAndUpdate({ "paymentInfo.orderId": paymentEntity.order_id }, {
                "paymentInfo.status": "paid",
                "paymentInfo.id": paymentEntity.id,
                "paymentInfo.paidAt": new Date(),
                orderStatus: "Confirmed",
            });
        }
        else if (event === "payment.failed") {
            if (!paymentEntity) {
                return res.status(400).json({ success: false, message: "Missing payment entity in payload" });
            }
            yield ecommerceOrder_model_1.default.findOneAndUpdate({ "paymentInfo.orderId": paymentEntity.order_id }, {
                "paymentInfo.status": "failed",
            });
        }
        res.status(200).json({ status: "ok" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Admin Process Refund
exports.processRefund = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { paymentId, amount } = req.body;
        if (!paymentId) {
            return next(new ErrorHandler_1.default("Payment ID is required for refund", 400));
        }
        const razorpay = (0, razorpay_1.getRazorpayInstance)();
        const refundOptions = {};
        if (amount) {
            refundOptions.amount = Math.round(Number(amount) * 100);
        }
        const refund = yield razorpay.payments.refund(paymentId, refundOptions);
        res.status(200).json({
            success: true,
            message: "Refund initiated successfully",
            refund,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=payment.controller.js.map