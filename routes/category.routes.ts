import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth";
import {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
  createBrand,
  getAllBrands,
} from "../controllers/category.controller";

const categoryRouter = express.Router();

// Public routes
categoryRouter.get("/all", getAllCategories);
categoryRouter.get("/single/:idOrSlug", getSingleCategory);
categoryRouter.get("/brands/all", getAllBrands);

// Admin-protected routes
categoryRouter.post(
  "/create",
  isAuthenticated,
  authorizeRoles("admin"),
  createCategory
);

categoryRouter.put(
  "/update/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateCategory
);

categoryRouter.delete(
  "/delete/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCategory
);

categoryRouter.post(
  "/brand/create",
  isAuthenticated,
  authorizeRoles("admin"),
  createBrand
);

export default categoryRouter;
