import { Response } from "express";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";

//get user by id
export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson || "{}");
    res.status(201).json({
      success: true,
      user,
    });
  }
};

//get ALl Users
export const getAllUsersService = async (res: Response) => {
  // const users = await redis.keys("*");
  // const usersData = await Promise.all(
  //   users.map(async user => {
  //     const userJson = await redis.get(user);
  //     return JSON.parse(userJson || "{}");
  //   })
  // );
  const users = await userModel.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    users,
  });
};
//update user roles
export const updateUserRolesService = async (
  res: Response,
  id: string,
  role: string
) => {
  const user = await userModel.findByIdAndUpdate(id, { role }, { new: true });
  res.status(200).json({
    success: true,
    user,
  });
};
