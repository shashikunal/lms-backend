"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const product_controller_1 = require("../controllers/product.controller");
const productRouter = express_1.default.Router();
// Public routes
productRouter.get("/all", product_controller_1.getAllProducts);
productRouter.get("/featured", product_controller_1.getFeaturedProducts);
productRouter.get("/single/:idOrSlug", product_controller_1.getSingleProduct);
productRouter.get("/related/:id", product_controller_1.getRelatedProducts);
// Admin-only routes
productRouter.post("/create", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), product_controller_1.createProduct);
productRouter.put("/update/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), product_controller_1.updateProduct);
productRouter.delete("/delete/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), product_controller_1.deleteProduct);
exports.default = productRouter;
//# sourceMappingURL=product.routes.js.map