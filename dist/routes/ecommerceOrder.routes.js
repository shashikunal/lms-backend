"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const ecommerceOrder_controller_1 = require("../controllers/ecommerceOrder.controller");
const ecommerceOrderRouter = express_1.default.Router();
ecommerceOrderRouter.use(auth_1.isAuthenticated);
// User-accessible order routes
ecommerceOrderRouter.post("/create", ecommerceOrder_controller_1.createEcommerceOrder);
ecommerceOrderRouter.get("/my-orders", ecommerceOrder_controller_1.getMyEcommerceOrders);
ecommerceOrderRouter.get("/single/:id", ecommerceOrder_controller_1.getSingleEcommerceOrder);
ecommerceOrderRouter.put("/cancel/:id", ecommerceOrder_controller_1.cancelEcommerceOrder);
// Admin-only order routes
ecommerceOrderRouter.get("/admin/all", (0, auth_1.authorizeRoles)("admin"), ecommerceOrder_controller_1.getAllOrdersAdmin);
ecommerceOrderRouter.put(["/admin/update-status/:id", "/admin/status/:id"], (0, auth_1.authorizeRoles)("admin"), ecommerceOrder_controller_1.updateOrderStatusAdmin);
exports.default = ecommerceOrderRouter;
//# sourceMappingURL=ecommerceOrder.routes.js.map