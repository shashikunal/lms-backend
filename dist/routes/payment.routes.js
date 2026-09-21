"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const payment_controller_1 = require("../controllers/payment.controller");
const paymentRouter = express_1.default.Router();
// Public key retrieval
paymentRouter.get("/razorpay-key", payment_controller_1.getRazorpayKey);
// Webhook endpoint (public with signature verification inside controller)
paymentRouter.post("/webhook", payment_controller_1.razorpayWebhook);
// Authenticated user routes
paymentRouter.post("/razorpay-order", auth_1.isAuthenticated, payment_controller_1.createRazorpayOrder);
paymentRouter.post("/verify", auth_1.isAuthenticated, payment_controller_1.verifyRazorpayPayment);
// Admin-only refund endpoint
paymentRouter.post("/refund", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), payment_controller_1.processRefund);
exports.default = paymentRouter;
//# sourceMappingURL=payment.routes.js.map