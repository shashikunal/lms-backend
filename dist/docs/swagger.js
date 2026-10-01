"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerDocument = void 0;
exports.swaggerDocument = {
    openapi: "3.0.3",
    info: {
        title: "LMS Course Marketplace API",
        version: "2.0.0",
        description: "LMS Course Marketplace API (digital courses only).",
        contact: {
            name: "API Support",
            email: "support@lms-backend.com",
        },
        license: {
            name: "ISC",
        },
    },
    servers: [
        {
            url: "/",
            description: "Default / Production (Vercel)",
        },
        {
            url: "http://localhost:8000",
            description: "Local Development Server",
        },
    ],
    tags: [
        {
            name: "System",
            description: "Health check and system inspection",
        },
        {
            name: "Authentication & Users",
            description: "User registration, authentication, tokens, profile updates, and admin management",
        },
        {
            name: "Courses",
            description: "Course catalog, creation, editing, reviews, Q&A, and user course content",
        },
        {
            name: "Orders",
            description: "Order creation, payment processing, and admin order dashboards",
        },
        {
            name: "Notifications",
            description: "In-app notifications and status updates for administrators",
        },
        {
            name: "Analytics",
            description: "Monthly analytics reports for users, courses, and orders (Admin only)",
        },
        {
            name: "Layout",
            description: "Manage homepage banner, FAQs, and course categories",
        },
        {
            name: "LMS Marketplace",
            description: "Course marketplace, curriculum, lectures, enrollments, payments, wishlist, reviews, coupons, certificates, instructor and admin",
        },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter your JWT access token",
            },
            cookieAuth: {
                type: "apiKey",
                in: "cookie",
                name: "access_token",
                description: "Access token stored in HTTP-only cookie",
            },
        },
        schemas: {
            ApiResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Operation completed successfully" },
                },
            },
            ErrorResponse: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string", example: "Detailed error message" },
                },
            },
            User: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
                    name: { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
                    role: { type: "string", enum: ["user", "instructor", "admin"], example: "user" },
                    isVerified: { type: "boolean", example: true },
                    courses: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                _id: { type: "string" },
                            },
                        },
                    },
                    avatar: {
                        type: "object",
                        properties: {
                            public_id: { type: "string", example: "avatar_id_123" },
                            url: { type: "string", example: "https://res.cloudinary.com/.../avatar.jpg" },
                        },
                    },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                },
            },
            Course: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64e00b8a1c9d2f001c9a1b2d" },
                    name: { type: "string", example: "Full Stack Next.js & Node Masterclass" },
                    description: { type: "string", example: "Learn to build production-grade web applications." },
                    price: { type: "number", example: 49.99 },
                    estimatedPrice: { type: "number", example: 99.99 },
                    thumbnail: {
                        type: "object",
                        properties: {
                            public_id: { type: "string" },
                            url: { type: "string" },
                        },
                    },
                    tags: { type: "string", example: "react, nodejs, typescript" },
                    level: { type: "string", example: "Intermediate" },
                    demoUrl: { type: "string", example: "https://www.youtube.com/watch?v=demo" },
                    benefits: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: { title: { type: "string", example: "Source code included" } },
                        },
                    },
                    prerequisites: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: { title: { type: "string", example: "Basic JavaScript knowledge" } },
                        },
                    },
                    rating: { type: "number", example: 4.8 },
                    purchased: { type: "number", example: 120 },
                },
            },
            Order: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64e00b8a1c9d2f001c9a1b2e" },
                    courseId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2d" },
                    userId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
                    payment_info: { type: "object" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            Notification: {
                type: "object",
                properties: {
                    _id: { type: "string", example: "64e00b8a1c9d2f001c9a1b2f" },
                    title: { type: "string", example: "New Order Placed" },
                    message: { type: "string", example: "User John Doe purchased Course A" },
                    status: { type: "string", example: "unread" },
                    userId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            Enrollment: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    userId: { type: "string" },
                    courseId: { type: "string" },
                    orderId: { type: "string" },
                    progress: { type: "number", example: 45 },
                    completed: { type: "boolean", example: false },
                },
            },
            Certificate: {
                type: "object",
                properties: {
                    _id: { type: "string" },
                    certificateId: { type: "string" },
                    courseName: { type: "string" },
                    issuedAt: { type: "string", format: "date-time" },
                },
            },
        },
    },
    paths: {
        "/": {
            get: {
                tags: ["System"],
                summary: "API Root & Navigation",
                description: "Returns welcoming metadata, system status, and links to interactive Swagger documentation.",
                responses: {
                    200: {
                        description: "API is online",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "LMS Backend API is running" },
                                        docs: { type: "string", example: "/api-docs" },
                                        openapi: { type: "string", example: "/api-docs.json" },
                                        version: { type: "string", example: "1.0.0" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/test": {
            get: {
                tags: ["System"],
                summary: "Health Check",
                description: "Sanity check to verify API responsiveness.",
                responses: {
                    200: {
                        description: "Server is healthy",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "api is working" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api-docs.json": {
            get: {
                tags: ["System"],
                summary: "Raw OpenAPI 3.0 Specification",
                description: "Returns the OpenAPI specification in JSON format.",
                responses: {
                    200: {
                        description: "OpenAPI specification JSON",
                    },
                },
            },
        },
        "/api/v1/auth/register": {
            post: {
                tags: ["Authentication & Users"],
                summary: "Register new user",
                description: "Creates an unverified account and emails a 6-digit activation code (Ethereal). Email delivery is best-effort: the 201 response always includes activationToken + activationCode so signup works even when SMTP is unreachable (mailSent:false in that case).",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "email", "password"],
                                properties: {
                                    name: { type: "string", example: "Jane Doe" },
                                    email: { type: "string", format: "email", example: "jane@example.com" },
                                    password: { type: "string", format: "password", minLength: 6, example: "Password123!" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Account created (activation credentials always returned)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "Please check your email: jane@example.com to activate your account!" },
                                        activationToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
                                        activationCode: { type: "string", example: "4921" },
                                        mailSent: { type: "boolean", example: true },
                                        mailUrl: { type: "string", example: "https://ethereal.email/messages" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Email already exists or invalid data" },
                },
            },
        },
        "/api/v1/auth/activate-user": {
            post: {
                tags: ["Authentication & Users"],
                summary: "Activate registered user account",
                description: "Verifies the 4-digit activation code and activates user in database.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["activation_token", "activation_code"],
                                properties: {
                                    activation_token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
                                    activation_code: { type: "string", example: "4921" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Account successfully activated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired activation code" },
                },
            },
        },
        "/api/v1/auth/login": {
            post: {
                tags: ["Authentication & Users"],
                summary: "Login user",
                description: "Authenticates user with email & password, sets access and refresh token cookies.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: { type: "string", format: "email", example: "jane@example.com" },
                                    password: { type: "string", format: "password", example: "Password123!" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Logged in successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                        accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid email or password" },
                },
            },
        },
        "/api/v1/auth/logout": {
            get: {
                tags: ["Authentication & Users"],
                summary: "Logout current user",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "Logged out successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ApiResponse" },
                            },
                        },
                    },
                    400: { description: "Not authenticated" },
                },
            },
        },
        "/api/v1/auth/refreshtoken": {
            get: {
                tags: ["Authentication & Users"],
                summary: "Refresh access token",
                description: "Uses refresh token cookie to issue a new access token.",
                responses: {
                    200: {
                        description: "New access token generated",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        accessToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Invalid or expired refresh token" },
                },
            },
        },
        "/api/v1/auth/me": {
            get: {
                tags: ["Authentication & Users"],
                summary: "Get current authenticated user profile",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "User profile details",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Not authenticated" },
                },
            },
        },
        "/api/v1/auth/social-auth": {
            post: {
                tags: ["Authentication & Users"],
                summary: "Social authentication (Google / GitHub OAuth)",
                description: "Authenticates or auto-creates user via social provider.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "name"],
                                properties: {
                                    email: { type: "string", format: "email", example: "social@example.com" },
                                    name: { type: "string", example: "Alex Smith" },
                                    avatar: { type: "string", example: "https://lh3.googleusercontent.com/..." },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Social login success",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                        accessToken: { type: "string" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/auth/update-user-info": {
            put: {
                tags: ["Authentication & Users"],
                summary: "Update current user profile info",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    name: { type: "string", example: "Jane Updated" },
                                    email: { type: "string", format: "email", example: "jane_new@example.com" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Profile updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/auth/update-user-password": {
            put: {
                tags: ["Authentication & Users"],
                summary: "Change account password",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["oldPassword", "newPassword"],
                                properties: {
                                    oldPassword: { type: "string", example: "Password123!" },
                                    newPassword: { type: "string", minLength: 6, example: "NewSecurePassword456!" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Password updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                    400: { description: "Incorrect old password" },
                },
            },
        },
        "/api/v1/auth/update-user-profile-picture": {
            put: {
                tags: ["Authentication & Users"],
                summary: "Update user avatar / profile picture",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["avatar"],
                                properties: {
                                    avatar: { type: "string", description: "Base64 image data or image URL" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Avatar updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/auth/get-all-user-dashboard": {
            get: {
                tags: ["Authentication & Users"],
                summary: "Get all users for admin dashboard",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                description: "Admin role required.",
                responses: {
                    200: {
                        description: "List of all users",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        users: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/User" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    403: { description: "Forbidden: requires admin role" },
                },
            },
        },
        "/api/v1/auth/update-user-roles": {
            put: {
                tags: ["Authentication & Users"],
                summary: "Update a user's role (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["id", "role"],
                                properties: {
                                    id: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
                                    role: { type: "string", enum: ["user", "admin"], example: "admin" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "User role updated successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        user: { $ref: "#/components/schemas/User" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/auth/delete-user/{id}": {
            delete: {
                tags: ["Authentication & Users"],
                summary: "Delete user by ID (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                        description: "User ID",
                    },
                ],
                responses: {
                    200: {
                        description: "User deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "user deleted successfully" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/create-course": {
            post: {
                tags: ["Courses"],
                summary: "Create a new course (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["name", "description", "price", "estimatedPrice", "tags", "level", "demoUrl", "benefits", "prerequisites"],
                                properties: {
                                    name: { type: "string", example: "Advanced Node.js & Microservices" },
                                    description: { type: "string", example: "Build scalable distributed architectures." },
                                    price: { type: "number", example: 59.99 },
                                    estimatedPrice: { type: "number", example: 129.99 },
                                    thumbnail: { type: "string", description: "Base64 or Cloudinary URL" },
                                    tags: { type: "string", example: "nodejs, express, microservices" },
                                    level: { type: "string", example: "Advanced" },
                                    demoUrl: { type: "string", example: "https://youtube.com/watch?v=xyz" },
                                    benefits: {
                                        type: "array",
                                        items: { type: "object", properties: { title: { type: "string" } } },
                                    },
                                    prerequisites: {
                                        type: "array",
                                        items: { type: "object", properties: { title: { type: "string" } } },
                                    },
                                    courseData: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                                description: { type: "string" },
                                                videoUrl: { type: "string" },
                                                videoSection: { type: "string" },
                                                videoLength: { type: "number" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Course created successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/edit-course/{id}": {
            put: {
                tags: ["Courses"],
                summary: "Edit existing course (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { type: "object" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Course updated successfully (returns 201)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/get-course/{id}": {
            get: {
                tags: ["Courses"],
                summary: "Get public details for a single course",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Course data (excluding protected video content)",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/get-courses": {
            get: {
                tags: ["Courses"],
                summary: "Get all public courses",
                responses: {
                    200: {
                        description: "Course catalog list",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        courses: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Course" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/get-course-content/{id}": {
            get: {
                tags: ["Courses"],
                summary: "Get full course content for enrolled students",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Full course modules and video content",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        content: { type: "array", items: { type: "object" } },
                                    },
                                },
                            },
                        },
                    },
                    404: { description: "You are not enrolled in this course" },
                },
            },
        },
        "/api/v1/course/add-question": {
            put: {
                tags: ["Courses"],
                summary: "Ask a question in course lesson",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["question", "courseId", "contentId"],
                                properties: {
                                    question: { type: "string", example: "How does connection pooling work in serverless?" },
                                    courseId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2d" },
                                    contentId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2f" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Question submitted",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/add-answer": {
            put: {
                tags: ["Courses"],
                summary: "Answer a student question",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["answer", "courseId", "contentId", "questionId"],
                                properties: {
                                    answer: { type: "string", example: "You reuse the cached connection outside the handler function." },
                                    courseId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2d" },
                                    contentId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2f" },
                                    questionId: { type: "string", example: "64e00b8a1c9d2f001c9a1b30" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Answer posted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/add-review/{id}": {
            put: {
                tags: ["Courses"],
                summary: "Add review & rating for course",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["review", "rating"],
                                properties: {
                                    review: { type: "string", example: "Fantastic course, highly recommended!" },
                                    rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Review posted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/add-replay": {
            put: {
                tags: ["Courses"],
                summary: "Reply to course review (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["comment", "courseId", "reviewId"],
                                properties: {
                                    comment: { type: "string", example: "Thank you for the wonderful feedback!" },
                                    courseId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2d" },
                                    reviewId: { type: "string", example: "64e00b8a1c9d2f001c9a1b31" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Reply added to review",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        course: { $ref: "#/components/schemas/Course" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/get-all-course-dashboard": {
            get: {
                tags: ["Courses"],
                summary: "Get all courses for Admin dashboard",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "All courses including unpublished/draft info",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        courses: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Course" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/course/delete-course/{id}": {
            delete: {
                tags: ["Courses"],
                summary: "Delete course by ID (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Course deleted successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        message: { type: "string", example: "Course deleted successfully" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/order/create-order": {
            post: {
                tags: ["Orders"],
                summary: "Create new course order",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["courseId", "payment_info"],
                                properties: {
                                    courseId: { type: "string", example: "64e00b8a1c9d2f001c9a1b2d" },
                                    payment_info: {
                                        type: "object",
                                        example: { id: "pi_123456789", status: "succeeded" },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Order placed successfully",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        order: { $ref: "#/components/schemas/Order" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/order/get-all-order-dashboard": {
            get: {
                tags: ["Orders"],
                summary: "Get all orders for Admin dashboard",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "List of orders",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        orders: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Order" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/notifications/get-all-notification": {
            get: {
                tags: ["Notifications"],
                summary: "Get notifications (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "List of notifications",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        notifications: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Notification" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/notifications/update-notification-status/{id}": {
            put: {
                tags: ["Notifications"],
                summary: "Mark notification as read (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "string" },
                    },
                ],
                responses: {
                    200: {
                        description: "Notification marked as read",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        notifications: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Notification" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/analytics/get-users-analytics": {
            get: {
                tags: ["Analytics"],
                summary: "Get 12-month user signups analytics (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "Monthly analytics data",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        users: {
                                            type: "object",
                                            properties: {
                                                last12Months: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            month: { type: "string", example: "January 2026" },
                                                            count: { type: "number", example: 45 },
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/analytics/get-course-analytics": {
            get: {
                tags: ["Analytics"],
                summary: "Get 12-month courses analytics (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "Course creation trends",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        courses: { type: "object" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/analytics/get-order-analytics": {
            get: {
                tags: ["Analytics"],
                summary: "Get 12-month orders analytics (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: {
                        description: "Order trends and sales volume",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        orders: { type: "object" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/layout/create-layout": {
            post: {
                tags: ["Layout"],
                summary: "Create layout configuration (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["type"],
                                properties: {
                                    type: { type: "string", enum: ["banner", "faq", "categories"], example: "faq" },
                                    image: { type: "string", example: "data:image/png;base64,..." },
                                    title: { type: "string", example: "Master Modern Web Development" },
                                    subTitle: { type: "string", example: "Interactive courses taught by industry leaders" },
                                    faq: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                question: { type: "string" },
                                                answer: { type: "string" },
                                            },
                                        },
                                    },
                                    categories: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                title: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Layout created successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ApiResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/layout/update-layout": {
            put: {
                tags: ["Layout"],
                summary: "Update layout configuration (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["type"],
                                properties: {
                                    type: { type: "string", enum: ["banner", "faq", "categories"] },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Layout updated successfully",
                        content: {
                            "application/json": {
                                schema: { $ref: "#/components/schemas/ApiResponse" },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/layout/get-layout": {
            get: {
                tags: ["Layout"],
                summary: "Get site layout by type",
                parameters: [
                    {
                        name: "type",
                        in: "query",
                        required: false,
                        schema: { type: "string", enum: ["banner", "faq", "categories"] },
                        description: "Layout type (lowercase)",
                    },
                ],
                responses: {
                    200: {
                        description: "Layout configuration object",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        layout: { type: "object" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/lms/courses": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List published courses (marketplace)",
                responses: {
                    200: {
                        description: "Published course catalog",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        success: { type: "boolean", example: true },
                                        courses: {
                                            type: "array",
                                            items: { $ref: "#/components/schemas/Course" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/v1/lms/my-learning": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get My Learning (enrollments, progress, certificates)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: {
                    200: { description: "Enrolled courses grouped by progress" },
                },
            },
        },
        "/api/v1/lms/payments/create": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Create course payment (digital, no shipping)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["courseId"],
                                properties: {
                                    courseId: { type: "string" },
                                    couponCode: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Razorpay order created" },
                },
            },
        },
        "/api/v1/lms/payments/verify": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Verify payment and create enrollment",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: [
                                    "razorpay_order_id",
                                    "razorpay_payment_id",
                                    "razorpay_signature",
                                    "courseId",
                                ],
                                properties: {
                                    razorpay_order_id: { type: "string" },
                                    razorpay_payment_id: { type: "string" },
                                    razorpay_signature: { type: "string" },
                                    courseId: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Payment verified, enrollment confirmed" },
                },
            },
        },
        "/api/v1/lms/categories": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List course categories with counts",
                responses: { 200: { description: "Category aggregation" } },
            },
        },
        "/api/v1/lms/search": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Search published courses (?q=)",
                parameters: [{ name: "q", in: "query", required: false, schema: { type: "string" } }],
                responses: { 200: { description: "Matching courses" } },
            },
        },
        "/api/v1/lms/home": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Marketplace home (featured, top rated, newest)",
                responses: { 200: { description: "Curated course lists" } },
            },
        },
        "/api/v1/lms/courses/{courseId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get course detail (video URLs hidden for locked lectures)",
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Course detail" }, 404: { description: "Course not found / not published" } },
            },
        },
        "/api/v1/lms/courses/{courseId}/curriculum": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get curriculum with locked flags (enrolled users unlock video URLs)",
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Curriculum list" }, 404: { description: "Course not found" } },
            },
        },
        "/api/v1/lms/courses/{courseId}/sections": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get sections grouped by videoSection",
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Section groups" }, 404: { description: "Course not found" } },
            },
        },
        "/api/v1/lms/sections/{sectionId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get section by lecture ID or section title",
                parameters: [{ name: "sectionId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Section detail" }, 404: { description: "Section not found" } },
            },
        },
        "/api/v1/lms/sections/{sectionId}/lectures": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List lectures in a section",
                parameters: [{ name: "sectionId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Lecture list" }, 404: { description: "Section not found" } },
            },
        },
        "/api/v1/lms/lectures/{lectureId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get lecture (preview open; locked lectures need enrollment)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Lecture content" }, 403: { description: "Enrollment required" }, 404: { description: "Lecture not found" } },
            },
        },
        "/api/v1/lms/lectures/{lectureId}/access": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Check lecture access for current user",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "{ hasAccess: boolean }" } },
            },
        },
        "/api/v1/lms/lectures/{lectureId}/progress": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Save watch progress (enrolled only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: false, content: { "application/json": { schema: { type: "object", properties: { watchedSeconds: { type: "number", example: 120 } } } } } },
                responses: { 200: { description: "Progress saved" }, 403: { description: "Enrollment required" } },
            },
        },
        "/api/v1/lms/lectures/{lectureId}/complete": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Mark lecture complete (100% of lectures auto-issues certificate)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Updated enrollment with progress" }, 403: { description: "Enrollment required" } },
            },
        },
        "/api/v1/lms/purchases": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "My purchase history (orders)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "User orders" } },
            },
        },
        "/api/v1/lms/orders": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "My course orders",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "User orders" } },
            },
        },
        "/api/v1/lms/orders/{orderId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get single order (owner or admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Order detail" }, 403: { description: "Not authorized" }, 404: { description: "Order not found" } },
            },
        },
        "/api/v1/lms/enrollments": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "My enrollments",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Enrollment list" } },
            },
        },
        "/api/v1/lms/enrollments/{enrollmentId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get enrollment (owner or admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "enrollmentId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Enrollment detail" }, 403: { description: "Not authorized" }, 404: { description: "Not found" } },
            },
        },
        "/api/v1/lms/wishlist": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get my course wishlist",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Wishlisted courses" } },
            },
            post: {
                tags: ["LMS Marketplace"],
                summary: "Toggle course in wishlist",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["courseId"], properties: { courseId: { type: "string" } } } } } },
                responses: { 200: { description: "{ wishlisted: boolean }" } },
            },
        },
        "/api/v1/lms/wishlist/toggle": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Toggle course in wishlist (alias)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["courseId"], properties: { courseId: { type: "string" } } } } } },
                responses: { 200: { description: "{ wishlisted: boolean }" } },
            },
        },
        "/api/v1/lms/reviews/{courseId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List course reviews",
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Review list" }, 404: { description: "Course not found" } },
            },
            post: {
                tags: ["LMS Marketplace"],
                summary: "Add course review (enrolled only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["rating"], properties: { rating: { type: "number", minimum: 1, maximum: 5 }, comment: { type: "string" } } } } } },
                responses: { 201: { description: "Review added" }, 403: { description: "Enrollment required" } },
            },
        },
        "/api/v1/lms/courses/{courseId}/reviews": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List course reviews (alias)",
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Review list" } },
            },
        },
        "/api/v1/lms/coupons/validate": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Validate coupon for a course",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "courseId"], properties: { code: { type: "string" }, courseId: { type: "string" } } } } } },
                responses: { 200: { description: "{ discount, payable }" }, 400: { description: "Invalid/expired coupon" } },
            },
        },
        "/api/v1/lms/coupons": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List coupons (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Coupon list" } },
            },
            post: {
                tags: ["LMS Marketplace"],
                summary: "Create coupon (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["code", "discountType", "discountValue", "endDate"], properties: { code: { type: "string" }, discountType: { type: "string", enum: ["percentage", "fixed"] }, discountValue: { type: "number" }, maxDiscount: { type: "number" }, minPurchaseAmount: { type: "number" }, courseId: { type: "string" }, usageLimit: { type: "number" }, endDate: { type: "string", format: "date-time" } } } } } },
                responses: { 201: { description: "Coupon created" } },
            },
        },
        "/api/v1/lms/certificates": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "My certificates",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Certificate list" } },
            },
        },
        "/api/v1/lms/certificates/{certificateId}": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Get certificate (owner or admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "certificateId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Certificate detail" }, 403: { description: "Not authorized" }, 404: { description: "Not found" } },
            },
        },
        "/api/v1/lms/instructor/courses": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "My courses (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Instructor course list" }, 403: { description: "Instructor role required" } },
            },
            post: {
                tags: ["LMS Marketplace"],
                summary: "Create course as DRAFT (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Course" } } } },
                responses: { 201: { description: "Draft course created" } },
            },
        },
        "/api/v1/lms/instructor/courses/{courseId}": {
            put: {
                tags: ["LMS Marketplace"],
                summary: "Update own course (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Course updated" }, 403: { description: "Not authorized" } },
            },
        },
        "/api/v1/lms/instructor/courses/{courseId}/lectures": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Add lecture to own course (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, videoUrl: { type: "string" }, videoSection: { type: "string" }, videoLength: { type: "number" }, isPreview: { type: "boolean" } } } } } },
                responses: { 201: { description: "Lecture added" } },
            },
        },
        "/api/v1/lms/instructor/courses/{courseId}/submit": {
            post: {
                tags: ["LMS Marketplace"],
                summary: "Submit course for review (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                responses: { 200: { description: "Status -> SUBMITTED" } },
            },
        },
        "/api/v1/lms/instructor/students": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Enrollments in my courses (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Student enrollments" } },
            },
        },
        "/api/v1/lms/instructor/revenue": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Revenue breakdown (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "{ totalRevenue, totalEnrollments, byCourse }" } },
            },
        },
        "/api/v1/lms/instructor/analytics": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Teaching analytics (Instructor/Admin)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Courses, enrollments, completions" } },
            },
        },
        "/api/v1/lms/admin/courses": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "All courses incl. non-published (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Full course list" } },
            },
        },
        "/api/v1/lms/admin/courses/{courseId}/status": {
            put: {
                tags: ["LMS Marketplace"],
                summary: "Set lifecycle status (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"] } } } } } },
                responses: { 200: { description: "Status updated" }, 400: { description: "Invalid status" } },
            },
        },
        "/api/v1/lms/admin/instructors": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "List instructors/admins (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Instructor list" } },
            },
        },
        "/api/v1/lms/admin/orders": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "All course orders (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Order list" } },
            },
        },
        "/api/v1/lms/admin/enrollments": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "All enrollments (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "Enrollment list" } },
            },
        },
        "/api/v1/lms/admin/analytics": {
            get: {
                tags: ["LMS Marketplace"],
                summary: "Marketplace totals (Admin only)",
                security: [{ bearerAuth: [] }, { cookieAuth: [] }],
                responses: { 200: { description: "{ users, courses, orders, enrollments, certificates }" } },
            },
        },
    },
};
//# sourceMappingURL=swagger.js.map