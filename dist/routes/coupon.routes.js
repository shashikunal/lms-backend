"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const coupon_controller_1 = require("../controllers/coupon.controller");
const couponRouter = express_1.default.Router();
couponRouter.use(auth_1.isAuthenticated);
// User routes
couponRouter.post("/apply", coupon_controller_1.applyCoupon);
couponRouter.post("/remove", coupon_controller_1.removeCoupon);
// Admin routes
couponRouter.post("/create", (0, auth_1.authorizeRoles)("admin"), coupon_controller_1.createCoupon);
couponRouter.get("/all", (0, auth_1.authorizeRoles)("admin"), coupon_controller_1.getAllCoupons);
couponRouter.delete("/delete/:id", (0, auth_1.authorizeRoles)("admin"), coupon_controller_1.deleteCoupon);
exports.default = couponRouter;
//# sourceMappingURL=coupon.routes.js.map