# LMS Course Marketplace REST API — Clean Guide

> **Verified Oct 2026:** 104/104 endpoint checks pass. Legacy physical-commerce APIs (`/product`, `/cart`, `/address`, `/ecommerce/order`, `/product-reviews`, shop category/coupon/payment/wishlist) were removed and return `404` — use `/api/v1/lms/*`.

> **Base URL (Production):** `https://mockapi-mauve.vercel.app`
> **Base URL (Local):** `http://localhost:8000`
> **Interactive Swagger UI:** `/api-docs` (or `/docs`) · **Raw OpenAPI JSON:** `/api-docs.json`
> **Test mailbox (activation codes):** https://ethereal.email/messages

This guide is the single source of truth for students. It shows **exactly how to call each endpoint as a student (`user`), instructor, or `admin`**, with request/response examples.

> **Confused? Start here:** [`SIMPLE_GUIDE.md`](./SIMPLE_GUIDE.md) — every endpoint in plain words, numbered Postman clicks, copy-paste bodies.
> **Postman + React setup:** [`FRONTEND_POSTMAN_GUIDE.md`](./FRONTEND_POSTMAN_GUIDE.md) (auth context, marketplace flow, instructor/admin screens).
> **Need every field + response explained?** see [`MODULE_WISE_GUIDE.md`](./MODULE_WISE_GUIDE.md) — full module-wise Auth & Courses documentation (request tables, success/error examples, React snippets).

---

## Table of Contents

