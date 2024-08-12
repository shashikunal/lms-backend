import { NextFunction, Response } from "express";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import { createOrder } from "../controllers/order.controller";
import OrderModel from "../models/orderModel";

//create new order
export const newOrder = CatchAsyncErrors(
  async (data: any, res: Response, next: NextFunction) => {
    const order = await OrderModel.create(data);
    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  }
);

//get ALl Orders
export const getAllOrderService = async (res: Response) => {
  const orders = await OrderModel.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    orders,
  });
};
