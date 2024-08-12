import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { CONFIG } from "../config";
import jwt, { JwtPayload } from "jsonwebtoken";
import { CatchAsyncErrors } from "./catchAsyncErrors";
import { redis } from "../utils/redis";

//authenticated user
export const isAuthenticated = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;
    if (!access_token) {
      return next(
        new ErrorHandler("Login first to access this resource.", 401)
      );
    }

    const decoded = jwt.verify(
      access_token,
      CONFIG.ACCESS_TOKEN as string
    ) as JwtPayload;

    if (!decoded) {
      return next(new ErrorHandler("access token is not valid.", 401));
    }

    const user = await redis.get(decoded.id);
    if (!user) {
      return next(new ErrorHandler("Unauthorized || user not found", 401));
    }
    req.user = JSON.parse(user);
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
