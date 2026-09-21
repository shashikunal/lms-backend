"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRazorpayInstance = void 0;
const Razorpay = require("razorpay");
const index_1 = require("./index");
let instance = null;
const getRazorpayInstance = () => {
    if (!instance) {
        const key_id = index_1.CONFIG.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
        const key_secret = index_1.CONFIG.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
        instance = new Razorpay({
            key_id,
            key_secret,
        });
    }
    return instance;
};
exports.getRazorpayInstance = getRazorpayInstance;
//# sourceMappingURL=razorpay.js.map