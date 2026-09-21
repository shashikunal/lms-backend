const Razorpay = require("razorpay");
import { CONFIG } from "./index";

let instance: any = null;

export const getRazorpayInstance = () => {
  if (!instance) {
    const key_id = CONFIG.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
    const key_secret = CONFIG.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    
    instance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return instance;
};
