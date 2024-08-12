"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const analytics_controller_1 = require("../controllers/analytics.controller");
const auth_1 = require("../middlewares/auth");
const analyticsRouter = express_1.default.Router();
analyticsRouter.get("/get-users-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getUserAnalytics);
analyticsRouter.get("/get-course-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getCourseAnalytics);
analyticsRouter.get("/get-order-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getOrderAnalytics);
exports.default = analyticsRouter;
