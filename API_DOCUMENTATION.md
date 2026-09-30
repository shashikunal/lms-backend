# LMS & E-Commerce REST API — Clean Guide

> **Base URL (Production):** `https://mockapi-mauve.vercel.app`
> **Base URL (Local):** `http://localhost:8000`
> **Interactive Swagger UI:** `/api-docs` (or `/docs`) · **Raw OpenAPI JSON:** `/api-docs.json`
> **Test mailbox (activation codes):** https://ethereal.email/messages

This guide is the single source of truth for students. It shows **exactly how to call each endpoint as a `user` vs an `admin`**, with request/response examples. No code was changed — this is documentation only.

> **New? Start with Postman + React:** see [`FRONTEND_POSTMAN_GUIDE.md`](./FRONTEND_POSTMAN_GUIDE.md) for step-by-step Postman setup and ReactJS integration (auth context, user shop flow, admin screens).

---

## Table of Contents

1. [How this API works (read first)](#1-how-this-api-works-read-first)
2. [Student Quickstart — User flow (5 minutes)](#2-student-quickstart--user-flow-5-minutes)
3. [Admin Quickstart (5 minutes)](#3-admin-quickstart-5-minutes)
4. [Authentication & Users](#4-authentication--users)
5. [Courses (LMS)](#5-courses-lms)
6. [Course Orders (LMS checkout)](#6-course-orders-lms-checkout)
7. [Categories & Brands](#7-categories--brands)
8. [Products Catalog](#8-products-catalog)
9. [Address Book](#9-address-book)
10. [Shopping Cart](#10-shopping-cart)
11. [Wishlist](#11-wishlist)
12. [Coupons](#12-coupons)
13. [Payments (Razorpay)](#13-payments-razorpay)
14. [E-Commerce Orders](#14-e-commerce-orders)
15. [Product Reviews](#15-product-reviews)
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
| `user` | Default. Can shop, enroll in courses, manage own cart/addresses/orders, ask questions, write reviews. | Register normally. |
| `admin` | Everything a user can do, **plus** create/edit products, courses, categories, coupons, view all orders/users, analytics. | An existing admin calls `PUT /api/v1/auth/update-user-roles` with `{ "id": "<userId>", "role": "admin" }`. There is no self-promote endpoint. |

> If you get `403 Forbidden`, you called an admin-only endpoint with a `user` token. If you get `401 Unauthorized`, your token is missing/expired.

### 1.3 URL rule

Every path below is relative to the base URL. Example:

```
POST https://mockapi-mauve.vercel.app/api/v1/auth/login
GET  http://localhost:8000/api/v1/product/all
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

**Step 5 — Shop as a user**

```http
GET /api/v1/product/all?page=1&limit=5
POST /api/v1/address/add            (Authorization required, see §9)
GET  /api/v1/cart/                  (Authorization required, see §10)
POST /api/v1/ecommerce/order/create (Authorization required, see §14)
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

# 2. Create a category (need its _id for products)
POST /api/v1/category/create
Authorization: Bearer <admin_token>
{ "name": "Electronics", "description": "Gadgets" }

# 3. Create a brand
POST /api/v1/category/brand/create
Authorization: Bearer <admin_token>
{ "name": "Acme", "description": "Acme brand" }

# 4. Create a product (use category _id + brand _id)
POST /api/v1/product/create
Authorization: Bearer <admin_token>
{ "title": "Wireless Mouse", "price": 999, "category": "<categoryId>", "stockQuantity": 50 }

# 5. Create a coupon
POST /api/v1/coupon/create
Authorization: Bearer <admin_token>
{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10, "minOrderAmount": 500, "endDate": "2026-12-31" }

# 6. View all orders / users / analytics
GET /api/v1/ecommerce/order/admin/all?status=all&page=1&limit=20
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
| `PUT` | `/update-user-roles` | Admin | Change role. Body: `{ "id": "<userId>", "role": "user" \| "admin" }`. |
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

> For physical products use §14 (`/api/v1/ecommerce/order`), not this.

---

## 7. Categories & Brands

Base route: `/api/v1/category`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/all` | Public | All active categories. |
| `GET` | `/single/:idOrSlug` | Public | One category by Mongo ID or slug. |
| `GET` | `/brands/all` | Public | All brands. |
| `POST` | `/create` | Admin | Create category. Body: `{ "name": "...", "description": "...", "image": "...", "parentCategory": "<optional parentId>", "displayOrder": 1 }`. |
| `PUT` | `/update/:id` | Admin | Update category (same fields). |
| `DELETE` | `/delete/:id` | Admin | Delete category. |
| `POST` | `/brand/create` | Admin | Create brand. Body: `{ "name": "...", "description": "...", "logo": "...", "website": "..." }`. |

```http
POST /api/v1/category/create
Authorization: Bearer <admin_token>
{ "name": "Laptops", "description": "All laptops", "displayOrder": 2 }
```

---

## 8. Products Catalog

Base route: `/api/v1/product`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/all` | Public | Search + filter + paginate (see query params). |
| `GET` | `/featured` | Public | Featured products (`isFeatured: true`). |
| `GET` | `/single/:idOrSlug` | Public | One product by ID or slug. |
| `GET` | `/related/:id` | Public | Products in the same category. |
| `POST` | `/create` | Admin | Create product. Required: `title, price, category`. |
| `PUT` | `/update/:id` | Admin | Update product (any fields). |
| `DELETE` | `/delete/:id` | Admin | Delete product. |

**Query params for `GET /all`:** `keyword, category, brand, minPrice, maxPrice, rating, sort, page, limit`

```
GET /api/v1/product/all?keyword=mouse&minPrice=100&maxPrice=2000&sort=price_low&page=1&limit=12
```

`sort` options: `newest | price_low | price_high | rating | popular`.

**Admin example — create product:**

```http
POST /api/v1/product/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Wireless Mouse",
  "price": 999,
  "discountPrice": 799,
  "category": "<categoryId>",
  "brand": "<brandId>",
  "description": "Ergonomic 2.4GHz mouse",
  "stockQuantity": 50,
  "isFeatured": true,
  "isPublished": true,
  "tags": ["wireless", "mouse"],
  "images": [{ "public_id": "x", "url": "https://..." }]
}
```

---

## 9. Address Book

Base route: `/api/v1/address` — all routes need auth (user or admin token; users only see their own).

| Method | Endpoint | What it does |
|---|---|---|
| `POST` | `/add` | Add address. Required: `fullName, phone, addressLine1, city, state, postalCode`. Optional: `addressLine2, landmark, country (default India), addressType (home/work/other), isDefault`. Aliases accepted: `phoneNumber→phone`, `street→addressLine1`, `zipCode→postalCode`. |
| `GET` | `/my-addresses` | List my addresses. |
| `PUT` | `/update/:id` | Edit address (any fields). |
| `DELETE` | `/delete/:id` | Delete address. |
| `PUT` | `/set-default/:id` | Make this my default address. |

```http
POST /api/v1/address/add
Authorization: Bearer <user_token>

{
  "fullName": "Ravi Kumar",
  "phone": "9876543210",
  "addressLine1": "H.No 1-2-3, MG Road",
  "city": "Hyderabad",
  "state": "Telangana",
  "postalCode": "500001",
  "country": "India",
  "addressType": "home",
  "isDefault": true
}
```

---

## 10. Shopping Cart

Base route: `/api/v1/cart` — all routes need auth.

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/` | My cart with subtotal/tax/discounts/total. |
| `POST` | `/add` | Add item. Body: `{ "productId": "...", "variantSku": "..." (optional), "quantity": 1 }`. |
| `PUT` | `/update-quantity` | Change qty. Body: `{ "itemId": "<cartItemId>", "quantity": 3 }`. |
| `DELETE` | `/item/:itemId` | Remove one item (`:itemId` is the cart item ID, not product ID). |
| `DELETE` | `/clear` | Empty cart. |
| `POST` | `/merge` | Merge guest cart after login. Body: `{ "guestItems": [{ "productId": "...", "quantity": 1 }] }`. |

```http
POST /api/v1/cart/add
Authorization: Bearer <user_token>
{ "productId": "<productId>", "quantity": 2 }
```

---

## 11. Wishlist

Base route: `/api/v1/wishlist` — all routes need auth.

| Method | Endpoint | What it does |
|---|---|---|
| `GET` | `/` | My wishlist. |
| `POST` | `/toggle` | Add if missing, remove if present. Body: `{ "productId": "..." }`. |
| `POST` | `/move-to-cart/:productId` | Move that product into cart. |

```http
POST /api/v1/wishlist/toggle
Authorization: Bearer <user_token>
{ "productId": "<productId>" }
```

---

## 12. Coupons

Base route: `/api/v1/coupon` — all routes need auth; create/list/delete are admin-only.

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/apply` | Auth | Apply code to my cart. Body: `{ "code": "WELCOME10" }`. |
| `POST` | `/remove` | Auth | Remove coupon from cart. |
| `POST` | `/create` | Admin | Create coupon. |
| `GET` | `/all` | Admin | All coupons + stats. |
| `DELETE` | `/delete/:id` | Admin | Delete coupon. |

**Admin example:**

```http
POST /api/v1/coupon/create
Authorization: Bearer <admin_token>

{
  "code": "WELCOME10",
  "discountType": "percentage",
  "discountValue": 10,
  "minOrderAmount": 500,
  "maxDiscountLimit": 200,
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "usageLimit": 100
}
```

Accepted aliases: `discountAmount→discountValue`, `minPurchaseAmount→minOrderAmount`, `maxDiscountAmount→maxDiscountLimit`, `expiryDate/expiresAt→endDate`. `discountType` is `percentage` or `fixed`.

**User example:**

```http
POST /api/v1/coupon/apply
Authorization: Bearer <user_token>
{ "code": "WELCOME10" }
```

---

## 13. Payments (Razorpay)

Base route: `/api/v1/payment`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/razorpay-key` | Public | Get Razorpay Key ID for frontend checkout. |
| `POST` | `/razorpay-order` | Auth | Create Razorpay order. Body: `{ "amount": 999, "receipt": "rcpt_001" }` (amount in INR). |
| `POST` | `/verify` | Auth | Verify payment signature. Body: `{ "razorpay_order_id": "...", "razorpay_payment_id": "...", "razorpay_signature": "..." }`. |
| `POST` | `/webhook` | Public | Razorpay server webhook (Razorpay calls this, not students). |
| `POST` | `/refund` | Admin | Refund. Body: `{ "paymentId": "pay_...", "amount": 500 }`. |

**User checkout flow:**

```
1. GET  /api/v1/payment/razorpay-key          → get key
2. POST /api/v1/payment/razorpay-order        → { amount } → get razorpay order id
3. Pay on frontend with Razorpay Checkout
4. POST /api/v1/payment/verify                → confirm signature
5. POST /api/v1/ecommerce/order/create        → place the order (see §14)
```

Cash-on-delivery skips steps 1–4: just call `POST /api/v1/ecommerce/order/create` with `paymentInfo: { method: "COD" }`.

---

## 14. E-Commerce Orders

Base route: `/api/v1/ecommerce/order` — all routes need auth. Cart must have items before ordering.

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `POST` | `/create` | Auth | Place order from cart. Needs address + payment info (see below). Clears cart on success. |
| `GET` | `/my-orders` | Auth | My order history. |
| `GET` | `/single/:id` | Auth | One order (owner or admin). |
| `PUT` | `/cancel/:id` | Auth | Cancel own order (only if still `Pending`/`Processing`). Body: `{ "reason": "..." }` (optional). |
| `GET` | `/admin/all` | Admin | All orders. Query: `?status=Pending|Processing|Shipped|Delivered|Cancelled|all&page=1&limit=20`. |
| `PUT` | `/admin/status/:id` (alias: `/admin/update-status/:id`) | Admin | Update status. Body: `{ "status": "Shipped", "trackingNumber": "...", "courierPartner": "..." }`. |

**User example — order with saved address (COD):**

```http
POST /api/v1/ecommerce/order/create
Authorization: Bearer <user_token>

{ "addressId": "<addressId from §9>", "paymentInfo": { "method": "COD" } }
```

**User example — order with new address + online payment:**

```http
POST /api/v1/ecommerce/order/create
Authorization: Bearer <user_token>

{
  "shippingAddress": {
    "fullName": "Ravi Kumar", "phone": "9876543210",
    "addressLine1": "H.No 1-2-3, MG Road", "city": "Hyderabad",
    "state": "Telangana", "postalCode": "500001", "country": "India"
  },
  "paymentInfo": {
    "method": "Razorpay",
    "razorpay_order_id": "<id from §13>",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "..."
  }
}
```

**Admin example — update status:**

```http
PUT /api/v1/ecommerce/order/admin/status/<orderId>
Authorization: Bearer <admin_token>
{ "status": "Shipped", "trackingNumber": "TRK123", "courierPartner": "Delhivery" }
```

---

## 15. Product Reviews

Base route: `/api/v1/product-reviews`

| Method | Endpoint | Who | What it does |
|---|---|---|---|
| `GET` | `/product/:productId?page=1&limit=10` | Public | Reviews + average rating for a product. |
| `POST` | `/add` | Auth | Add review. Body: `{ "productId": "...", "rating": 5, "title": "Great!", "comment": "...", "images": [] }`. Rating 1–5. |
| `PUT` | `/helpful/:id` | Auth | Upvote review `:id` as helpful. |
| `DELETE` | `/delete/:id` | Auth | Delete review (author or admin). |

```http
POST /api/v1/product-reviews/add
Authorization: Bearer <user_token>
{ "productId": "<productId>", "rating": 5, "title": "Loved it", "comment": "Value for money" }
```

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
| `GET` | `/get-layout?type=Banner` | Public | Get layout. `type` = `Banner \| FAQ \| Categories` (query param). |
| `POST` | `/create-layout` | Admin | Create layout. Body: `{ "type": "Banner", "image": {...}, "title": "...", "subTitle": "..." }` or `{ "type": "FAQ", "faq": [...] }` or `{ "type": "Categories", "categories": [...] }`. |
| `PUT` | `/update-layout` | Admin | Update layout (same body shape). |

```
GET /api/v1/layout/get-layout?type=FAQ
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

1. **Wrong base path.** Shop orders are `/api/v1/ecommerce/order/*`, course enrollment is `/api/v1/order/*`. They are different systems.
2. **Forgot `Authorization` header.** Protected routes need `Authorization: Bearer <token>`. `401` = token missing/expired → login again or call `/refreshtoken`.
3. **`403 Forbidden` on admin routes.** You logged in as `user`. Get promoted via `PUT /api/v1/auth/update-user-roles`, then login again.
4. **Misspelled routes.** Real names: `/refreshtoken`, `/update-user-roles`, `/update-user-profile-picture`, `/add-replay`, `/get-all-course-dashboard`, `/get-all-order-dashboard`, `/get-all-notification`. Check the tables above, not old notes.
5. **Ordering with an empty cart.** Add to cart first (`POST /api/v1/cart/add`), then `POST /api/v1/ecommerce/order/create`.
6. **Course content without enrollment.** `GET /api/v1/course/get-course-content/:id` requires buying the course first via `POST /api/v1/order/create-order`.
7. **Wrong IDs.** Cart remove uses the **cart item ID** (`/api/v1/cart/item/:itemId`), not the product ID. Wishlist move uses the **product ID**.
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
