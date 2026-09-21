"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const category_controller_1 = require("../controllers/category.controller");
const categoryRouter = express_1.default.Router();
// Public routes
categoryRouter.get("/all", category_controller_1.getAllCategories);
categoryRouter.get("/single/:idOrSlug", category_controller_1.getSingleCategory);
categoryRouter.get("/brands/all", category_controller_1.getAllBrands);
// Admin-protected routes
categoryRouter.post("/create", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), category_controller_1.createCategory);
categoryRouter.put("/update/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), category_controller_1.updateCategory);
categoryRouter.delete("/delete/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), category_controller_1.deleteCategory);
categoryRouter.post("/brand/create", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), category_controller_1.createBrand);
exports.default = categoryRouter;
//# sourceMappingURL=category.routes.js.map