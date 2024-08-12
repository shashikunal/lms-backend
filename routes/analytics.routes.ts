import express from "express";
import {
  getCourseAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from "../controllers/analytics.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

const analyticsRouter = express.Router();

analyticsRouter.get(
  "/get-users-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getUserAnalytics
);

analyticsRouter.get(
  "/get-course-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getCourseAnalytics
);
analyticsRouter.get(
  "/get-order-analytics",
  isAuthenticated,
  authorizeRoles("admin"),
  getOrderAnalytics
);

export default analyticsRouter;
