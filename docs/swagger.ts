export const swaggerDocument: Record<string, any> = {
  openapi: "3.0.3",
  info: {
    title: "Learning Management System (LMS) API",
    version: "1.0.0",
    description:
      "Comprehensive RESTful API for LMS backend built with Node.js, Express, TypeScript, and MongoDB. Includes authentication, course management, orders, notifications, analytics, and dynamic layouts.\n\n📬 **Test Mailbox URL**: View test activation emails at [https://ethereal.email/messages](https://ethereal.email/messages).",
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
          role: { type: "string", enum: ["user", "admin"], example: "user" },
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
        description: "Creates an unverified account and sends a 4-digit activation code to the provided email. For testing, view the email directly at: https://ethereal.email/messages (or the mailUrl returned in the response).",
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
          200: {
            description: "Activation email sent",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    message: { type: "string", example: "Please check your email: jane@example.com to activate your account!" },
                    activationToken: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5..." },
                    activationCode: { type: "string", example: "4921" },
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
          200: {
            description: "Course updated successfully",
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
                  type: { type: "string", enum: ["Banner", "FAQ", "Categories"], example: "Banner" },
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
                  type: { type: "string", enum: ["Banner", "FAQ", "Categories"] },
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
            schema: { type: "string", enum: ["Banner", "FAQ", "Categories"] },
            description: "Layout type (can also be passed in body if supported)",
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
  },
};
