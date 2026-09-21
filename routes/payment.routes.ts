import express from "express";
import { isAuthenticated, authorizeRoles } from "../middlewares/auth";
import {
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  processRefund,
} from "../controllers/payment.controller";

const paymentRouter = express.Router();

// Public key retrieval
paymentRouter.get("/razorpay-key", getRazorpayKey);

// Webhook endpoint (public with signature verification inside controller)
paymentRouter.post("/webhook", razorpayWebhook);

// Authenticated user routes
paymentRouter.post("/razorpay-order", isAuthenticated, createRazorpayOrder);
paymentRouter.post("/verify", isAuthenticated, verifyRazorpayPayment);

// Admin-only refund endpoint
paymentRouter.post(
  "/refund",
  isAuthenticated,
  authorizeRoles("admin"),
  processRefund
);

export default paymentRouter;
