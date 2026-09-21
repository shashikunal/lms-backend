import express from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  addAddress,
  getMyAddresses,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/address.controller";

const addressRouter = express.Router();

addressRouter.use(isAuthenticated); // All address operations require authentication

addressRouter.post("/add", addAddress);
addressRouter.get("/my-addresses", getMyAddresses);
addressRouter.put("/update/:id", updateAddress);
addressRouter.delete("/delete/:id", deleteAddress);
addressRouter.put("/set-default/:id", setDefaultAddress);

export default addressRouter;
