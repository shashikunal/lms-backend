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
exports.mergeGuestCart = exports.clearCart = exports.removeCartItem = exports.updateCartItemQuantity = exports.addToCart = exports.getMyCart = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const cart_model_1 = __importDefault(require("../models/cart.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
// Helper to calculate totals
const computeCartTotals = (cart) => {
    let subtotal = 0;
    for (const item of cart.items) {
        subtotal += item.price * item.quantity;
    }
    const discount = cart.couponDiscount || 0;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Math.round(taxableAmount * 0.18 * 100) / 100; // 18% standard GST
    const shipping = subtotal > 500 || subtotal === 0 ? 0 : 50; // Free shipping over 500
    const grandTotal = Math.max(0, taxableAmount + tax + shipping);
    return {
        subtotal,
        discount,
        tax,
        shipping,
        grandTotal: Math.round(grandTotal * 100) / 100,
    };
};
// Get User Cart
exports.getMyCart = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let cart = yield cart_model_1.default.findOne({ userId }).populate({
            path: "items.product",
            select: "title slug price discountPrice images stockQuantity inStock sku",
        });
        if (!cart) {
            cart = yield cart_model_1.default.create({ userId, items: [] });
        }
        const totals = computeCartTotals(cart);
        res.status(200).json({
            success: true,
            cart,
            summary: totals,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Add Item to Cart
exports.addToCart = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const { productId, variantSku, quantity = 1 } = req.body;
        if (!productId) {
            return next(new ErrorHandler_1.default("Product ID is required", 400));
        }
        const product = yield product_model_1.default.findById(productId);
        if (!product || !product.isPublished) {
            return next(new ErrorHandler_1.default("Product not found or unavailable", 404));
        }
        if (!product.inStock || product.stockQuantity < quantity) {
            return next(new ErrorHandler_1.default(`Only ${product.stockQuantity} items in stock`, 400));
        }
        const itemPrice = product.discountPrice || product.price;
        let cart = yield cart_model_1.default.findOne({ userId });
        if (!cart) {
            cart = yield cart_model_1.default.create({
                userId,
                items: [
                    {
                        product: product._id,
                        variantSku: variantSku || undefined,
                        quantity: Number(quantity),
                        price: itemPrice,
                    },
                ],
            });
        }
        else {
            const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId &&
                (item.variantSku || "") === (variantSku || ""));
            if (existingItemIndex > -1) {
                const newQty = cart.items[existingItemIndex].quantity + Number(quantity);
                if (newQty > product.stockQuantity) {
                    return next(new ErrorHandler_1.default(`Cannot add more. Max stock is ${product.stockQuantity}`, 400));
                }
                cart.items[existingItemIndex].quantity = newQty;
                cart.items[existingItemIndex].price = itemPrice; // update to latest price
            }
            else {
                cart.items.push({
                    product: product._id,
                    variantSku: variantSku || undefined,
                    quantity: Number(quantity),
                    price: itemPrice,
                });
            }
            yield cart.save();
        }
        const updatedCart = yield cart_model_1.default.findById(cart._id).populate({
            path: "items.product",
            select: "title slug price discountPrice images stockQuantity inStock sku",
        });
        const totals = computeCartTotals(updatedCart);
        res.status(200).json({
            success: true,
            message: "Item added to cart",
            cart: updatedCart,
            summary: totals,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Update Quantity
exports.updateCartItemQuantity = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const { itemId, quantity } = req.body;
        if (!itemId || quantity === undefined) {
            return next(new ErrorHandler_1.default("Item ID and quantity are required", 400));
        }
        const cart = yield cart_model_1.default.findOne({ userId });
        if (!cart) {
            return next(new ErrorHandler_1.default("Cart not found", 404));
        }
        const item = cart.items.find((i) => i._id.toString() === itemId);
        if (!item) {
            return next(new ErrorHandler_1.default("Item not found in cart", 404));
        }
        const product = yield product_model_1.default.findById(item.product);
        if (!product) {
            return next(new ErrorHandler_1.default("Product no longer exists", 404));
        }
        if (Number(quantity) <= 0) {
            // Remove item if quantity is 0 or negative
            cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
        }
        else {
            if (Number(quantity) > product.stockQuantity) {
                return next(new ErrorHandler_1.default(`Only ${product.stockQuantity} items in stock`, 400));
            }
            item.quantity = Number(quantity);
        }
        yield cart.save();
        const updatedCart = yield cart_model_1.default.findById(cart._id).populate({
            path: "items.product",
            select: "title slug price discountPrice images stockQuantity inStock sku",
        });
        const totals = computeCartTotals(updatedCart);
        res.status(200).json({
            success: true,
            message: "Cart updated",
            cart: updatedCart,
            summary: totals,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Remove Item from Cart
exports.removeCartItem = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        const { itemId } = req.params;
        const cart = yield cart_model_1.default.findOne({ userId });
        if (!cart) {
            return next(new ErrorHandler_1.default("Cart not found", 404));
        }
        cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
        yield cart.save();
        const updatedCart = yield cart_model_1.default.findById(cart._id).populate({
            path: "items.product",
            select: "title slug price discountPrice images stockQuantity inStock sku",
        });
        const totals = computeCartTotals(updatedCart);
        res.status(200).json({
            success: true,
            message: "Item removed from cart",
            cart: updatedCart,
            summary: totals,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Clear Cart
exports.clearCart = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        yield cart_model_1.default.findOneAndUpdate({ userId }, { items: [], appliedCoupon: undefined, couponDiscount: 0 });
        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Merge Guest Cart into User Cart on Login
exports.mergeGuestCart = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const userId = (_f = req.user) === null || _f === void 0 ? void 0 : _f._id;
        const { guestItems } = req.body; // Array of { productId, variantSku, quantity }
        if (!guestItems || !Array.isArray(guestItems)) {
            return next(new ErrorHandler_1.default("guestItems array is required", 400));
        }
        let cart = yield cart_model_1.default.findOne({ userId });
        if (!cart) {
            cart = yield cart_model_1.default.create({ userId, items: [] });
        }
        for (const gItem of guestItems) {
            const product = yield product_model_1.default.findById(gItem.productId);
            if (product && product.inStock) {
                const itemPrice = product.discountPrice || product.price;
                const existingIndex = cart.items.findIndex(i => i.product.toString() === gItem.productId &&
                    (i.variantSku || "") === (gItem.variantSku || ""));
                if (existingIndex > -1) {
                    cart.items[existingIndex].quantity = Math.min(cart.items[existingIndex].quantity + (gItem.quantity || 1), product.stockQuantity);
                }
                else {
                    cart.items.push({
                        product: product._id,
                        variantSku: gItem.variantSku,
                        quantity: Math.min(gItem.quantity || 1, product.stockQuantity),
                        price: itemPrice,
                    });
                }
            }
        }
        yield cart.save();
        const updatedCart = yield cart_model_1.default.findById(cart._id).populate({
            path: "items.product",
            select: "title slug price discountPrice images stockQuantity inStock sku",
        });
        const totals = computeCartTotals(updatedCart);
        res.status(200).json({
            success: true,
            message: "Cart merged successfully",
            cart: updatedCart,
            summary: totals,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=cart.controller.js.map