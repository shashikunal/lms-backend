# 🎓 LMS Course Marketplace Backend API

A production-ready RESTful API backend for a **course marketplace** (digital courses only — no shipping, cart, or inventory). Built with **Node.js**, **Express**, **TypeScript**, and **MongoDB**, featuring full **OpenAPI 3.0 (Swagger)** interactive documentation, JWT & Cookie authentication, Cloudinary media storage, Upstash/Redis caching, and zero-config deployment on **Vercel Serverless**.

> **Verified Oct 2026:** 104/104 endpoint checks pass against a live server. Removed legacy physical-commerce APIs (`/product`, `/cart`, `/address`, `/ecommerce/order`, `/product-reviews`, shop category/coupon/payment/wishlist) return `404` — use `/api/v1/lms/*`.

---

## 📑 Table of Contents

- [Features](#-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Quick Start & Local Setup](#-quick-start--local-setup)
- [Swagger & API Documentation](#-swagger--api-documentation)
- [API Endpoints Reference](#-api-endpoints-reference) (LMS marketplace: student, instructor, admin)
  - [System](#system)
  - [Authentication & Users](#authentication--users)
  - [Courses (legacy, supported)](#courses)
  - [Course Orders (legacy, supported)](#course-orders-lms)
  - [LMS Marketplace Discovery](#lms-marketplace-discovery)
  - [Lectures, Progress & Certificates](#lectures-progress--certificates)
  - [Purchase & Enrollments](#purchase--enrollments)
  - [Wishlist, Reviews & Coupons](#wishlist-reviews--coupons)
  - [Instructor Marketplace](#instructor-marketplace)
  - [Admin Marketplace](#admin-marketplace)
  - [Notifications](#notifications)
  - [Analytics](#analytics)
  - [Layout](#layout)
- [How to use as User vs Admin](#-how-to-use-as-user-vs-admin)
- [Postman + ReactJS Guide](./FRONTEND_POSTMAN_GUIDE.md)
- [Simple Guide (easiest, start here)](./SIMPLE_GUIDE.md)
- [Simple Guide as HTML page](./simple-guide.html) (live: `/simple`)
- [Module-Wise Full Docs (Auth & Courses)](./MODULE_WISE_GUIDE.md)
- [Step-by-Step HTML Guide](./step-by-step-guide.html) (single file, open in browser)
- [Vercel Deployment Guide](#-vercel-deployment-guide)
  - [Option A: Deploy with Vercel CLI](#option-a-deploy-with-vercel-cli)
  - [Option B: Deploy with Git & Vercel Dashboard](#option-b-deploy-with-git--vercel-dashboard)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## ✨ Features

- **Authentication & Security**: Email/password registration with activation codes, OAuth social logins (Google/GitHub), JWT access & refresh tokens, HTTP-only cookie security, and role-based authorization (`user`, `instructor`, `admin`).
- **Interactive OpenAPI 3.0 / Swagger UI**: Fully documented endpoints with request bodies, schemas, and live testing at `/api-docs`.
- **Course Management**: Rich course catalog with video lessons, reviews, ratings, question-and-answer discussion threads, and admin content management.
- **Digital Purchase & Enrollment**: Razorpay create/verify (HMAC), orders, and enrollment-gated course access — no address, quantity, or cart.
- **Learning & Certificates**: Lecture progress, completion tracking, auto-issued certificates, My Learning dashboard, wishlist, and coupons.
- **Admin Dashboards & Analytics**: 12-month analytics graphs for user growth, courses published, and orders processed.
- **Dynamic Site Layout**: Editable banner layouts, FAQs, and category configurations.
- **Serverless & Cloud Native**: Native Vercel serverless function entrypoint with connection pooling and resilient cache fallback.

---

## 🛠 Architecture & Tech Stack

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (ES6+)
- **Web Framework**: Express.js
- **Database**: MongoDB via Mongoose (with connection pooling)
- **Cache**: Redis / Upstash (with graceful in-memory fallback)
- **Storage**: Cloudinary
- **Documentation**: Swagger UI & OpenAPI 3.0.3 specification
- **Deployment**: Vercel Serverless (`@vercel/node`)

---

## 🚀 Quick Start & Local Setup

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/shashikunal/lms-backend.git
cd lms-backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```bash
cp .env.example .env
```

Fill in your configuration values:
- `DB_URI`: MongoDB connection string
- `ACCESS_TOKEN` & `REFRESH_TOKEN`: Secret keys for JWT
- `CLOUDINARY_*`: Cloudinary credentials (optional for core endpoints)
- `REDIS_URL`: Redis connection URL (optional, memory fallback available)

### 3. Compile & Run

**Development Mode (Hot Reloading):**
```bash
npm run dev
```

**Production Build & Run:**
```bash
npm run build
npm start
```

Once running, visit:
- **API Index**: `http://localhost:8000/`
- **Swagger Documentation**: `http://localhost:8000/api-docs`
- **Raw OpenAPI Spec**: `http://localhost:8000/api-docs.json`
- **Health Check**: `http://localhost:8000/test`

---

## 📖 Swagger & API Documentation

Interactive Swagger documentation is available out of the box.

- **Interactive Swagger UI**: `/api-docs` (and `/docs`)
- **OpenAPI 3.0 JSON**: `/api-docs.json`
- **Standard UI Route**: `/api-docs-standard`

> **Note on Serverless compatibility**: The Swagger UI at `/api-docs` uses a high-performance CDN-backed bundle that is immune to static file bundle truncation or MIME errors in Vercel serverless environments.

---

## 📡 API Endpoints Reference

> Full in-depth guide with request/response examples for students: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).
> Auth rule: send `Authorization: Bearer <access_token>` on every protected route. Roles: `user` (student), `instructor`, `admin` — promote via `PUT /api/v1/auth/update-user-roles`.

### System
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | API status and endpoint directory | Public |
| `GET` | `/test` | Health check endpoint | Public |
| `GET` | `/api-docs` (`/docs`) | Interactive Swagger UI documentation | Public |
| `GET` | `/api-docs.json` | Raw OpenAPI 3.0 JSON specification | Public |

### Authentication & Users
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register user and trigger activation code email | Public |
| `POST` | `/api/v1/auth/activate-user` | Activate account with `{ activation_token, activation_code }` | Public |
| `POST` | `/api/v1/auth/login` | Login with `{ email, password }`, returns JWT + cookies | Public |
| `GET` | `/api/v1/auth/logout` | Logout and clear session cookies | User / Admin |
| `GET` | `/api/v1/auth/refreshtoken` | Refresh expired access token (via cookies) | Cookie |
| `GET` | `/api/v1/auth/me` | Fetch currently logged-in user profile | User / Admin |
| `POST` | `/api/v1/auth/social-auth` | Social login via Google / GitHub (`{ email, name, avatar? }`) | Public |
| `PUT` | `/api/v1/auth/update-user-info` | Update own profile name (`{ name }`) | User / Admin |
| `PUT` | `/api/v1/auth/update-user-password`| Update password (`{ oldPassword, newPassword }`) | User / Admin |
| `PUT` | `/api/v1/auth/update-user-profile-picture` | Update avatar (`{ avatar }`) | User / Admin |
| `GET` | `/api/v1/auth/get-all-user-dashboard` (alias `/get-users`) | Get all users | Admin only |
| `PUT` | `/api/v1/auth/update-user-roles` | Update role (`{ id, role: "user" \| "instructor" \| "admin" }`) | Admin only |
| `DELETE` | `/api/v1/auth/delete-user/:id` | Delete user account by ID | Admin only |

### Courses
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/course/create-course` | Create a new course | Admin only |
| `PUT` | `/api/v1/course/edit-course/:id` | Edit existing course details | Admin only |
| `GET` | `/api/v1/course/get-course/:id` | Get single course preview (safe content) | Public |
| `GET` | `/api/v1/course/get-courses` | Get all published courses | Public |
| `GET` | `/api/v1/course/get-course-content/:id` | Get full videos/lessons (must be enrolled) | Enrolled User / Admin |
| `PUT` | `/api/v1/course/add-question` | Post a question inside a lesson | Enrolled User / Admin |
| `PUT` | `/api/v1/course/add-answer` | Submit an answer to a question | Enrolled User / Admin |
| `PUT` | `/api/v1/course/add-review/:id` | Add review/rating for an enrolled course | Enrolled User |
| `PUT` | `/api/v1/course/add-replay` | Instructor reply to a student review | Admin only |
| `GET` | `/api/v1/course/get-all-course-dashboard` (alias `/get-admin-courses`) | All courses for admin dashboard | Admin only |
| `DELETE` | `/api/v1/course/delete-course/:id` | Delete course by ID | Admin only |

### Course Orders (LMS)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/order/create-order` | Enroll in a course (`{ courseId, payment_info }`) | User / Admin |
| `GET` | `/api/v1/order/get-all-order-dashboard` | List all course orders | Admin only |

### Categories & Brands

> Removed. Course categories now come from `GET /api/v1/lms/categories` (aggregated from published courses).

### Products

> Removed (`404`). Courses are digital products — see [LMS Marketplace Discovery](#lms-marketplace-discovery).

### Address, Cart, Wishlist

> Removed (`404`). No shipping addresses, no physical cart. Course wishlist lives at `GET|POST /api/v1/lms/wishlist`.

### Coupons & Payments

> Shop coupon/payment routes removed (`404`). Course coupons: `POST /api/v1/lms/coupons` (admin), `POST /api/v1/lms/coupons/validate`. Course payments: `POST /api/v1/lms/payments/create` → `POST /api/v1/lms/payments/verify`.

### E-Commerce Orders

> Removed (`404`). Course orders: `GET /api/v1/lms/orders`, `GET /api/v1/lms/purchases`, `GET /api/v1/lms/admin/orders`.

### Product Reviews

> Removed (`404`). Course reviews: `GET /api/v1/lms/reviews/:courseId`, `POST /api/v1/lms/reviews/:courseId` (enrolled only).

### LMS Marketplace Discovery
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lms/courses` | Published courses (`?page&limit&category&level&search`) | Public |
| `GET` | `/api/v1/lms/categories` | Categories with counts | Public |
| `GET` | `/api/v1/lms/search?q=` | Search courses | Public |
| `GET` | `/api/v1/lms/home` | Featured / top-rated / newest | Public |
| `GET` | `/api/v1/lms/courses/:courseId` | Course detail | Public |
| `GET` | `/api/v1/lms/courses/:courseId/curriculum` | Curriculum with locked flags | Public |
| `GET` | `/api/v1/lms/courses/:courseId/sections` | Sections | Public |
| `GET` | `/api/v1/lms/sections/:sectionId[/lectures]` | Section by lecture ID or title | Public |

### Lectures, Progress & Certificates
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lms/lectures/:lectureId` | Lecture (preview open; locked → 403) | User |
| `GET` | `/api/v1/lms/lectures/:lectureId/access` | `{ hasAccess }` | User |
| `POST` | `/api/v1/lms/lectures/:lectureId/progress` | Save `{ watchedSeconds }` | Enrolled |
| `POST` | `/api/v1/lms/lectures/:lectureId/complete` | Complete (100% → certificate) | Enrolled |
| `GET` | `/api/v1/lms/my-learning` | Continue / in-progress / completed / wishlist / certificates | User |
| `GET` | `/api/v1/lms/enrollments[/:enrollmentId]` | My enrollments | User |
| `GET` | `/api/v1/lms/certificates[/:certificateId]` | My certificates | User |

### Purchase & Enrollments
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/lms/payments/create` | Razorpay order (`{ courseId, couponCode? }`) | User |
| `POST` | `/api/v1/lms/payments/verify` | Verify → `201` enrollment (bad sig → 400) | User |
| `GET` | `/api/v1/lms/purchases` | Purchase history | User |
| `GET` | `/api/v1/lms/orders[/:orderId]` | My orders | User |

### Wishlist, Reviews & Coupons
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET`/`POST` | `/api/v1/lms/wishlist` (+ `/toggle`) | Course wishlist (`{ courseId }`) | User |
| `GET` | `/api/v1/lms/reviews/:courseId` (alias `/courses/:id/reviews`) | Reviews | Public |
| `POST` | `/api/v1/lms/reviews/:courseId` | Add review (`{ rating, comment }`) | Enrolled |
| `POST` | `/api/v1/lms/coupons/validate` | `{ code, courseId }` → discount | User |
| `GET`/`POST` | `/api/v1/lms/coupons` | List / create coupons | Admin only |

### Instructor Marketplace
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET`/`POST` | `/api/v1/lms/instructor/courses` | My courses / create DRAFT | Instructor/Admin |
| `PUT` | `/api/v1/lms/instructor/courses/:courseId` | Edit own course | Instructor/Admin |
| `POST` | `/api/v1/lms/instructor/courses/:courseId/lectures` | Add lecture | Instructor/Admin |
| `POST` | `/api/v1/lms/instructor/courses/:courseId/submit` | Submit for review | Instructor/Admin |
| `GET` | `/api/v1/lms/instructor/students` | Enrollments in my courses | Instructor/Admin |
| `GET` | `/api/v1/lms/instructor/revenue` | Revenue breakdown | Instructor/Admin |
| `GET` | `/api/v1/lms/instructor/analytics` | Teaching analytics | Instructor/Admin |

### Admin Marketplace
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/lms/admin/courses` | All courses incl. drafts | Admin only |
| `PUT` | `/api/v1/lms/admin/courses/:courseId/status` | Set lifecycle `{ status }` | Admin only |
| `GET` | `/api/v1/lms/admin/instructors` | Instructors | Admin only |
| `GET` | `/api/v1/lms/admin/orders` | All orders | Admin only |
| `GET` | `/api/v1/lms/admin/enrollments` | All enrollments | Admin only |
| `GET` | `/api/v1/lms/admin/analytics` | Totals | Admin only |

### Notifications
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications/get-all-notification` | Get all admin notifications | Admin only |
| `PUT` | `/api/v1/notifications/update-notification-status/:id` | Mark notification as read | Admin only |

### Analytics
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/analytics/get-users-analytics` (alias `/users-analytics`) | 12-month user sign-up analytics | Admin only |
| `GET` | `/api/v1/analytics/get-course-analytics` (alias `/courses-analytics`) | 12-month course creation analytics | Admin only |
| `GET` | `/api/v1/analytics/get-order-analytics` (alias `/orders-analytics`) | 12-month order volume analytics | Admin only |

### Layout
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/layout/create-layout` | Create Banner, FAQ, or Categories layout | Admin only |
| `PUT` | `/api/v1/layout/update-layout` | Update Banner, FAQ, or Categories layout | Admin only |
| `GET` | `/api/v1/layout/get-layout?type=faq` | Retrieve layout by lowercase `type` (`banner`/`faq`/`categories`) | Public |

---

## 👥 How to use as User vs Admin

**Student (user) — register → activate → login → browse → buy → learn:**

```bash
POST /api/v1/auth/register        # { name, email, password } → 201 + activationCode
POST /api/v1/auth/activate-user   # { activation_token, activation_code }
POST /api/v1/auth/login           # { email, password } → save accessToken
POST /api/v1/auth/forgot-password # { email } → sends reset link
POST /api/v1/auth/reset-password  # { token, newPassword }
POST /api/v1/auth/2fa/setup        # get 2FA secret + otpauth URL
POST /api/v1/auth/2fa/verify       # verify token → enable 2FA
POST /api/v1/auth/2fa/disable      # disable 2FA (requires token)
GET  /api/v1/auth/me              # Authorization: Bearer <token>
GET  /api/v1/lms/courses          # browse marketplace
POST /api/v1/lms/payments/create  # { courseId } → Stripe PaymentIntent
POST /api/v1/lms/payments/verify  # { paymentIntentId, courseId }
POST /api/v1/lms/payments/refund  # { orderId } → refund + remove enrollment
GET  /api/v1/lms/my-learning      # Go to Course
GET  /api/v1/lms/progress-analytics # learning progress stats
GET  /api/v1/lms/certificates/:id/download # download PDF certificate
```

**Instructor — create → submit → published → revenue:**

```bash
POST /api/v1/lms/instructor/courses                 # DRAFT course
POST /api/v1/lms/instructor/courses/:id/lectures    # curriculum
POST /api/v1/lms/instructor/courses/:id/submit      # SUBMITTED
# (admin publishes)
GET  /api/v1/lms/instructor/revenue
```

**Admin — publish → manage:**

```bash
PUT  /api/v1/lms/admin/courses/:id/status  # { status: "PUBLISHED" }
GET  /api/v1/auth/get-all-user-dashboard
PUT  /api/v1/auth/update-user-roles  # { id, role: "user" | "instructor" | "admin" }
GET  /api/v1/lms/admin/orders
GET  /api/v1/lms/admin/analytics
```

See [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) for full examples and the "Common student mistakes" section.

---

## 🌐 Vercel Deployment Guide

The project is structured with `api/index.ts` and `vercel.json` for deployment onto Vercel Serverless.

### Option A: Deploy with Vercel CLI

1. **Login to Vercel**:
   ```bash
   npx vercel login
   ```
2. **Deploy Preview**:
   ```bash
   npx vercel
   ```
3. **Set Environment Variables in Vercel**:
   You can add environment variables via the Vercel CLI or Dashboard:
   ```bash
   npx vercel env add DB_URI
   npx vercel env add ACCESS_TOKEN
   npx vercel env add REFRESH_TOKEN
   npx vercel env add REDIS_URL
   npx vercel env add CLOUD_NAME
   npx vercel env add CLOUDINARY_API
   npx vercel env add CLOUDINARY_SECRET
   ```
4. **Deploy to Production**:
   ```bash
   npx vercel --prod
   ```

### Option B: Deploy with Git & Vercel Dashboard

1. Push your repository to GitHub / GitLab / Bitbucket:
   ```bash
   git add .
   git commit -m "feat: add swagger docs and vercel serverless configuration"
   git push origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New..."** -> **"Project"**.
3. Import your GitHub repository.
4. In the Project Settings:
   - **Framework Preset**: Leave as *Other*.
   - **Build Command**: `npm run build`
   - **Output Directory**: Leave default.
5. In **Environment Variables**, paste the keys from `.env.example`.
6. Click **Deploy**.
7. Once deployed, access `https://<your-project>.vercel.app/api-docs` to interact with your live API documentation!

---

## 🔒 Environment Variables

| Variable | Required | Description |
| :--- | :--- | :--- |
| `PORT` | No (Default: 8000) | Local server port |
| `DB_URI` | Yes | MongoDB connection string (e.g. MongoDB Atlas) |
| `ORIGIN` | No | Allowed frontend origin for CORS (e.g. `https://myapp.com`) |
| `REDIS_URL` | No | Redis connection URL for caching (Upstash recommended) |
| `ACCESS_TOKEN` | Yes | Secret string for JWT access tokens |
| `REFRESH_TOKEN` | Yes | Secret string for JWT refresh tokens |
| `ACCESS_TOKEN_EXPIRE` | No (Default: 5) | Access token expiration in minutes |
| `REFRESH_TOKEN_EXPIRE` | No (Default: 3) | Refresh token expiration in days |
| `ACTIVATION_TOKEN_SECRET` | Yes | Secret for email activation tokens |
| `CLOUD_NAME` | No | Cloudinary cloud name for media uploads |
| `CLOUDINARY_API` | No | Cloudinary API key |
| `CLOUDINARY_SECRET` | No | Cloudinary API secret |
| `SMTP_HOST` | No | SMTP mail server host |
| `SMTP_PORT` | No | SMTP mail server port |
| `SMTP_SERVICE` | No | SMTP service provider |
| `SMTP_MAIL` | No | Sender email address |
| `SMTP_PASSWORD` | No | App password for sender email |

---

## 📄 License

This project is licensed under the ISC License.
