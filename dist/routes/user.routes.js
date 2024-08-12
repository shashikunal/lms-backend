"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_controller_1 = require("../controllers/user.controller");
const auth_1 = require("../middlewares/auth");
const userRouter = express_1.default.Router();
userRouter.route("/register").post(user_controller_1.registrationUser);
userRouter.route("/activate-user").post(user_controller_1.activateUser);
userRouter.route("/login").post(user_controller_1.loginUser);
// userRouter.route("/logout").get(logoutUser, isAuthenticated);
userRouter.get("/logout", auth_1.isAuthenticated, user_controller_1.logoutUser);
userRouter.get("/refreshtoken", user_controller_1.updateAccessToken);
userRouter.get("/me", auth_1.isAuthenticated, user_controller_1.getUserInfo);
userRouter.route("/social-auth").post(user_controller_1.socialAuth);
userRouter.put("/update-user-info", auth_1.isAuthenticated, user_controller_1.updateUserInfo);
userRouter.put("/update-user-password", auth_1.isAuthenticated, user_controller_1.updatePassword);
userRouter.put("/update-user-profile-picture", auth_1.isAuthenticated, user_controller_1.updateProfilePicture);
userRouter.get("/get-all-user-dashboard", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), user_controller_1.getAllUsersDashboard);
userRouter.put("/update-user-roles", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), user_controller_1.updateUserRoles);
userRouter.delete("/delete-user/:id", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), user_controller_1.deleteUserByAdmin);
exports.default = userRouter;
//# sourceMappingURL=user.routes.js.map