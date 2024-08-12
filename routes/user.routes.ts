import express from "express";
import {
  registrationUser,
  activateUser,
  loginUser,
  logoutUser,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
  getAllUsersDashboard,
  updateUserRoles,
  deleteUserByAdmin,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

const userRouter = express.Router();

userRouter.route("/register").post(registrationUser);
userRouter.route("/activate-user").post(activateUser);
userRouter.route("/login").post(loginUser);
// userRouter.route("/logout").get(logoutUser, isAuthenticated);
userRouter.get("/logout", isAuthenticated, logoutUser);
userRouter.get("/refreshtoken", updateAccessToken);
userRouter.get("/me", isAuthenticated, getUserInfo);
userRouter.route("/social-auth").post(socialAuth);
userRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
userRouter.put("/update-user-password", isAuthenticated, updatePassword);
userRouter.put(
  "/update-user-profile-picture",
  isAuthenticated,
  updateProfilePicture
);

userRouter.get(
  "/get-all-user-dashboard",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsersDashboard
);

userRouter.put(
  "/update-user-roles",
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRoles
);

userRouter.delete(
  "/delete-user/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  deleteUserByAdmin
);

export default userRouter;
