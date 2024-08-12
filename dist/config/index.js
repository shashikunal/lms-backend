"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
require("dotenv").config();
exports.CONFIG = {
    PORT: process.env.PORT || 8000,
    DB_URI: process.env.DB_URI,
    ORIGIN: process.env.ORIGIN,
    REDIS_URL: process.env.REDIS_URL,
    CLOUDINARY_API: process.env.CLOUDINARY_API,
    CLOUDINARY_SECRET: process.env.CLOUDINARY_SECRET,
    CLOUD_NAME: process.env.CLOUD_NAME,
    NODE_ENV: process.env.NODE_ENV,
    ACTIVATION_TOKEN_SECRET: process.env.ACTIVATION_TOKEN_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SERVICE: process.env.SMTP_SERVICE,
    SMTP_MAIL: process.env.SMTP_MAIL,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
    ACCESS_TOKEN: process.env.ACCESS_TOKEN,
    REFRESH_TOKEN: process.env.REFRESH_TOKEN,
    ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE,
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE,
};
