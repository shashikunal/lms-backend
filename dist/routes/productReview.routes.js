"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const productReview_controller_1 = require("../controllers/productReview.controller");
const productReviewRouter = express_1.default.Router();
// Public routes
productReviewRouter.get("/product/:productId", productReview_controller_1.getProductReviews);
// Authenticated user routes
productReviewRouter.post("/add", auth_1.isAuthenticated, productReview_controller_1.addProductReview);
productReviewRouter.put("/helpful/:id", auth_1.isAuthenticated, productReview_controller_1.voteReviewHelpful);
productReviewRouter.delete("/delete/:id", auth_1.isAuthenticated, productReview_controller_1.deleteProductReview);
exports.default = productReviewRouter;
//# sourceMappingURL=productReview.routes.js.map