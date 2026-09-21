import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth";
import {
  createCoupon,
  getAllCoupons,
  applyCoupon,
  removeCoupon,
  deleteCoupon,
} from "../controllers/coupon.controller";

const couponRouter = express.Router();

couponRouter.use(isAuthenticated);

// User routes
couponRouter.post("/apply", applyCoupon);
couponRouter.post("/remove", removeCoupon);

// Admin routes
couponRouter.post("/create", authorizeRoles("admin"), createCoupon);
couponRouter.get("/all", authorizeRoles("admin"), getAllCoupons);
couponRouter.delete("/delete/:id", authorizeRoles("admin"), deleteCoupon);

export default couponRouter;
