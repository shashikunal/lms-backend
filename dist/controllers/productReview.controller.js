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
exports.deleteProductReview = exports.voteReviewHelpful = exports.getProductReviews = exports.addProductReview = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const productReview_model_1 = __importDefault(require("../models/productReview.model"));
const product_model_1 = __importDefault(require("../models/product.model"));
const ecommerceOrder_model_1 = __importDefault(require("../models/ecommerceOrder.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
// Add Product Review
exports.addProductReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const { productId, rating, title, comment, images } = req.body;
        if (!productId || !rating || !comment) {
            return next(new ErrorHandler_1.default("Product ID, rating, and comment are required", 400));
        }
        const product = yield product_model_1.default.findById(productId);
        if (!product) {
            return next(new ErrorHandler_1.default("Product not found", 404));
        }
        // Check if user already reviewed this product
        const alreadyReviewed = yield productReview_model_1.default.findOne({
            product: productId,
            user: userId,
        });
        if (alreadyReviewed) {
            return next(new ErrorHandler_1.default("You have already reviewed this product", 400));
        }
        // Check if user is a verified purchaser (has delivered order for this product)
        const verifiedOrder = yield ecommerceOrder_model_1.default.findOne({
            userId,
            "items.product": productId,
            orderStatus: "Delivered",
        });
        const isVerifiedPurchase = !!verifiedOrder;
        // Handle images upload
        const uploadedImages = [];
        if (images && Array.isArray(images)) {
            for (const img of images) {
                if (typeof img === "string") {
                    const myCloud = yield cloudinary_1.default.v2.uploader.upload(img, {
                        folder: "ecommerce/reviews",
                    });
                    uploadedImages.push({
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    });
                }
            }
        }
        const review = yield productReview_model_1.default.create({
            product: productId,
            user: userId,
            userName: ((_b = req.user) === null || _b === void 0 ? void 0 : _b.name) || "Customer",
            userAvatar: (_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.avatar) === null || _d === void 0 ? void 0 : _d.url,
            rating: Number(rating),
            title,
            comment,
            images: uploadedImages,
            isVerifiedPurchase,
        });
        // Recalculate Product average rating
        const reviews = yield productReview_model_1.default.find({ product: productId });
        const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
        product.ratings = Math.round((totalRating / reviews.length) * 10) / 10;
        product.numOfReviews = reviews.length;
        yield product.save();
        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Get All Reviews for a Product (Public)
exports.getProductReviews = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { productId } = req.params;
        if (!productId || !mongoose_1.default.Types.ObjectId.isValid(productId)) {
            return next(new ErrorHandler_1.default("Invalid product ID", 400));
        }
        const { page = 1, limit = 10 } = req.query;
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.max(1, Number(limit));
        const skip = (pageNum - 1) * limitNum;
        const totalReviews = yield productReview_model_1.default.countDocuments({ product: productId });
        const reviews = yield productReview_model_1.default.find({ product: productId })
            .sort({ isVerifiedPurchase: -1, helpfulVotes: -1, createdAt: -1 })
            .skip(skip)
            .limit(limitNum);
        res.status(200).json({
            success: true,
            totalReviews,
            totalPages: Math.ceil(totalReviews / limitNum),
            reviews,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Vote Helpful on a Review
exports.voteReviewHelpful = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const review = yield productReview_model_1.default.findByIdAndUpdate(id, { $inc: { helpfulVotes: 1 } }, { new: true });
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        res.status(200).json({
            success: true,
            helpfulVotes: review.helpfulVotes,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// Delete Review (Owner or Admin)
exports.deleteProductReview = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const { id } = req.params;
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        const role = (_f = req.user) === null || _f === void 0 ? void 0 : _f.role;
        const review = yield productReview_model_1.default.findById(id);
        if (!review) {
            return next(new ErrorHandler_1.default("Review not found", 404));
        }
        if (role !== "admin" && review.user.toString() !== (userId === null || userId === void 0 ? void 0 : userId.toString())) {
            return next(new ErrorHandler_1.default("Unauthorized to delete this review", 403));
        }
        const productId = review.product;
        yield review.deleteOne();
        // Recalculate Product average rating
        const reviews = yield productReview_model_1.default.find({ product: productId });
        const product = yield product_model_1.default.findById(productId);
        if (product) {
            if (reviews.length > 0) {
                const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
                product.ratings = Math.round((totalRating / reviews.length) * 10) / 10;
            }
            else {
                product.ratings = 0;
            }
            product.numOfReviews = reviews.length;
            yield product.save();
        }
        res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//# sourceMappingURL=productReview.controller.js.map