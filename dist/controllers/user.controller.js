"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAllUserSessions = exports.revokeUserSession = exports.getUserSessions = exports.disableTwoFactor = exports.verifyTwoFactor = exports.setupTwoFactor = exports.resetPassword = exports.forgotPassword = exports.deleteUserByAdmin = exports.updateUserRoles = exports.getAllUsersDashboard = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
const crypto_1 = __importDefault(require("crypto"));
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("./../config/index");
const sendMail_1 = __importDefault(require("../utils/sendMail"));
const jwt_1 = require("../utils/jwt");
const redis_1 = require("../utils/redis");
const user_service_1 = require("../services/user.service");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registrationUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, avatar } = req.body;
        const isEmailExits = yield user_model_1.default.findOne({ email });
        if (isEmailExits) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        const user = {
            name,
            email,
            password,
        };
        const activationToken = (0, exports.createActivationToken)(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode };
        try {
            const mailUrl = yield (0, sendMail_1.default)({
                email: user.email,
                subject: "Account Activation",
                template: "activation.email.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your ${user.email} address to activate your account!`,
                activationToken: activationToken.token,
                activationCode: activationCode,
                mailSent: true,
                mailUrl: mailUrl || "https://ethereal.email/messages",
            });
        }
        catch (error) {
            // SMTP delivery is best-effort: still hand out the activation
            // credentials so signup works when mail is unreachable.
            console.warn("Activation email skipped:", (error === null || error === void 0 ? void 0 : error.message) || error);
            res.status(201).json({
                success: true,
                message: `Account created for ${user.email}. Use the activation code to activate (email delivery unavailable).`,
                activationToken: activationToken.token,
                activationCode: activationCode,
                mailSent: false,
            });
        }
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error, 500));
    }
}));
const createActivationToken = (user) => {
    const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jsonwebtoken_1.default.sign({ user, activationCode }, index_1.CONFIG.ACTIVATION_TOKEN_SECRET, { expiresIn: "5m" });
    return { token, activationCode };
};
exports.createActivationToken = createActivationToken;
exports.activateUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { activation_code, activation_token } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activation_token, index_1.CONFIG.ACTIVATION_TOKEN_SECRET);
        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password } = newUser.user;
        const exitsUser = yield user_model_1.default.findOne({ email });
        if (exitsUser) {
            return next(new ErrorHandler_1.default("Email already exists", 400));
        }
        const user = yield user_model_1.default.create({ name, email, password });
        res.status(201).json({
            success: true,
            message: "User activated successfully",
        });
    }
    catch (error) {
        // Invalid/expired activation tokens are client errors, not 500s.
        const status = (error === null || error === void 0 ? void 0 : error.name) === "JsonWebTokenError" || (error === null || error === void 0 ? void 0 : error.name) === "TokenExpiredError"
            ? 400
            : 500;
        return next(new ErrorHandler_1.default(error.message, status));
    }
}));
exports.loginUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new ErrorHandler_1.default("Invalid email or password", 401));
        }
        const isPasswordMatched = yield user.comparePassword(password);
        if (!isPasswordMatched) {
            return next(new ErrorHandler_1.default("Invalid email or password", 401));
        }
        user.password = undefined;
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//logout user
exports.logoutUser = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        res.cookie("access_token", null || "", {
            expires: new Date(Date.now()),
            httpOnly: true,
            maxAge: 1,
        });
        res.cookie("refresh_token", null || "", {
            expires: new Date(Date.now()),
            httpOnly: true,
            maxAge: 1,
        });
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id) || "";
        redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//update access token
