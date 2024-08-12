import express, { Request, Response, NextFunction } from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { CONFIG } from "./config";
import { errorMiddleware } from "./middlewares/error";
import userRouter from "./routes/user.routes";
import courseRouter from "./routes/course.routes";
import orderRouter from "./routes/order.routes";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.routes";
import layoutRouter from "./routes/layout.routes";
// body-parser
app.use(express.json({ limit: "50mb" }));

//cookie parser
app.use(cookieParser());

//cors => cross origin resource sharing...
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, //to send cookies
  })
);

//routes
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/layout", layoutRouter);

//testing route
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "api is working",
  });
});

app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(errorMiddleware);
//what is nodejs
