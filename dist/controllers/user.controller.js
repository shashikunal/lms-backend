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
exports.deleteUserByAdmin = exports.updateUserRoles = exports.getAllUsersDashboard = exports.updateProfilePicture = exports.updatePassword = exports.updateUserInfo = exports.socialAuth = exports.getUserInfo = exports.updateAccessToken = exports.logoutUser = exports.loginUser = exports.activateUser = exports.createActivationToken = exports.registrationUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const catchAsyncErrors_1 = require("../middlewares/catchAsyncErrors");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_1 = require("./../config/index");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
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
        const html = yield ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/activation.email.ejs"), data);
        try {
            yield (0, sendMail_1.default)({
                email: user.email,
                subject: "Account Activation",
                template: "activation.email.ejs",
                data,
            });
            res.status(201).json({
                success: true,
                message: `Please check your ${user.email} address to activate your account! `,
                activationToken: activationToken.token,
            });
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 400));
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
        return next(new ErrorHandler_1.default(error.message, 500));
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
        const decoded = jsonwebtoken_1.default.verify(refresh_token, index_1.CONFIG.REFRESH_TOKEN);
        const message = "Please login again to continue";
        if (!decoded) {
            return next(new ErrorHandler_1.default(message, 401));
        }
        const session = yield redis_1.redis.get(decoded.id);
        if (!session) {
            return next(new ErrorHandler_1.default(message, 401));
        }
        const userData = JSON.parse(session);
        const accessToken = jsonwebtoken_1.default.sign({ id: userData._id }, index_1.CONFIG.ACCESS_TOKEN, { expiresIn: "5m" });
        const refreshToken = jsonwebtoken_1.default.sign({ id: userData._id }, index_1.CONFIG.REFRESH_TOKEN, { expiresIn: "3d" });
        req.user = userData;
        res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
        res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
        yield redis_1.redis.set(userData._id, JSON.stringify(userData), "EX", 604800); //7days;
        res.status(200).json({
            success: true,
            message: "Access token updated successfully",
        });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
}));
// getUserInfo
exports.getUserInfo = (0, catchAsyncErrors_1.CatchAsyncErrors)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        console.log(userId);
        (0, user_service_1.getUserById)(userId, res);
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
    var _a;
    try {
        const { name, email } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
    var _a;
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
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
    var _a, _b;
    try {
        const { avatar } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const user = yield user_model_1.default.findById(userId);
        if (avatar && user) {
            if ((_b = userId === null || userId === void 0 ? void 0 : userId.avatar) === null || _b === void 0 ? void 0 : _b.public_id) {
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
        yield user.deleteOne({ id });
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
//# sourceMappingURL=user.controller.js.map