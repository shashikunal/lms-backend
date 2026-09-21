import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  getMyWishlist,
  toggleWishlist,
  moveWishlistToCart,
} from "../controllers/wishlist.controller";

const wishlistRouter = express.Router();

wishlistRouter.use(isAuthenticated);

wishlistRouter.get("/", getMyWishlist);
wishlistRouter.post("/toggle", toggleWishlist);
wishlistRouter.post("/move-to-cart/:productId", moveWishlistToCart);

export default wishlistRouter;
