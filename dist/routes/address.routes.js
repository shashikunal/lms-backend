"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const address_controller_1 = require("../controllers/address.controller");
const addressRouter = express_1.default.Router();
addressRouter.use(auth_1.isAuthenticated); // All address operations require authentication
addressRouter.post("/add", address_controller_1.addAddress);
addressRouter.get("/my-addresses", address_controller_1.getMyAddresses);
addressRouter.put("/update/:id", address_controller_1.updateAddress);
addressRouter.delete("/delete/:id", address_controller_1.deleteAddress);
addressRouter.put("/set-default/:id", address_controller_1.setDefaultAddress);
exports.default = addressRouter;
//# sourceMappingURL=address.routes.js.map