"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeInstance = void 0;
const stripe_1 = __importDefault(require("stripe"));
const index_1 = require("./index");
let instance = null;
const getStripeInstance = () => {
    if (!instance) {
        const secretKey = index_1.CONFIG.STRIPE_SECRET_KEY ||
            process.env.STRIPE_SECRET_KEY ||
            "sk_test_placeholder";
        instance = new stripe_1.default(secretKey, {
            apiVersion: "2025-02-24.acacia",
        });
    }
    return instance;
};
exports.getStripeInstance = getStripeInstance;
//# sourceMappingURL=stripe.js.map