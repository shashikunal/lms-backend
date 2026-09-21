import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth";
import {
  createProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getRelatedProducts,
} from "../controllers/product.controller";

const productRouter = express.Router();

// Public routes
productRouter.get("/all", getAllProducts);
productRouter.get("/featured", getFeaturedProducts);
productRouter.get("/single/:idOrSlug", getSingleProduct);
productRouter.get("/related/:id", getRelatedProducts);

// Admin-only routes
productRouter.post(
  "/create",
  isAuthenticated,
  authorizeRoles("admin"),
  createProduct
);

productRouter.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateProduct
);

productRouter.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteProduct
);

export default productRouter;