exports.updateAccessToken = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const refresh_token = req.cookies.refresh_token;
        if (!refresh_token) {
            return next(new ErrorHandler_1.default("Please login again to continue", 400));
        }
        const decoded = jsonwebtoken_1.default.verify(refresh_token, index_1.CONFIG.REFRESH_TOKEN);
        const message = "Please login again to continue";
        if (!decoded || !decoded.id) {
            return next(new ErrorHandler_1.default(message, 401));
        }
        let userData = null;
        const session = yield redis_1.redis.get(decoded.id);
        if (session) {
            userData = JSON.parse(session);
        }
        else {
            userData = yield user_model_1.default.findById(decoded.id).select("-password");
        }
        if (!userData) {
            return next(new ErrorHandler_1.default(message, 401));
        }
        const expire = index_1.CONFIG.ACCESS_TOKEN_EXPIRE;
        const expiresIn = typeof expire === "string" && !isNaN(Number(expire))
            ? `${expire}m`
            : expire || "3d";
        const accessToken = jsonwebtoken_1.default.sign({ id: (userData._id || userData.id).toString() }, index_1.CONFIG.ACCESS_TOKEN, { expiresIn: expiresIn });
        const refreshToken = jsonwebtoken_1.default.sign({ id: (userData._id || userData.id).toString() }, index_1.CONFIG.REFRESH_TOKEN, { expiresIn: "7d" });
        req.user = userData;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        yield redis_1.redis.set(userData._id, JSON.stringify(userData), "EX", 604800); //7days;
        res.status(200).json({
            success: true,
            accessToken,
            message: "Access token updated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// getUserInfo
exports.getUserInfo = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        if (req.user) {
            const userObj = typeof req.user.toObject === "function"
                ? req.user.toObject()
                : Object.assign({}, req.user);
            delete userObj.password;
            return res.status(200).json({
                success: true,
                user: userObj,
            });
        }
        const userId = req.userId || ((_b = req.user) === null || _b === void 0 ? void 0 : _b._id);
        if (!userId) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        yield (0, user_service_1.getUserById)(userId, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.socialAuth = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, name, avatar } = req.body;
        let user = yield user_model_1.default.findOne({ email });
        if (!user) {
            user = yield user_model_1.default.create({ email, name, avatar });
        }
        (0, jwt_1.sendToken)(user, 200, res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.updateUserInfo = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const { name, email } = req.body;
        const userId = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
        const user = yield user_model_1.default.findByIdAndUpdate(userId);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        // if (email && user) {
        //   const isEmailExit = await userModel.findOne({ email });
        //   if (isEmailExit) {
        //     return next(new ErrorHandler("Email already exists", 400));
        //   }
        //   user.email = email;
        // }
        if (name && user) {
            user.name = name;
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.updatePassword = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d._id;
        const user = yield user_model_1.default.findById(userId).select("+password");
        if ((user === null || user === void 0 ? void 0 : user.password) === undefined) {
            return next(new ErrorHandler_1.default("password not available", 400));
        }
        if (!oldPassword || !newPassword) {
            return next(new ErrorHandler_1.default("Please enter old and new password", 400));
        }
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        const isPasswordMatched = yield (user === null || user === void 0 ? void 0 : user.comparePassword(oldPassword));
        if (!isPasswordMatched) {
            return next(new ErrorHandler_1.default("Old password is incorrect", 401));
        }
        user.password = newPassword;
        yield user.save();
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "Password updated successfully",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.updateProfilePicture = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    try {
        const { avatar } = req.body;
        const userId = (_e = req.user) === null || _e === void 0 ? void 0 : _e._id;
        const user = yield user_model_1.default.findById(userId);
        if (avatar && user) {
            if ((_f = userId === null || userId === void 0 ? void 0 : userId.avatar) === null || _f === void 0 ? void 0 : _f.public_id) {
                //delete old image
                yield cloudinary_1.default.v2.uploader.destroy(userId.avatar.public_id);
                //update new image
                yield cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "lms-avatar",
                    width: 150,
                });
            }
            else {
                const myCloud = yield cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "lms-avatar",
                    width: 150,
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
        }
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        yield (user === null || user === void 0 ? void 0 : user.save());
        yield redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully",
            user,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//get All users
exports.getAllUsersDashboard = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, user_service_1.getAllUsersService)(res);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//update user roles
exports.updateUserRoles = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, role } = req.body;
        (0, user_service_1.updateUserRolesService)(res, id, role);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
//delete user bt Admin
exports.deleteUserByAdmin = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield user_model_1.default.findById(id);
        if (!user) {
            return next(new ErrorHandler_1.default("User not found", 404));
        }
        yield user_model_1.default.findByIdAndDelete(id);
        yield redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.forgotPassword = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        if (!email)
            return next(new ErrorHandler_1.default("Email is required", 400));
        const user = yield user_model_1.default.findOne({ email });
        if (!user)
            return next(new ErrorHandler_1.default("User not found", 404));
        const resetToken = jsonwebtoken_1.default.sign({ id: user._id.toString() }, index_1.CONFIG.ACTIVATION_TOKEN_SECRET, { expiresIn: "10m" });
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                subject: "Password Reset Request",
                template: "password-reset.ejs",
                data: { name: user.name, resetUrl },
            });
        }
        catch (err) {
            console.warn("Password reset email skipped:", (err === null || err === void 0 ? void 0 : err.message) || err);
        }
        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email",
            resetToken,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.resetPassword = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword)
            return next(new ErrorHandler_1.default("Token and new password are required", 400));
        const decoded = jsonwebtoken_1.default.verify(token, index_1.CONFIG.ACTIVATION_TOKEN_SECRET);
        if (!decoded || !decoded.id)
            return next(new ErrorHandler_1.default("Invalid or expired token", 400));
        const user = yield user_model_1.default.findById(decoded.id).select("+password");
        if (!user)
            return next(new ErrorHandler_1.default("User not found", 404));
        user.password = newPassword;
        yield user.save();
        yield redis_1.redis.del(user._id.toString());
        res.status(200).json({
            success: true,
            message: "Password reset successfully",
        });
    }
    catch (error) {
        const status = (error === null || error === void 0 ? void 0 : error.name) === "JsonWebTokenError" || (error === null || error === void 0 ? void 0 : error.name) === "TokenExpiredError"
            ? 400
            : 500;
        return next(new ErrorHandler_1.default(error.message, status));
    }
}));
exports.setupTwoFactor = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    try {
        const userId = (_g = req.userId) === null || _g === void 0 ? void 0 : _g.toString();
        const user = yield user_model_1.default.findById(userId).select("+twoFactorSecret");
        if (!user)
            return next(new ErrorHandler_1.default("User not found", 404));
        if (user.twoFactorEnabled)
            return next(new ErrorHandler_1.default("2FA is already enabled", 400));
        const secret = crypto_1.default.randomBytes(32).toString("hex");
        user.twoFactorSecret = secret;
        yield user.save();
        const otpauthUrl = `otpauth://totp/LMS:${user.email}?secret=${secret}&issuer=LMS`;
        res.status(200).json({
            success: true,
            message: "2FA setup initiated. Use the secret/URL in your authenticator app.",
            secret,
            otpauthUrl,
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.verifyTwoFactor = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    try {
        const { token } = req.body;
        if (!token)
            return next(new ErrorHandler_1.default("Token is required", 400));
        const userId = (_h = req.userId) === null || _h === void 0 ? void 0 : _h.toString();
        const user = yield user_model_1.default.findById(userId).select("+twoFactorSecret");
        if (!user)
            return next(new ErrorHandler_1.default("User not found", 404));
        if (!user.twoFactorSecret)
            return next(new ErrorHandler_1.default("2FA not set up", 400));
        const expected = crypto_1.default
            .createHmac("sha256", user.twoFactorSecret)
            .update(Math.floor(Date.now() / 30000).toString())
            .digest("hex")
            .slice(0, 6);
        const expectedPrev = crypto_1.default
            .createHmac("sha256", user.twoFactorSecret)
            .update(Math.floor(Date.now() / 30000) - 1 + "")
            .digest("hex")
            .slice(0, 6);
        if (token !== expected && token !== expectedPrev)
            return next(new ErrorHandler_1.default("Invalid 2FA token", 400));
        user.twoFactorEnabled = true;
        yield user.save();
        yield redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "2FA enabled successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.disableTwoFactor = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _j;
    try {
        const userId = (_j = req.userId) === null || _j === void 0 ? void 0 : _j.toString();
        const user = yield user_model_1.default.findById(userId).select("+twoFactorSecret");
        if (!user)
            return next(new ErrorHandler_1.default("User not found", 404));
        if (!user.twoFactorEnabled)
            return next(new ErrorHandler_1.default("2FA is not enabled", 400));
        const { token } = req.body;
        if (!token)
            return next(new ErrorHandler_1.default("Token is required", 400));
        const expected = crypto_1.default
            .createHmac("sha256", user.twoFactorSecret)
            .update(Math.floor(Date.now() / 30000).toString())
            .digest("hex")
            .slice(0, 6);
        const expectedPrev = crypto_1.default
            .createHmac("sha256", user.twoFactorSecret)
            .update(Math.floor(Date.now() / 30000) - 1 + "")
            .digest("hex")
            .slice(0, 6);
        if (token !== expected && token !== expectedPrev)
            return next(new ErrorHandler_1.default("Invalid 2FA token", 400));
        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined;
        yield user.save();
        yield redis_1.redis.del(userId);
        res.status(200).json({
            success: true,
            message: "2FA disabled successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
exports.getUserSessions = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _k;
    const userId = (_k = req.userId) === null || _k === void 0 ? void 0 : _k.toString();
    const sessionKey = `sessions:${userId}`;
    const sessionIds = yield redis_1.redis.smembers(sessionKey);
    const sessions = [];
    for (const sid of sessionIds) {
        const data = yield redis_1.redis.get(`session:${sid}`);
        if (data) {
            const parsed = JSON.parse(data);
            sessions.push(Object.assign({ sessionId: sid }, parsed));
        }
    }
    res.status(200).json({ success: true, sessions });
}));
exports.revokeUserSession = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l;
    const { sessionId } = req.body;
    if (!sessionId)
        return next(new ErrorHandler_1.default("sessionId is required", 400));
    const userId = (_l = req.userId) === null || _l === void 0 ? void 0 : _l.toString();
    const sessionKey = `sessions:${userId}`;
    const exists = yield redis_1.redis.sismember(sessionKey, sessionId);
    if (!exists)
        return next(new ErrorHandler_1.default("Session not found", 404));
    yield redis_1.redis.del(`session:${sessionId}`);
    yield redis_1.redis.srem(sessionKey, sessionId);
    res.status(200).json({ success: true, message: "Session revoked" });
}));
exports.revokeAllUserSessions = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _m;
    const userId = (_m = req.userId) === null || _m === void 0 ? void 0 : _m.toString();
    const sessionKey = `sessions:${userId}`;
    const sessionIds = yield redis_1.redis.smembers(sessionKey);
    for (const sid of sessionIds) {
        yield redis_1.redis.del(`session:${sid}`);
    }
    yield redis_1.redis.del(sessionKey);
    res.status(200).json({ success: true, message: "All sessions revoked" });
}));
//# sourceMappingURL=user.controller.js.map