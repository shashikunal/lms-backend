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
exports.deleteCoupon = exports.removeCoupon = exports.applyCoupon = exports.getAllCoupons = exports.createCoupon = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const coupon_model_1 = __importDefault(require("../models/coupon.model"));
const cart_model_1 = __importDefault(require("../models/cart.model"));
// Create Coupon (Admin)
exports.createCoupon = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
            return next(new ErrorHandler_1.default("Code, discount type, value, and expiration date are required", 400));
        }
        const existing = yield coupon_model_1.default.findOne({ code: code.toUpperCase().trim() });
        if (existing) {
            return next(new ErrorHandler_1.default("Coupon code already exists", 400));
        }
        const coupon = yield coupon_model_1.default.create({
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
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get All Coupons (Admin)
exports.getAllCoupons = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const coupons = yield coupon_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: coupons.length,
            coupons,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Apply Coupon to Cart
exports.applyCoupon = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { code } = req.body;
        if (!code) {
            return next(new ErrorHandler_1.default("Please enter a coupon code", 400));
        }
        const coupon = yield coupon_model_1.default.findOne({
            code: code.toUpperCase().trim(),
            isActive: true,
        });
        if (!coupon) {
            return next(new ErrorHandler_1.default("Invalid coupon code", 404));
        }
        const now = new Date();
        if (now < coupon.startDate || now > coupon.endDate) {
            return next(new ErrorHandler_1.default("Coupon has expired or is not yet active", 400));
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return next(new ErrorHandler_1.default("Coupon usage limit reached", 400));
        }
        const cart = yield cart_model_1.default.findOne({ userId });
        if (!cart || cart.items.length === 0) {
            return next(new ErrorHandler_1.default("Your cart is empty", 400));
        }
        // Calculate subtotal
        let subtotal = 0;
        for (const item of cart.items) {
            subtotal += item.price * item.quantity;
        }
        if (subtotal < coupon.minOrderAmount) {
            return next(new ErrorHandler_1.default(`Minimum order amount to apply this coupon is ₹${coupon.minOrderAmount}`, 400));
        }
        // Calculate discount
        let discount = 0;
        if (coupon.discountType === "percentage") {
            discount = (subtotal * coupon.discountValue) / 100;
            if (coupon.maxDiscountLimit && discount > coupon.maxDiscountLimit) {
                discount = coupon.maxDiscountLimit;
            }
        }
        else {
            discount = coupon.discountValue;
        }
        discount = Math.min(discount, subtotal);
        cart.appliedCoupon = coupon.code;
        cart.couponDiscount = Math.round(discount * 100) / 100;
        yield cart.save();
        res.status(200).json({
            success: true,
            message: `Coupon '${coupon.code}' applied! You saved ₹${cart.couponDiscount}`,
            discount: cart.couponDiscount,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Remove Coupon from Cart
exports.removeCoupon = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const cart = yield cart_model_1.default.findOne({ userId });
        if (!cart) {
            return next(new ErrorHandler_1.default("Cart not found", 404));
        }
        cart.appliedCoupon = undefined;
        cart.couponDiscount = 0;
        yield cart.save();
        res.status(200).json({
            success: true,
            message: "Coupon removed successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Delete Coupon (Admin)
exports.deleteCoupon = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const coupon = yield coupon_model_1.default.findByIdAndDelete(id);
        if (!coupon) {
            return next(new ErrorHandler_1.default("Coupon not found", 404));
        }
        res.status(200).json({
            success: true,
            message: "Coupon deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=coupon.controller.js.map