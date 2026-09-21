import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  getMyCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  mergeGuestCart,
} from "../controllers/cart.controller";

const cartRouter = express.Router();

cartRouter.use(isAuthenticated);

cartRouter.get("/", getMyCart);
cartRouter.post("/add", addToCart);
cartRouter.put("/update-quantity", updateCartItemQuantity);
cartRouter.delete("/item/:itemId", removeCartItem);
cartRouter.delete("/clear", clearCart);
cartRouter.post("/merge", mergeGuestCart);

export default cartRouter;
