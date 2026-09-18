import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CONFIG } from "../config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CatchAsyncErrors } from "./catchAsyncErrors";
import { redis } from "../utils/redis";

import userModel from "../models/user.model";

//authenticated user
export const isAuthenticated = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    let access_token = req.cookies?.access_token as string;
    const authHeader = req.headers?.authorization;

    // Check Bearer token in Authorization header first
    if (authHeader && authHeader.startsWith("Bearer ")) {
      access_token = authHeader.split(" ")[1];
    }

    if (!access_token) {
      console.log("Authentication failed: Missing Authorization header and access_token cookie");
      return next(
        new ErrorHandler("Login first to access this resource.", 401)
      );
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(
        access_token,
        CONFIG.ACCESS_TOKEN as string
      ) as JwtPayload;
    } catch (err: any) {
      console.log("Authentication failed: Invalid or expired JWT -", err.message);
      return next(new ErrorHandler("access token is not valid.", 401));
    }

    if (!decoded || !decoded.id) {
      console.log("Authentication failed: Decoded JWT missing user id", decoded);
      return next(new ErrorHandler("access token is not valid.", 401));
    }

    req.userId = decoded.id;
    console.log("Decoded JWT:", decoded);
    console.log("User ID:", req.userId);

    // Check Redis session cache first
    let user: any = null;
    try {
      const cachedUser = await redis.get(decoded.id);
      if (cachedUser) {
        user = JSON.parse(cachedUser);
      }
    } catch (redisErr: any) {
      console.warn("Redis read warning in auth middleware:", redisErr?.message || redisErr);
    }

    // Fall back to MongoDB if Redis misses or is read-only / stateless
    if (!user) {
      user = await userModel.findById(decoded.id).select("-password");
      if (user) {
        try {
          await redis.set(decoded.id, JSON.stringify(user), "EX", 604800);
        } catch {
          // Ignore cache write errors (e.g. read-only redis)
        }
      }
    }

    if (!user) {
      console.log(`Authentication failed: User with ID ${decoded.id} not found in database`);
      return next(new ErrorHandler("Unauthorized || user not found", 401));
    }

    if (user.password) {
      delete user.password;
    }

    req.user = user;
    console.log("Authenticated user:", user.email || user._id);
    next();
  }
);
//validate use role

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request | any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `Role: ${req.user?.role} is not allowed to access this resource.`,
          403
        )
      );
    }
    next();
  };
};
