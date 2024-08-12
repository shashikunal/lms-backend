import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";
import { CONFIG } from "./../config/index";

interface ITokenOptions {
  expires: Date;
  httpOnly: boolean;
  secure?: boolean;
  maxAge?: number;
  sameSite?: "lax" | "strict" | "none" | undefined;
}

//parse environment variables
export const accessTokenExpire = parseInt(
  CONFIG.ACCESS_TOKEN_EXPIRE || "300",
  10
);
const refreshTokenExpire = parseInt(CONFIG.REFRESH_TOKEN_EXPIRE || "1200", 10);

//options for cookies
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  httpOnly: true,
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  sameSite: "lax",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  httpOnly: true,
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  sameSite: "lax",
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  //upload session for redis
  redis.set(user._id as string, JSON.stringify(user) as any);

  //only set secure to true in production
  if (CONFIG.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
    refreshTokenOptions.secure = true;
  }
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(statusCode).json({
    success: true,
    accessToken,
    user,
  });
};
