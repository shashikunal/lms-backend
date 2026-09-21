import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  addProductReview,
  getProductReviews,
  voteReviewHelpful,
  deleteProductReview,
} from "../controllers/productReview.controller";

const productReviewRouter = express.Router();

// Public routes
productReviewRouter.get("/product/:productId", getProductReviews);

// Authenticated user routes
productReviewRouter.post("/add", isAuthenticated, addProductReview);
productReviewRouter.put("/helpful/:id", isAuthenticated, voteReviewHelpful);
productReviewRouter.delete("/delete/:id", isAuthenticated, deleteProductReview);

export default productReviewRouter;
