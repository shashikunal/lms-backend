import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { CONFIG } from "./config";
import { errorMiddleware } from "./middlewares/error";
import userRouter from "./routes/user.routes";
import courseRouter from "./routes/course.routes";
import orderRouter from "./routes/order.routes";
import notificationRouter from "./routes/notification.route";
import analyticsRouter from "./routes/analytics.routes";
import layoutRouter from "./routes/layout.routes";
import { swaggerDocument } from "./docs/swagger";

export const app = express();

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Cookie parser
app.use(cookieParser());

// CORS configuration
const allowedOrigins = CONFIG.ORIGIN
  ? [CONFIG.ORIGIN, "http://localhost:3000"]
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, Swagger UI) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for API consumers
      }
    },
    credentials: true,
  })
);

// Swagger JSON Specification Endpoint
app.get("/api-docs.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send(swaggerDocument);
});

// Swagger UI CDN-rendered HTML (optimal for Vercel Serverless without static bundle errors)
const renderSwaggerHtml = () => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LMS Backend API Documentation</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css" />
  <link rel="icon" type="image/png" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/favicon-32x32.png" />
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui .topbar { display: none !important; }
    .custom-header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #fff;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .custom-header h1 { margin: 0; font-size: 22px; font-weight: 700; }
    .custom-header a {
      color: #38bdf8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      padding: 6px 12px;
      border: 1px solid #38bdf8;
      border-radius: 6px;
      transition: all 0.2s ease;
    }
    .custom-header a:hover { background: #38bdf8; color: #0f172a; }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>🎓 LMS Backend API Docs</h1>
    <div>
      <a href="/api-docs.json" target="_blank">View Raw OpenAPI Spec</a>
      <a href="/test" target="_blank" style="margin-left: 8px;">Health Check</a>
    </div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`;

app.get(["/api-docs", "/docs"], (req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.status(200).send(renderSwaggerHtml());
});

// Also register standard swagger-ui-express route
app.use("/api-docs-standard", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Welcome / Index route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "LMS Backend API is up and running",
    version: "1.0.0",
    docs: "/api-docs",
    openapi: "/api-docs.json",
    endpoints: {
      auth: "/api/v1/auth",
      course: "/api/v1/course",
      order: "/api/v1/order",
      notifications: "/api/v1/notifications",
      analytics: "/api/v1/analytics",
      layout: "/api/v1/layout",
      healthCheck: "/test",
    },
  });
});

// Testing / Health route
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "api is working",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/v1/auth", userRouter);
app.use("/api/v1/course", courseRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/layout", layoutRouter);

// 404 Handler
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

// Global Error Middleware
app.use(errorMiddleware);
