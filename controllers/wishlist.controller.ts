import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import WishlistModel from "../models/wishlist.model";
import CartModel from "../models/cart.model";
import ProductModel from "../models/product.model";

// Get Wishlist
export const getMyWishlist = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      let wishlist = await WishlistModel.findOne({ userId }).populate({
        path: "products.product",
        select: "title slug price discountPrice images inStock stockQuantity",
      });

      if (!wishlist) {
        wishlist = await WishlistModel.create({ userId, products: [] });
      }

      res.status(200).json({
        success: true,
        wishlist,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Toggle Product in Wishlist
export const toggleWishlist = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { productId } = req.body;

      if (!productId) {
        return next(new ErrorHandler("Product ID is required", 400));
      }

      let wishlist = await WishlistModel.findOne({ userId });
      if (!wishlist) {
        wishlist = await WishlistModel.create({ userId, products: [] });
      }

      const existingIndex = wishlist.products.findIndex(
        p => p.product.toString() === productId
      );

      let action = "added";
      if (existingIndex > -1) {
        wishlist.products.splice(existingIndex, 1);
        action = "removed";
      } else {
        wishlist.products.push({
          product: productId,
          addedAt: new Date(),
        } as any);
      }

      await wishlist.save();

      res.status(200).json({
        success: true,
        message: `Product ${action} ${action === "added" ? "to" : "from"} wishlist`,
        action,
        count: wishlist.products.length,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Move from Wishlist to Cart
export const moveWishlistToCart = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { productId } = req.params;

      const product = await ProductModel.findById(productId);
      if (!product || !product.inStock) {
        return next(new ErrorHandler("Product is not available in stock", 400));
      }

      // 1. Remove from Wishlist
      await WishlistModel.findOneAndUpdate(
        { userId },
        { $pull: { products: { product: productId } } }
      );

      // 2. Add to Cart
      let cart = await CartModel.findOne({ userId });
      if (!cart) {
        cart = await CartModel.create({
          userId,
          items: [
            {
              product: product._id,
              quantity: 1,
              price: product.discountPrice || product.price,
            },
          ],
        });
      } else {
        const itemIndex = cart.items.findIndex(
          i => i.product.toString() === productId
        );
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity += 1;
        } else {
          cart.items.push({
            product: product._id as any,
            quantity: 1,
            price: product.discountPrice || product.price,
          });
        }
        await cart.save();
      }

      res.status(200).json({
        success: true,
        message: "Product moved from wishlist to cart",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
