import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { CONFIG } from "./../config/index";

const emailRegexPattern: RegExp =
  /[A-Za-z0-9\._%+\-]+@[A-Za-z0-9\.\-]+\.[A-Za-z]{2,}/;
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter Your Name"],
      maxLength: [30, "Name cannot exceed 30 characters"],
      minLength: [4, "Name should have more than 4 characters"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      unique: true,
      validate: {
        validator: function (v: string) {
          return emailRegexPattern.test(v);
        },
        message: props => `${props.value} is not a valid email address`,
      },
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

//hash password before saving user
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//sign access token
userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, CONFIG.ACCESS_TOKEN as string, {
    expiresIn: "5m",
  });
};

//sign refresh token
userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, CONFIG.REFRESH_TOKEN as string, {
    expiresIn: "7d",
  });
};

//compare passwords
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export default userModel;
