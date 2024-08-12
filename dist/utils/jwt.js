"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendToken = exports.refreshTokenOptions = exports.accessTokenOptions = exports.accessTokenExpire = void 0;
const redis_1 = require("./redis");
const index_1 = require("./../config/index");
//parse environment variables
exports.accessTokenExpire = parseInt(index_1.CONFIG.ACCESS_TOKEN_EXPIRE || "300", 10);
const refreshTokenExpire = parseInt(index_1.CONFIG.REFRESH_TOKEN_EXPIRE || "1200", 10);
//options for cookies
exports.accessTokenOptions = {
    expires: new Date(Date.now() + exports.accessTokenExpire * 60 * 60 * 1000),
    httpOnly: true,
    maxAge: exports.accessTokenExpire * 60 * 60 * 1000,
    sameSite: "lax",
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
    httpOnly: true,
    maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
    sameSite: "lax",
};
const sendToken = (user, statusCode, res) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();
    //upload session for redis
    redis_1.redis.set(user._id, JSON.stringify(user));
    //only set secure to true in production
    if (index_1.CONFIG.NODE_ENV === "production") {
        exports.accessTokenOptions.secure = true;
        exports.refreshTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(statusCode).json({
        success: true,
        accessToken,
        user,
    });
};
exports.sendToken = sendToken;
