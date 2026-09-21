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
exports.moveWishlistToCart = exports.toggleWishlist = exports.getMyWishlist = void 0;
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const wishlist_model_1 = __importDefault(require("../models/wishlist.model"));
const cart_model_1 = __importDefault(require("../models/cart.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
// Get Wishlist
exports.getMyWishlist = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        let wishlist = yield wishlist_model_1.default.findOne({ userId }).populate({
            path: "products.product",
            select: "title slug price discountPrice images inStock stockQuantity",
        });
        if (!wishlist) {
            wishlist = yield wishlist_model_1.default.create({ userId, products: [] });
        }
        res.status(200).json({
            success: true,
            wishlist,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Toggle Product in Wishlist
exports.toggleWishlist = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
        const { productId } = req.body;
        if (!productId) {
            return next(new ErrorHandler_1.default("Product ID is required", 400));
        }
        let wishlist = yield wishlist_model_1.default.findOne({ userId });
        if (!wishlist) {
            wishlist = yield wishlist_model_1.default.create({ userId, products: [] });
        }
        const existingIndex = wishlist.products.findIndex(p => p.product.toString() === productId);
        let action = "added";
        if (existingIndex > -1) {
            wishlist.products.splice(existingIndex, 1);
            action = "removed";
        }
        else {
            wishlist.products.push({
                product: productId,
                addedAt: new Date(),
            });
        }
        yield wishlist.save();
        res.status(200).json({
            success: true,
            message: `Product ${action} ${action === "added" ? "to" : "from"} wishlist`,
            action,
            count: wishlist.products.length,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Move from Wishlist to Cart
exports.moveWishlistToCart = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const { productId } = req.params;
        const product = yield product_model_1.default.findById(productId);
        if (!product || !product.inStock) {
            return next(new ErrorHandler_1.default("Product is not available in stock", 400));
        }
        // 1. Remove from Wishlist
        yield wishlist_model_1.default.findOneAndUpdate({ userId }, { $pull: { products: { product: productId } } });
        // 2. Add to Cart
        let cart = yield cart_model_1.default.findOne({ userId });
        if (!cart) {
            cart = yield cart_model_1.default.create({
                userId,
                items: [
                    {
                        product: product._id,
                        quantity: 1,
                        price: product.discountPrice || product.price,
                    },
                ],
            });
        }
        else {
            const itemIndex = cart.items.findIndex(i => i.product.toString() === productId);
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity += 1;
            }
            else {
                cart.items.push({
                    product: product._id,
                    quantity: 1,
                    price: product.discountPrice || product.price,
                });
            }
            yield cart.save();
        }
        res.status(200).json({
            success: true,
            message: "Product moved from wishlist to cart",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=wishlist.controller.js.map