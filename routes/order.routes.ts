import express from "express";

import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  createOrder,
  getAllOrderDashboard,
} from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);

orderRouter.get(
  "/get-all-order-dashboard",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrderDashboard
);

export default orderRouter;
