import Stripe from "stripe";
import { CONFIG } from "./index";

let instance: Stripe | null = null;

export const getStripeInstance = (): Stripe => {
  if (!instance) {
    const secretKey =
      CONFIG.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY ||
      "sk_test_placeholder";

    instance = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return instance;
};
