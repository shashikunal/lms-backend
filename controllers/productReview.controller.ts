import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import ProductReviewModel from "../models/productReview.model";
import ProductModel from "../models/product.model";
import EcommerceOrderModel from "../models/ecommerceOrder.model";
import cloudinary from "cloudinary";

// Add Product Review
export const addProductReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { productId, rating, title, comment, images } = req.body;

      if (!productId || !rating || !comment) {
        return next(new ErrorHandler("Product ID, rating, and comment are required", 400));
      }

      const product = await ProductModel.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Check if user already reviewed this product
      const alreadyReviewed = await ProductReviewModel.findOne({
        product: productId,
        user: userId,
      });

      if (alreadyReviewed) {
        return next(
          new ErrorHandler("You have already reviewed this product", 400)
        );
      }

      // Check if user is a verified purchaser (has delivered order for this product)
      const verifiedOrder = await EcommerceOrderModel.findOne({
        userId,
        "items.product": productId,
        orderStatus: "Delivered",
      });
      const isVerifiedPurchase = !!verifiedOrder;

      // Handle images upload
      const uploadedImages: Array<{ public_id: string; url: string }> = [];
      if (images && Array.isArray(images)) {
        for (const img of images) {
          if (typeof img === "string") {
            const myCloud = await cloudinary.v2.uploader.upload(img, {
              folder: "ecommerce/reviews",
            });
            uploadedImages.push({
              public_id: myCloud.public_id,
              url: myCloud.secure_url,
            });
          }
        }
      }

      const review = await ProductReviewModel.create({
        product: productId,
        user: userId,
        userName: req.user?.name || "Customer",
        userAvatar: req.user?.avatar?.url,
        rating: Number(rating),
        title,
        comment,
        images: uploadedImages,
        isVerifiedPurchase,
      });

      // Recalculate Product average rating
      const reviews = await ProductReviewModel.find({ product: productId });
      const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
      product.ratings = Math.round((totalRating / reviews.length) * 10) / 10;
      product.numOfReviews = reviews.length;
      await product.save();

      res.status(201).json({
        success: true,
        message: "Review submitted successfully",
        review,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get All Reviews for a Product (Public)
export const getProductReviews = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { productId } = req.params;

      if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return next(new ErrorHandler("Invalid product ID", 400));
      }

      const { page = 1, limit = 10 } = req.query;

      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Number(limit));
      const skip = (pageNum - 1) * limitNum;

      const totalReviews = await ProductReviewModel.countDocuments({ product: productId });
      const reviews = await ProductReviewModel.find({ product: productId })
        .sort({ isVerifiedPurchase: -1, helpfulVotes: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      res.status(200).json({
        success: true,
        totalReviews,
        totalPages: Math.ceil(totalReviews / limitNum),
        reviews,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Vote Helpful on a Review
export const voteReviewHelpful = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const review = await ProductReviewModel.findByIdAndUpdate(
        id,
        { $inc: { helpfulVotes: 1 } },
        { new: true }
      );

      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      res.status(200).json({
        success: true,
        helpfulVotes: review.helpfulVotes,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Delete Review (Owner or Admin)
export const deleteProductReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user?._id;
      const role = req.user?.role;

      const review = await ProductReviewModel.findById(id);
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }

      if (role !== "admin" && review.user.toString() !== userId?.toString()) {
        return next(new ErrorHandler("Unauthorized to delete this review", 403));
      }

      const productId = review.product;
      await review.deleteOne();

      // Recalculate Product average rating
      const reviews = await ProductReviewModel.find({ product: productId });
      const product = await ProductModel.findById(productId);
      if (product) {
        if (reviews.length > 0) {
          const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
          product.ratings = Math.round((totalRating / reviews.length) * 10) / 10;
        } else {
          product.ratings = 0;
        }
        product.numOfReviews = reviews.length;
        await product.save();
      }

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
