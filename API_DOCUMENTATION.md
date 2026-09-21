# 🚀 LMS & E-Commerce REST API Specification

> **Version:** 1.0.0  
> **Base URL (Production/Vercel):** `https://mockapi-mauve.vercel.app`  
> **Base URL (Local):** `http://localhost:8000`  
> **Interactive Swagger UI:** [`/api-docs`](http://localhost:8000/api-docs) | [`/docs`](http://localhost:8000/docs)  
> **Raw OpenAPI Specification:** [`/api-docs.json`](http://localhost:8000/api-docs.json)  
> **Test Mailbox (Ethereal Email):** [https://ethereal.email/messages](https://ethereal.email/messages)

---

## 📑 Table of Contents

1. [Architecture & Authentication](#1-architecture--authentication)
2. [Authentication & User Management](#2-authentication--user-management)
3. [Course Management (LMS)](#3-course-management-lms)
4. [Categories & Brands](#4-categories--brands)
5. [Products Catalog](#5-products-catalog)
6. [Address Book](#6-address-book)
7. [Shopping Cart](#7-shopping-cart)
8. [Wishlist](#8-wishlist)
9. [Coupons & Promotional Discounts](#9-coupons--promotional-discounts)
10. [Payments & Razorpay Integration](#10-payments--razorpay-integration)
11. [Orders & Fulfillment](#11-orders--fulfillment)
12. [Product Reviews & Ratings](#12-product-reviews--ratings)
13. [Admin Analytics & Dynamic Layout](#13-admin-analytics--dynamic-layout)
14. [HTTP Status Codes & Error Handling](#14-http-status-codes--error-handling)

---

## 1. Architecture & Authentication

### Security Schemes
- **Bearer Token**: `Authorization: Bearer <access_token>` header.
- **HTTP-Only Cookies**: `access_token` and `refresh_token` stored safely against XSS attacks.
- **Role-Based Access Control (RBAC)**: Supports roles `user` and `admin`.

---

## 2. Authentication & User Management

Base Route: `/api/v1/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/register` | Public | Registers user and sends 4-digit code to Ethereal mailbox |
| `POST` | `/activate-user` | Public | Verifies activation code and token, creates active user |
| `POST` | `/login` | Public | Logs in with email & password, sets cookies & returns token |
| `GET` | `/logout` | Authenticated | Clears auth cookies and terminates session |
| `GET` | `/refresh` | Public | Refreshes expired access token via refresh token |
| `GET` | `/me` | Authenticated | Retrieves current logged-in user profile |
| `POST` | `/social-auth` | Public | Social OAuth login (Google / GitHub) |
| `PUT` | `/update-user-info` | Authenticated | Updates name & email |
| `PUT` | `/update-user-password` | Authenticated | Updates existing password |
| `PUT` | `/update-user-avatar` | Authenticated | Updates user profile picture |
| `GET` | `/get-users` | Admin | Lists all registered accounts |
| `PUT` | `/update-user-role` | Admin | Promotes or demotes user role |
| `DELETE` | `/delete-user/:id` | Admin | Permanently deletes a user account |

---

## 3. Course Management (LMS)

Base Route: `/api/v1/course`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/get-courses` | Public | Retrieves all published courses for catalog browsing |
| `GET` | `/get-course/:id` | Public | Course overview, curriculum preview, public reviews |
| `GET` | `/get-course-content/:id` | Enrolled/Admin | Full video playback lessons & secure resources |
| `POST` | `/create-course` | Admin | Creates a new course |
| `PUT` | `/edit-course/:id` | Admin | Updates course metadata, pricing, video links |
| `PUT` | `/add-question` | Enrolled/Admin | Post question under a specific video lesson |
| `PUT` | `/add-answer` | Authenticated | Reply to course questions |
| `PUT` | `/add-review/:id` | Enrolled | Review and rate an enrolled course |
| `PUT` | `/add-reply` | Admin | Instructor reply to student review |
| `GET` | `/get-admin-courses` | Admin | Master courses list with enrollment analytics |
| `DELETE` | `/delete-course/:id` | Admin | Delete course |

---

## 4. Categories & Brands

Base Route: `/api/v1/category`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/all` | Public | Get all active categories (nested hierarchy supported) |
| `GET` | `/single/:idOrSlug` | Public | Get category details by ID or URL slug |
| `GET` | `/brands/all` | Public | Get all active brands |
| `POST` | `/create` | Admin | Create new category (supports parentId, image) |
| `PUT` | `/update/:id` | Admin | Update category details |
| `DELETE` | `/delete/:id` | Admin | Delete category |
| `POST` | `/brand/create` | Admin | Create brand profile (name, logo, description) |

---

## 5. Products Catalog

Base Route: `/api/v1/product`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/all` | Public | Search, category/brand filter, price range, sorting, pagination |
| `GET` | `/featured` | Public | Featured products for landing banners / hero showcases |
| `GET` | `/single/:idOrSlug` | Public | Product details by ID or slug with brand & category |
| `GET` | `/related/:id` | Public | Recommended products within same category |
| `POST` | `/create` | Admin | Create product (title, price, stock, SKU, images, specs) |
| `PUT` | `/update/:id` | Admin | Update product details |
| `DELETE` | `/delete/:id` | Admin | Delete product |

### Query Parameters for `/api/v1/product/all`
- `keyword`: Search string matching title and description.
- `category`: Category ObjectId filter.
- `brand`: Brand ObjectId filter.
- `minPrice` & `maxPrice`: Numeric price boundary filter.
- `rating`: Minimum customer review rating (1 to 5).
- `sort`: `newest`, `price_low`, `price_high`, `rating`, `popular`.
- `page` & `limit`: Pagination parameters (default page: 1, limit: 12).

---

## 6. Address Book

Base Route: `/api/v1/address`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/add` | Authenticated | Save new shipping address |
| `GET` | `/my-addresses` | Authenticated | Get all saved addresses for user |
| `PUT` | `/update/:id` | Authenticated | Edit existing address |
| `DELETE` | `/delete/:id` | Authenticated | Delete address |
| `PUT` | `/set-default/:id` | Authenticated | Mark address as default shipping address |

---

## 7. Shopping Cart

Base Route: `/api/v1/cart`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Get current cart with calculated subtotal, tax, discounts, total |
| `POST` | `/add` | Authenticated | Add product or increment item quantity |
| `PUT` | `/update-quantity` | Authenticated | Update quantity of a specific cart item |
| `DELETE` | `/item/:itemId` | Authenticated | Remove an individual item from cart |
| `DELETE` | `/clear` | Authenticated | Empty entire shopping cart |
| `POST` | `/merge` | Authenticated | Sync guest local-storage cart upon login |

---

## 8. Wishlist

Base Route: `/api/v1/wishlist`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/` | Authenticated | Get user's saved wishlist items |
| `POST` | `/toggle` | Authenticated | Add if absent, remove if already present in wishlist |
| `POST` | `/move-to-cart/:productId` | Authenticated | Move item from wishlist directly into cart |

---

## 9. Coupons & Promotional Discounts

Base Route: `/api/v1/coupon`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/apply` | Authenticated | Validate & apply coupon code to shopping cart |
| `POST` | `/remove` | Authenticated | Remove applied coupon from shopping cart |
| `POST` | `/create` | Admin | Create coupon (percentage/fixed, min purchase, expiry) |
| `GET` | `/all` | Admin | View all coupon campaigns and redemption statistics |
| `DELETE` | `/delete/:id` | Admin | Revoke/delete coupon |

---

## 10. Payments & Razorpay Integration

Base Route: `/api/v1/payment`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/razorpay-key` | Public | Retrieve public Razorpay Key ID for client checkout |
| `POST` | `/razorpay-order` | Authenticated | Create official Razorpay Order ID for cart amount |
| `POST` | `/verify` | Authenticated | Verify Razorpay HMAC-SHA256 signature after payment |
| `POST` | `/webhook` | Public | Server-to-server webhook endpoint for async capture events |

---

## 11. Orders & Fulfillment

Base Route: `/api/v1/ecommerce/order`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/create` | Authenticated | Place order (Cash on Delivery or verified Razorpay payment) |
| `GET` | `/my-orders` | Authenticated | View customer's order history and delivery statuses |
| `GET` | `/single/:id` | Authenticated | Full order details with line items, address, and timeline |
| `PUT` | `/cancel/:id` | Authenticated | Cancel pending or processing order |
| `GET` | `/admin/all` | Admin | Order fulfillment dashboard with status filters & pagination |
| `PUT` | `/admin/status/:id` | Admin | Update delivery status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) |

---

## 12. Product Reviews & Ratings

Base Route: `/api/v1/product-reviews`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/product/:productId` | Public | Get reviews, average rating, and breakdown for a product |
| `POST` | `/add` | Authenticated | Post a review with star rating (1-5), title, and feedback |
| `PUT` | `/helpful/:id` | Authenticated | Upvote helpful review |
| `DELETE` | `/delete/:id` | Authenticated | Delete review (author or admin) |

---

## 13. Admin Analytics & Dynamic Layout

- **Analytics** (`/api/v1/analytics`):
  - `GET /users-analytics`: 12-month rolling user registration velocity.
  - `GET /courses-analytics`: Course creation and enrollment statistics.
  - `GET /orders-analytics`: Revenue trends, order volume, and completion rates.
- **Dynamic Layout** (`/api/v1/layout`):
  - `GET /get-layout?type=Banner|FAQ|Categories`: Public endpoint powering dynamic homepage hero, FAQ accordion, and course categories.
  - `POST /create-layout`: Admin endpoint to publish banners and FAQs.
  - `PUT /edit-layout`: Admin endpoint to update homepage layout configs.

---

## 14. HTTP Status Codes & Error Handling

All error responses adhere to standard JSON error format:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

- **`200 OK`**: Request succeeded.
- **`201 Created`**: Resource created successfully.
- **`400 Bad Request`**: Validation failed or missing parameters.
- **`401 Unauthorized`**: Authentication missing or invalid token.
- **`403 Forbidden`**: Access restricted to specific roles (e.g. Admin only).
- **`404 Not Found`**: Target resource does not exist.
- **`500 Internal Server Error`**: Unexpected server-side failure.
- **`503 Service Unavailable`**: Database disconnected or external gateway downtime.
