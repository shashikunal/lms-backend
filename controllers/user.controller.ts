import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncErrors } from "../middlewares/catchAsyncErrors";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import { CONFIG } from "./../config/index";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";
import {
  getAllUsersService,
  getUserById,
  updateUserRolesService,
} from "../services/user.service";
import cloudinary from "cloudinary";
import { compareSync } from "bcryptjs";

//Register User
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body;
      const isEmailExits = await userModel.findOne({ email });
      if (isEmailExits) {
        return next(new ErrorHandler("Email already exists", 400));
      }
      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;
      const data = { user: { name: user.name }, activationCode };
      const html = await ejs.renderFile(
        path.join(__dirname, "../mails/activation.email.ejs"),
        data
      );

      try {
        await sendMail({
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
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error, 500));
    }
  }
);
interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const token = jwt.sign(
    { user, activationCode },
    CONFIG.ACTIVATION_TOKEN_SECRET as Secret,
    { expiresIn: "5m" }
  );
  return { token, activationCode };
};

//activate User
interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_code, activation_token } =
        req.body as IActivationRequest;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        CONFIG.ACTIVATION_TOKEN_SECRET as string
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }

      const { name, email, password } = newUser.user;
      const exitsUser = await userModel.findOne({ email });
      if (exitsUser) {
        return next(new ErrorHandler("Email already exists", 400));
      }

      const user = await userModel.create({ name, email, password });
      res.status(201).json({
        success: true,
        message: "User activated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//LOGIN USER
interface ILoginRequestBody {
  email: string;
  password: string;
}

export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequestBody;
      const user = await userModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      const isPasswordMatched = await user.comparePassword(password);
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid email or password", 401));
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//logout user
export const logoutUser = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
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
      const userId = req.user?._id || "";
      redis.del(userId);
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//update access token
export const updateAccessToken = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        CONFIG.REFRESH_TOKEN as string
      ) as JwtPayload;

      const message = "Please login again to continue";
      if (!decoded) {
        return next(new ErrorHandler(message, 401));
      }
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler(message, 401));
      }
      const userData = JSON.parse(session);
      const accessToken = jwt.sign(
        { id: userData._id },
        CONFIG.ACCESS_TOKEN as string,
        { expiresIn: "5m" }
      );
      const refreshToken = jwt.sign(
        { id: userData._id },
        CONFIG.REFRESH_TOKEN as string,
        { expiresIn: "3d" }
      );
      req.user = userData;
      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);
      await redis.set(userData._id, JSON.stringify(userData), "EX", 604800); //7days;
      res.status(200).json({
        success: true,
        message: "Access token updated successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// getUserInfo
export const getUserInfo = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      console.log(userId);
      getUserById(userId, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//social AUTH
interface iSocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

export const socialAuth = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as iSocialAuthBody;
      let user = await userModel.findOne({ email });
      if (!user) {
        user = await userModel.create({ email, name, avatar });
      }
      sendToken(user, 200, res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//update user info
interface IUpdateUserInfo {
  name: string;
  email: string;
}
export const updateUserInfo = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findByIdAndUpdate(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
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

      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//UPDATE USER PASSWORD
interface IUpdateUserPassword {
  oldPassword: string;
  newPassword: string;
}
export const updatePassword = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdateUserPassword;
      const userId = req.user?._id;
      const user = await userModel.findById(userId).select("+password");
      if (user?.password === undefined) {
        return next(new ErrorHandler("password not available", 400));
      }

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler("Please enter old and new password", 400));
      }
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      const isPasswordMatched = await user?.comparePassword(oldPassword);
      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect", 401));
      }
      user.password = newPassword;
      await user.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "Password updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//update Profile picture
interface IUpdateProfilePicture {
  avatar: string;
}

export const updateProfilePicture = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      if (avatar && user) {
        if (userId?.avatar?.public_id) {
          //delete old image
          await cloudinary.v2.uploader.destroy(userId.avatar.public_id);
          //update new image
          await cloudinary.v2.uploader.upload(avatar, {
            folder: "lms-avatar",
            width: 150,
          });
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
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
        return next(new ErrorHandler("User not found", 404));
      }
      await user?.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get All users
export const getAllUsersDashboard = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllUsersService(res);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//update user roles
export const updateUserRoles = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { id, role } = req.body;
      updateUserRolesService(res, id, role);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//delete user bt Admin
export const deleteUserByAdmin = CatchAsyncErrors(
  async (req: Request | any, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userModel.findById(id);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      await user.deleteOne({ id });

      await redis.del(id);

      res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);
