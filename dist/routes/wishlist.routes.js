"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const wishlist_controller_1 = require("../controllers/wishlist.controller");
const wishlistRouter = express_1.default.Router();
wishlistRouter.use(auth_1.isAuthenticated);
wishlistRouter.get("/", wishlist_controller_1.getMyWishlist);
wishlistRouter.post("/toggle", wishlist_controller_1.toggleWishlist);
wishlistRouter.post("/move-to-cart/:productId", wishlist_controller_1.moveWishlistToCart);
exports.default = wishlistRouter;
//# sourceMappingURL=wishlist.routes.js.map