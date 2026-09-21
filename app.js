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
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const config_1 = require("./config");
const error_1 = require("./middlewares/error");
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const course_routes_1 = __importDefault(require("./routes/course.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const notification_route_1 = __importDefault(require("./routes/notification.route"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const layout_routes_1 = __importDefault(require("./routes/layout.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const address_routes_1 = __importDefault(require("./routes/address.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const wishlist_routes_1 = __importDefault(require("./routes/wishlist.routes"));
const coupon_routes_1 = __importDefault(require("./routes/coupon.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const ecommerceOrder_routes_1 = __importDefault(require("./routes/ecommerceOrder.routes"));
const productReview_routes_1 = __importDefault(require("./routes/productReview.routes"));
const swagger_1 = require("./docs/swagger");
const db_1 = __importDefault(require("./utils/db"));
exports.app = (0, express_1.default)();
// Body parser
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "50mb" }));
// Cookie parser
exports.app.use((0, cookie_parser_1.default)());
// CORS configuration
const configuredOrigins = config_1.CONFIG.ORIGIN
    ? config_1.CONFIG.ORIGIN.split(",").map((o) => o.trim())
    : [];
const allowedOrigins = Array.from(new Set([
    ...configuredOrigins,
    "http://localhost:3000",
    "http://localhost:5173",
    "https://mockapi-mauve.vercel.app",
]));
exports.app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Swagger UI) or allowed origins
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
            callback(null, true);
        }
        else {
            callback(null, true); // Permissive for API consumers
        }
    },
    credentials: true,
}));
// Swagger JSON Specification Endpoint
exports.app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(swagger_1.swaggerDocument);
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
      <a href="https://ethereal.email/messages" target="_blank" style="margin-right: 8px; background: #0284c7; color: #fff; border-color: #0284c7;">📬 Test Mailbox</a>
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
exports.app.get(["/api-docs", "/docs"], (req, res) => {
    res.setHeader("Content-Type", "text/html");
    res.status(200).send(renderSwaggerHtml());
});
// Also register standard swagger-ui-express route
exports.app.use("/api-docs-standard", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerDocument));
// Welcome / Index route
exports.app.get("/", (req, res) => {
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
            // E-Commerce Endpoints
            category: "/api/v1/category",
            product: "/api/v1/product",
            address: "/api/v1/address",
            cart: "/api/v1/cart",
            wishlist: "/api/v1/wishlist",
            coupon: "/api/v1/coupon",
            payment: "/api/v1/payment",
            ecommerceOrder: "/api/v1/ecommerce/order",
            productReviews: "/api/v1/product-reviews",
            healthCheck: "/test",
        },
    });
});
// Testing / Health route
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "api is working",
        timestamp: new Date().toISOString(),
    });
});
// Ensure DB connection before processing API routes
exports.app.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // Allow health check, Swagger UI docs, and welcome page without waiting for DB
    if (req.path === "/" ||
        req.path === "/test" ||
        req.path.startsWith("/api-docs") ||
        req.path.startsWith("/docs")) {
        return next();
    }
    try {
        yield (0, db_1.default)();
        next();
    }
    catch (err) {
        return res.status(503).json({
            success: false,
            message: `Database connection error: ${(err === null || err === void 0 ? void 0 : err.message) || "Unable to reach database"}. Ensure DB_URI is set and MongoDB Atlas allows 0.0.0.0/0 IP access.`,
        });
    }
}));
// API Routes
exports.app.use("/api/v1/auth", user_routes_1.default);
exports.app.use("/api/v1/course", course_routes_1.default);
exports.app.use("/api/v1/order", order_routes_1.default);
exports.app.use("/api/v1/notifications", notification_route_1.default);
exports.app.use("/api/v1/analytics", analytics_routes_1.default);
exports.app.use("/api/v1/layout", layout_routes_1.default);
// E-Commerce API Routes
exports.app.use("/api/v1/category", category_routes_1.default);
exports.app.use("/api/v1/product", product_routes_1.default);
exports.app.use("/api/v1/address", address_routes_1.default);
exports.app.use("/api/v1/cart", cart_routes_1.default);
exports.app.use("/api/v1/wishlist", wishlist_routes_1.default);
exports.app.use("/api/v1/coupon", coupon_routes_1.default);
exports.app.use("/api/v1/payment", payment_routes_1.default);
exports.app.use("/api/v1/ecommerce/order", ecommerceOrder_routes_1.default);
exports.app.use("/api/v1/product-reviews", productReview_routes_1.default);
// 404 Handler
exports.app.all("*", (req, res, next) => {
    const err = new Error(`Route ${req.originalUrl} not found`);
    err.statusCode = 404;
    next(err);
});
// Global Error Middleware
exports.app.use(error_1.errorMiddleware);
//# sourceMappingURL=app.js.map