import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth";
import {
  createEcommerceOrder,
  getMyEcommerceOrders,
  getSingleEcommerceOrder,
  cancelEcommerceOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
} from "../controllers/ecommerceOrder.controller";

const ecommerceOrderRouter = express.Router();

ecommerceOrderRouter.use(isAuthenticated);

// User-accessible order routes
ecommerceOrderRouter.post("/create", createEcommerceOrder);
ecommerceOrderRouter.get("/my-orders", getMyEcommerceOrders);
ecommerceOrderRouter.get("/single/:id", getSingleEcommerceOrder);
ecommerceOrderRouter.put("/cancel/:id", cancelEcommerceOrder);

// Admin-only order routes
ecommerceOrderRouter.get(
  "/admin/all",
  authorizeRoles("admin"),
  getAllOrdersAdmin
);

ecommerceOrderRouter.put(
  ["/admin/update-status/:id", "/admin/status/:id"],
  authorizeRoles("admin"),
  updateOrderStatusAdmin
);

export default ecommerceOrderRouter;