1. [How this API works (read first)](#1-how-this-api-works-read-first)
2. [Student Quickstart — User flow (5 minutes)](#2-student-quickstart--user-flow-5-minutes)
3. [Admin Quickstart (5 minutes)](#3-admin-quickstart-5-minutes)
4. [Authentication & Users](#4-authentication--users)
5. [Courses (LMS)](#5-courses-lms)
6. [Course Orders (LMS checkout)](#6-course-orders-lms-checkout)
7. [Marketplace Discovery](#7-marketplace-discovery)
8. [Lectures, Progress & Certificates](#8-lectures-progress--certificates)
9. [Digital Purchase & Enrollments](#9-digital-purchase--enrollments)
10. [Wishlist (courses)](#10-wishlist-courses)
11. [Coupons (courses)](#11-coupons-courses)
12. [Reviews (courses)](#12-reviews-courses)
13. [Instructor Marketplace](#13-instructor-marketplace)
14. [Admin Marketplace](#14-admin-marketplace)
15. [Removed shop APIs](#15-removed-shop-apis)
16. [Notifications, Analytics, Layout (admin)](#16-notifications-analytics-layout-admin)
17. [Common student mistakes](#17-common-student-mistakes)
18. [Status codes & error format](#18-status-codes--error-format)

---

## 1. How this API works (read first)

### 1.1 How auth works

1. `POST /api/v1/auth/register` → you get an `activationToken` + `activationCode` (also emailed).
2. `POST /api/v1/auth/activate-user` → account becomes active.
3. `POST /api/v1/auth/login` → server returns `access_token` **and** sets two HTTP-only cookies (`access_token`, `refresh_token`).
4. For every protected request, send **one** of these:
   - Header: `Authorization: Bearer <access_token>` (best for Postman / frontend fetch), **or**
   - Cookies automatically (browser, `credentials: "include"` / `withCredentials: true`).
5. When the access token expires, call `GET /api/v1/auth/refreshtoken` (cookies are sent automatically) to get a new one.

### 1.2 The two roles

| Role | Meaning | How to get it |
|---|---|---|
| `user` | Default = student. Browse, buy, enroll, learn, wishlist, review. | Register normally. |
| `instructor` | Everything a student can do, **plus** create/edit courses, curriculum, submit for review, view students/revenue/analytics. | An existing admin calls `PUT /api/v1/auth/update-user-roles` with `{ "id": "<userId>", "role": "instructor" }`. There is no self-promote endpoint. |
| `admin` | Everything, **plus** publish courses, manage users/orders/enrollments/coupons/layouts, analytics. | An existing admin calls `PUT /api/v1/auth/update-user-roles` with `{ "id": "<userId>", "role": "admin" }`. |

> If you get `403 Forbidden`, you called an admin-only endpoint with a `user` token. If you get `401 Unauthorized`, your token is missing/expired.

### 1.3 URL rule

Every path below is relative to the base URL. Example:

```
POST https://mockapi-mauve.vercel.app/api/v1/auth/login
GET  http://localhost:8000/api/v1/lms/courses
```

### 1.4 Postman / fetch setup (recommended)

- Create an environment variable `baseUrl` = your base URL and `token` = access token from login.
- For protected routes set header: `Authorization: Bearer {{token}}`.
- If you use a browser frontend, use `fetch(url, { credentials: "include" })` so cookies are sent.

---

## 2. Student Quickstart — User flow (5 minutes)

Do these in order. Copy-paste the bodies.

**Step 1 — Register**

```http
POST /api/v1/auth/register
Content-Type: application/json

{ "name": "Test Student", "email": "student@example.com", "password": "Pass@123" }
```

Response gives you `activationToken` and `activationCode`. (Code is 6 digits.)

**Step 2 — Activate**

```http
POST /api/v1/auth/activate-user
Content-Type: application/json

{ "activation_token": "<activationToken from step 1>", "activation_code": "<activationCode from step 1>" }
```

**Step 3 — Login (save the token!)**

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "student@example.com", "password": "Pass@123" }
```

Response:

```json
{ "success": true, "user": { "_id": "...", "name": "...", "email": "...", "role": "user" }, "accessToken": "<COPY THIS>" }
```

**Step 4 — Check who I am**

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Step 5 — Buy & learn as a student (digital, no address/cart)**

```http
GET  /api/v1/lms/courses?page=1&limit=5
POST /api/v1/lms/payments/create   (Authorization required, see §9)
POST /api/v1/lms/payments/verify   (Authorization required, see §9)
GET  /api/v1/lms/my-learning       (Go to Course)
```

**Step 6 — Learn as a student**

```http
GET /api/v1/course/get-courses
GET /api/v1/course/get-course/:id
POST /api/v1/order/create-order     (enroll in a course, see §6)
GET /api/v1/course/get-course-content/:id   (after enrollment)
```

---

## 3. Admin Quickstart (5 minutes)

You must already have a `user` account, then get promoted once (by an existing admin or directly in MongoDB: set the user's `role` to `"admin"`), then log in again to get an admin token.

**Typical admin setup sequence:**

```http
# 1. Login as admin
POST /api/v1/auth/login
{ "email": "admin@example.com", "password": "Admin@123" }

# 2. Publish an instructor's submitted course
PUT /api/v1/lms/admin/courses/<courseId>/status
Authorization: Bearer <admin_token>
{ "status": "PUBLISHED" }

# 3. Create a coupon
POST /api/v1/lms/coupons
Authorization: Bearer <admin_token>
{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10, "endDate": "2027-01-01T00:00:00Z" }

# 4. View orders / users / analytics
GET /api/v1/lms/admin/orders
GET /api/v1/auth/get-all-user-dashboard
GET /api/v1/analytics/orders-analytics
```

**Promote a student to admin:**

```http
PUT /api/v1/auth/update-user-roles
Authorization: Bearer <admin_token>
Content-Type: application/json

{ "id": "<studentUserId>", "role": "admin" }
```

---

## 4. Authentication & Users

Base route: `/api/v1/auth`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/register` | Public | Register. Body: `{ name, email, password }`. Returns `activationToken` + `activationCode`. |
| `POST` | `/activate-user` | Public | Activate. Body: `{ activation_token, activation_code }`. |
| `POST` | `/login` | Public | Login. Body: `{ email, password }`. Returns user + `accessToken`, sets cookies. |
| `GET` | `/logout` | Auth | Clears cookies. Send token. |
| `GET` | `/refreshtoken` | Cookie | Refresh access token. Browser sends cookies automatically; in Postman enable cookies. |
| `GET` | `/me` | Auth | Returns current user. |
| `POST` | `/social-auth` | Public | Google/GitHub login. Body: `{ email, name, avatar? }`. Creates account on first use. |
| `PUT` | `/update-user-info` | Auth | Update own name. Body: `{ "name": "New Name" }`. (Email change is currently ignored — name only.) |
| `PUT` | `/update-user-password` | Auth | Change password. Body: `{ "oldPassword": "...", "newPassword": "..." }`. Social accounts without a password get `400`. |
| `PUT` | `/update-user-profile-picture` | Auth | Update avatar. Body: `{ "avatar": "<cloudinary-url-or-base64>" }`. |
| `GET` | `/get-all-user-dashboard` (alias: `/get-users`) | Admin | List all users. |
| `PUT` | `/update-user-roles` | Admin | Change role. Body: `{ "id": "<userId>", "role": "user" \| "instructor" \| "admin" }`. |
| `DELETE` | `/delete-user/:id` | Admin | Delete user by ID. |

> ⚠️ Name confusion in old docs: the real routes are `/refreshtoken` (no hyphen), `/update-user-roles` (plural), `/update-user-profile-picture` (not `update-user-avatar`). The aliases `/get-users` also work for the admin user list.

**Example — social login:**

```http
POST /api/v1/auth/social-auth
{ "email": "me@gmail.com", "name": "Me", "avatar": "https://..." }
```

**Example — update password (user):**

```http
PUT /api/v1/auth/update-user-password
Authorization: Bearer <user_token>
{ "oldPassword": "Pass@123", "newPassword": "NewPass@456" }
```

**Example — list users (admin):**

```http
GET /api/v1/auth/get-all-user-dashboard
Authorization: Bearer <admin_token>
```

---

## 5. Courses (LMS)

Base route: `/api/v1/course`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/get-courses` | Public | All published courses (catalog). |
| `GET` | `/get-course/:id` | Public | Single course preview (safe content, no full videos). |
| `GET` | `/get-course-content/:id` | Auth (must be enrolled, or admin) | Full lessons/videos. Non-enrolled users get an error. |
| `POST` | `/create-course` | Admin | Create course. Body is a course object (`name, description, price, ...` with `courseData` lessons). |
| `PUT` | `/edit-course/:id` | Admin | Edit course. |
| `PUT` | `/add-question` | Auth (enrolled or admin) | Ask under a lesson. Body: `{ "question": "...", "courseId": "...", "contentId": "..." }`. |
| `PUT` | `/add-answer` | Auth | Reply to a question. Body: `{ "answer": "...", "courseId": "...", "contentId": "...", "questionId": "..." }`. |
| `PUT` | `/add-review/:id` | Auth (enrolled) | Review course `:id`. Body: `{ "review": "...", "rating": 5 }`. |
| `PUT` | `/add-replay` | Admin | Instructor reply to a review. Body: `{ "comment": "...", "courseId": "...", "reviewId": "..." }`. |
| `GET` | `/get-all-course-dashboard` (alias: `/get-admin-courses`) | Admin | All courses + analytics. |
| `DELETE` | `/delete-course/:id` | Admin | Delete course. |

**User example — ask a question:**

```http
PUT /api/v1/course/add-question
Authorization: Bearer <user_token>
{ "question": "What is closure?", "courseId": "<courseId>", "contentId": "<lessonId>" }
```

**Admin example — reply to a review:**

```http
PUT /api/v1/course/add-replay
Authorization: Bearer <admin_token>
{ "comment": "Thanks for the feedback!", "courseId": "<courseId>", "reviewId": "<reviewId>" }
```

> ⚠️ The route is `/add-replay` (as spelled in code), not `/add-reply`.

---

## 6. Course Orders (LMS checkout)

Base route: `/api/v1/order` — this is **only for buying courses**, not for shop products.

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/create-order` | Auth | Enroll in a course. Body: `{ "courseId": "...", "payment_info": { ... } }`. Adds course to `user.courses`. |
| `GET` | `/get-all-order-dashboard` | Admin | All course orders. |

```http
POST /api/v1/order/create-order
Authorization: Bearer <user_token>
{ "courseId": "<courseId>", "payment_info": { "id": "pay_123", "status": "success" } }
```

> For the verified Razorpay flow use §9 (`POST /api/v1/lms/payments/create` → `POST /api/v1/lms/payments/verify`), which creates the order **and** enrollment.

---

## 7. Marketplace Discovery

Base route: `/api/v1/lms` — all below are public.

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/courses?page=1&limit=12` | Published courses. Filters: `category`, `level`, `search`. |
| `GET` | `/categories` | Categories + counts (aggregated from courses). |
| `GET` | `/search?q=react` | Search name/description/tags/category. |
| `GET` | `/home` | Featured / top-rated / newest blocks. |
| `GET` | `/courses/:courseId` | Detail (locked video URLs hidden). Unknown id → `404`. |
| `GET` | `/courses/:courseId/curriculum` | Curriculum with `locked` flags. |
| `GET` | `/courses/:courseId/sections` | Sections grouped by `videoSection`. |
| `GET` | `/sections/:sectionId` (+ `/lectures`) | By lecture `_id` or section title. Unknown → `404`. |

```http
GET /api/v1/lms/courses?page=1&limit=12
GET /api/v1/lms/search?q=react
```

---

## 8. Lectures, Progress & Certificates

Login required; locked lectures need enrollment (`403` otherwise). Preview lectures are open.

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/lms/lectures/:lectureId` | Auth | Lecture content. |
| `GET` | `/lms/lectures/:lectureId/access` | Auth | `{ "hasAccess": true/false }`. |
| `POST` | `/lms/lectures/:lectureId/progress` | Enrolled | Save `{ "watchedSeconds": 120 }`. |
| `POST` | `/lms/lectures/:lectureId/complete` | Enrolled | Complete (no body). 100% auto-issues certificate. |
| `GET` | `/lms/my-learning` | Auth | Continue / in-progress / completed / wishlist / certificates. |
| `GET` | `/lms/enrollments` (+ `/:enrollmentId`) | Auth | My enrollments. |
| `GET` | `/lms/certificates` (+ `/:certificateId`) | Auth | My certificates. |

---

## 9. Digital Purchase & Enrollments

Flow: detail → **Buy Now** → `payments/create` → pay → `payments/verify` → order → enrollment → **Go to Course**. No address, quantity, or cart.

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/lms/payments/create` | Auth | Stripe PaymentIntent. Body: `{ "courseId": "...", "couponCode?": "..." }`. |
| `POST` | `/lms/payments/verify` | Auth | Verify payment → `201` order + enrollment. Body: `{ "paymentIntentId", "courseId" }`. |
| `POST` | `/lms/payments/webhook` | Stripe | Webhook handler — auto-enrolls on `payment_intent.succeeded`. |
| `POST` | `/lms/payments/refund` | Auth/Admin | Refund payment + remove enrollment. Body: `{ "orderId" }`. |
| `GET` | `/lms/purchases` | Auth | Purchase history. |
| `GET` | `/lms/orders` (+ `/:orderId`) | Auth | My orders (owner or admin). |

```http
POST /api/v1/lms/payments/create
Authorization: Bearer <user_token>
{ "courseId": "<courseId>", "couponCode": "WELCOME10" }
```

```http
POST /api/v1/lms/payments/verify
Authorization: Bearer <user_token>
{ "paymentIntentId": "...", "courseId": "<courseId>" }
```

---

## 10. Wishlist (courses)

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/lms/wishlist` | Auth | My wishlisted courses. |
| `POST` | `/lms/wishlist` (alias `/lms/wishlist/toggle`) | Auth | Toggle. Body: `{ "courseId": "..." }` → `{ "wishlisted": true/false }`. |

---

## 11. Coupons (courses)

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/lms/coupons/validate` | Auth | Body: `{ "code": "WELCOME10", "courseId": "..." }` → `{ "discount", "payable" }`. |
| `POST` | `/lms/coupons` | Admin | Create. Body: `{ "code", "discountType": "percentage"\|"fixed", "discountValue", "endDate", ... }`. |
| `GET` | `/lms/coupons` | Admin | All coupons. |

```http
POST /api/v1/lms/coupons
Authorization: Bearer <admin_token>
{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10, "endDate": "2027-01-01T00:00:00Z" }
```

---

## 12. Course Categories

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/lms/categories` | Admin | Create category. Body: `{ "name": "...", "description": "..." }`. |
| `GET` | `/lms/categories` | Public | List active categories. |
| `GET` | `/lms/categories/all` | Admin | List all categories (including inactive). |
| `PUT` | `/lms/categories/:categoryId` | Admin | Update category. Body: `{ "name", "description", "isActive" }`. |
| `DELETE` | `/lms/categories/:categoryId` | Admin | Delete category. |

---

## 13. User Progress Analytics

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/lms/progress-analytics` | Auth | Learning progress stats — total/completed/in-progress counts, average progress, last activity, per-course breakdown. |

---

## 14. Course Clone

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/lms/courses/clone` | Admin | Clone a course as DRAFT. Body: `{ "courseId": "..." }`. |

---

## 15. Password Reset

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/auth/forgot-password` | Public | Send password reset link via email. Body: `{ "email": "..." }`. |
| `POST` | `/auth/reset-password` | Public | Reset password with token. Body: `{ "token": "...", "newPassword": "..." }`. |

---

## 16. Reviews (courses)

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/lms/reviews/:courseId` (alias `/lms/courses/:courseId/reviews`) | Public | Review list. |
| `POST` | `/lms/reviews/:courseId` | Enrolled | Body: `{ "rating": 5, "comment": "..." }` → `201`. Strangers get `403`. |

---

## 13. Instructor Marketplace

Roles: `instructor` or `admin`. Lifecycle: `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `PUBLISHED` → `UNPUBLISHED` / `ARCHIVED`.

| Method | Endpoint | What it does |
|---|---|---|
| `GET` / `POST` | `/lms/instructor/courses` | My courses / create as `DRAFT` (`201`). |
| `PUT` | `/lms/instructor/courses/:courseId` | Edit own course. |
| `POST` | `/lms/instructor/courses/:courseId/lectures` | Add lecture (`201`). |
| `POST` | `/lms/instructor/courses/:courseId/submit` | Submit for review. |
| `GET` | `/lms/instructor/students` | Enrollments in my courses. |
| `GET` | `/lms/instructor/revenue` | `{ totalRevenue, totalEnrollments, byCourse }`. |
| `GET` | `/lms/instructor/analytics` | Courses, enrollments, completions. |

```http
POST /api/v1/lms/instructor/courses
Authorization: Bearer <instructor_token>
{ "name": "My Course", "description": "...", "price": 499, "tags": "js",
  "level": "Beginner", "demoUrl": "https://...", "courseData": [{ "title": "L1", "videoSection": "Basics", "videoLength": 10, "isPreview": true }] }
```

---

## 14. Admin Marketplace

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/lms/admin/courses` | All courses incl. drafts. |
| `PUT` | `/lms/admin/courses/:courseId/status` | Set lifecycle. Body: `{ "status": "PUBLISHED" }`. Bad value → `400`. |
| `GET` | `/lms/admin/instructors` | Instructors/admins. |
| `GET` | `/lms/admin/orders` | All course orders. |
| `GET` | `/lms/admin/enrollments` | All enrollments. |
| `GET` | `/lms/admin/analytics` | `{ users, courses, orders, enrollments, certificates }`. |

---

## 15. Removed shop APIs

These return `404` by design (physical commerce removed Oct 2026). Use the LMS replacements above.

| Removed | Replacement |
|---|---|
| `GET /api/v1/product/*`, `POST /product/create`… | `GET /api/v1/lms/courses`, instructor create |
| `GET/POST /api/v1/cart/*` | none — digital checkout needs no cart |
| `*/api/v1/address/*` | none — no shipping |
| `*/api/v1/category/*` (shop) | `GET /api/v1/lms/categories` |
| `*/api/v1/coupon/*` (shop) | `/api/v1/lms/coupons*` |
| `*/api/v1/payment/*` (shop) | `/api/v1/lms/payments/*` |
| `*/api/v1/ecommerce/order/*` | `/api/v1/lms/orders`, `/purchases` |
| `*/api/v1/product-reviews/*` | `/api/v1/lms/reviews/:courseId` |
| `*/api/v1/wishlist/*` (shop) | `/api/v1/lms/wishlist` |

---

## 16. Notifications, Analytics, Layout (admin)

### Notifications — `/api/v1/notifications` (admin only)

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/get-all-notification` (alias: `/get-all-notifications`) | All admin notifications. |
| `PUT` | `/update-notification-status/:id` | Mark notification read. |

### Analytics — `/api/v1/analytics` (admin only)

Each has two working aliases — use either:

| What | Endpoints |
|---|---|
| User signups (12 months) | `GET /get-users-analytics` or `GET /users-analytics` |
| Course stats (12 months) | `GET /get-course-analytics` or `GET /courses-analytics` |
| Order stats (12 months) | `GET /get-order-analytics` or `GET /orders-analytics` |

```http
GET /api/v1/analytics/orders-analytics
Authorization: Bearer <admin_token>
```

### Layout — `/api/v1/layout`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/get-layout?type=banner` | Public | Get layout. `type` is lowercase: `banner`, `faq`, or `categories`. |
| `POST` | `/create-layout` | Admin | Create layout. Body: `{ "type": "banner", "image": {...}, "title": "...", "subTitle": "..." }` or `{ "type": "faq", "faq": [...] }` or `{ "type": "categories", "categories": [...] }`. |
| `PUT` | `/update-layout` | Admin | Update layout (same body shape). |

```
GET /api/v1/layout/get-layout?type=faq
```

### System

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/` | API status + endpoint directory. |
| `GET` | `/test` | Health check. |
| `GET` | `/api-docs`, `/docs` | Swagger UI. |
| `GET` | `/api-docs.json` | Raw OpenAPI JSON. |

---

## 17. Common student mistakes

1. **Old shop paths 404.** `/product`, `/cart`, `/address`, `/ecommerce/order`, `/product-reviews` (and shop category/coupon/payment/wishlist) were removed. Use `/api/v1/lms/*` (see §15).
2. **Forgot `Authorization` header.** Protected routes need `Authorization: Bearer <token>`. `401` = token missing/expired → login again or call `/refreshtoken`.
3. **`403 Forbidden` on admin routes.** You logged in as `user`. Get promoted via `PUT /api/v1/auth/update-user-roles`, then login again.
4. **Misspelled routes.** Real names: `/refreshtoken`, `/update-user-roles`, `/update-user-profile-picture`, `/add-replay`, `/get-all-course-dashboard`, `/get-all-order-dashboard`, `/get-all-notification`. Check the tables above, not old notes.
5. **Locked lecture 403.** Enroll first: `POST /api/v1/lms/payments/create` → pay → `POST /api/v1/lms/payments/verify`, then `GET /api/v1/lms/my-learning`.
6. **No certificate yet.** Complete **every** lecture via `POST /api/v1/lms/lectures/:id/complete` — issued automatically at 100%.
7. **Wrong IDs.** Lectures use lesson `_id`s from curriculum; orders/enrollments/certificates each have their own IDs.
8. **Activation code expired.** Tokens last 5 minutes. Register again to get a fresh code.
9. **Sending `email` to update-user-info.** Only `name` is applied; email is ignored.
10. **Cookies in Postman.** For `/refreshtoken`, enable the cookie jar, or just re-login to get a fresh token.

---

## 18. Status codes & error format

All errors look like:

```json
{ "success": false, "message": "Descriptive error message" }
```

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `400` | Bad request / validation failed |
| `401` | Missing or invalid token (login again) |
| `403` | Valid login, but role not allowed (need admin) |
| `404` | Route or resource not found |
| `500` | Server error |
| `503` | Database unreachable (check `DB_URI` / Atlas IP whitelist `0.0.0.0/0`) |
