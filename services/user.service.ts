import { Response } from "express";
import { redis } from "../utils/redis";
import userModel from "../models/user.model";

//get user by id
export const getUserById = async (id: string, res: Response) => {
  try {
    let user: any = null;
    const userJson = await redis.get(id);
    if (userJson) {
      user = JSON.parse(userJson || "{}");
    } else {
      user = await userModel.findById(id).select("-password");
      if (user) {
        await redis.set(id, JSON.stringify(user), "EX", 604800).catch(() => {});
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.password) {
      delete user.password;
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
