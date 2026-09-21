import { Request, Response, NextFunction } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import CartModel from "../models/cart.model";
import ProductModel from "../models/product.model";

// Helper to calculate totals
const computeCartTotals = (cart: any) => {
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
export const getMyCart = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      let cart = await CartModel.findOne({ userId }).populate({
        path: "items.product",
        select: "title slug price discountPrice images stockQuantity inStock sku",
      });

      if (!cart) {
        cart = await CartModel.create({ userId, items: [] });
      }

      const totals = computeCartTotals(cart);

      res.status(200).json({
        success: true,
        cart,
        summary: totals,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add Item to Cart
export const addToCart = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { productId, variantSku, quantity = 1 } = req.body;

      if (!productId) {
        return next(new ErrorHandler("Product ID is required", 400));
      }

      const product = await ProductModel.findById(productId);
      if (!product || !product.isPublished) {
        return next(new ErrorHandler("Product not found or unavailable", 404));
      }

      if (!product.inStock || product.stockQuantity < quantity) {
        return next(
          new ErrorHandler(`Only ${product.stockQuantity} items in stock`, 400)
        );
      }

      const itemPrice = product.discountPrice || product.price;

      let cart = await CartModel.findOne({ userId });
      if (!cart) {
        cart = await CartModel.create({
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
      } else {
        const existingItemIndex = cart.items.findIndex(
          item =>
            item.product.toString() === productId &&
            (item.variantSku || "") === (variantSku || "")
        );

        if (existingItemIndex > -1) {
          const newQty = cart.items[existingItemIndex].quantity + Number(quantity);
          if (newQty > product.stockQuantity) {
            return next(
              new ErrorHandler(`Cannot add more. Max stock is ${product.stockQuantity}`, 400)
            );
          }
          cart.items[existingItemIndex].quantity = newQty;
          cart.items[existingItemIndex].price = itemPrice; // update to latest price
        } else {
          cart.items.push({
            product: product._id as any,
            variantSku: variantSku || undefined,
            quantity: Number(quantity),
            price: itemPrice,
          });
        }
        await cart.save();
      }

      const updatedCart = await CartModel.findById(cart._id).populate({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Update Quantity
export const updateCartItemQuantity = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { itemId, quantity } = req.body;

      if (!itemId || quantity === undefined) {
        return next(new ErrorHandler("Item ID and quantity are required", 400));
      }

      const cart = await CartModel.findOne({ userId });
      if (!cart) {
        return next(new ErrorHandler("Cart not found", 404));
      }

      const item = cart.items.find((i: any) => i._id.toString() === itemId);
      if (!item) {
        return next(new ErrorHandler("Item not found in cart", 404));
      }

      const product = await ProductModel.findById(item.product);
      if (!product) {
        return next(new ErrorHandler("Product no longer exists", 404));
      }

      if (Number(quantity) <= 0) {
        // Remove item if quantity is 0 or negative
        cart.items = cart.items.filter((i: any) => i._id.toString() !== itemId);
      } else {
        if (Number(quantity) > product.stockQuantity) {
          return next(
            new ErrorHandler(`Only ${product.stockQuantity} items in stock`, 400)
          );
        }
        item.quantity = Number(quantity);
      }

      await cart.save();

      const updatedCart = await CartModel.findById(cart._id).populate({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Remove Item from Cart
export const removeCartItem = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { itemId } = req.params;

      const cart = await CartModel.findOne({ userId });
      if (!cart) {
        return next(new ErrorHandler("Cart not found", 404));
      }

      cart.items = cart.items.filter((i: any) => i._id.toString() !== itemId);
      await cart.save();

      const updatedCart = await CartModel.findById(cart._id).populate({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Clear Cart
export const clearCart = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      await CartModel.findOneAndUpdate(
        { userId },
        { items: [], appliedCoupon: undefined, couponDiscount: 0 }
      );

      res.status(200).json({
        success: true,
        message: "Cart cleared successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Merge Guest Cart into User Cart on Login
export const mergeGuestCart = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const { guestItems } = req.body; // Array of { productId, variantSku, quantity }

      if (!guestItems || !Array.isArray(guestItems)) {
        return next(new ErrorHandler("guestItems array is required", 400));
      }

      let cart = await CartModel.findOne({ userId });
      if (!cart) {
        cart = await CartModel.create({ userId, items: [] });
      }

      for (const gItem of guestItems) {
        const product = await ProductModel.findById(gItem.productId);
        if (product && product.inStock) {
          const itemPrice = product.discountPrice || product.price;
          const existingIndex = cart.items.findIndex(
            i =>
              i.product.toString() === gItem.productId &&
              (i.variantSku || "") === (gItem.variantSku || "")
          );

          if (existingIndex > -1) {
            cart.items[existingIndex].quantity = Math.min(
              cart.items[existingIndex].quantity + (gItem.quantity || 1),
              product.stockQuantity
            );
          } else {
            cart.items.push({
              product: product._id as any,
              variantSku: gItem.variantSku,
              quantity: Math.min(gItem.quantity || 1, product.stockQuantity),
              price: itemPrice,
            });
          }
        }
      }

      await cart.save();

      const updatedCart = await CartModel.findById(cart._id).populate({
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
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
