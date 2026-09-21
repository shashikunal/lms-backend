"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const cart_controller_1 = require("../controllers/cart.controller");
const cartRouter = express_1.default.Router();
cartRouter.use(auth_1.isAuthenticated);
cartRouter.get("/", cart_controller_1.getMyCart);
cartRouter.post("/add", cart_controller_1.addToCart);
cartRouter.put("/update-quantity", cart_controller_1.updateCartItemQuantity);
cartRouter.delete("/item/:itemId", cart_controller_1.removeCartItem);
cartRouter.delete("/clear", cart_controller_1.clearCart);
cartRouter.post("/merge", cart_controller_1.mergeGuestCart);
exports.default = cartRouter;
//# sourceMappingURL=cart.routes.js.map