# New Endpoints Guide

## Payment Flow

### 1. Create Payment
**Endpoint:** `POST /api/v1/lms/payments/create`
**Auth:** Required
**Body:** `{ "courseId": "...", "couponCode": "..." }`

**Flow:**
1. Validates course exists and is PUBLISHED
2. Checks user not already enrolled
3. Applies coupon discount if valid
4. Creates Stripe PaymentIntent
5. Returns `clientSecret` for frontend Stripe.js

**Response:**
```json
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx",
  "amount": 499,
  "currency": "inr",
  "course": { "_id": "...", "name": "...", "price": 499, "discount": 0 }
}
```

### 2. Verify Payment
**Endpoint:** `POST /api/v1/lms/payments/verify`
**Auth:** Required
**Body:** `{ "paymentIntentId": "...", "courseId": "..." }`

**Flow:**
1. Retrieves PaymentIntent from Stripe
2. Checks status is `succeeded`
3. Validates metadata userId matches
4. Creates Order document
5. Creates Enrollment
6. Increments course purchased count
7. Sends notification

**Response:**
```json
{
  "success": true,
  "message": "Payment verified. Enrollment confirmed. Go to Course.",
  "order": { ... },
  "enrollment": { ... }
}
```

### 3. Stripe Webhook
**Endpoint:** `POST /api/v1/lms/payments/webhook`
**Auth:** Stripe signature

**Flow:**
1. Verifies webhook signature
2. On `payment_intent.succeeded`:
   - Checks for duplicate order
   - Creates order + enrollment
   - Sends notification

### 4. Refund Payment
**Endpoint:** `POST /api/v1/lms/payments/refund`
**Auth:** Required (owner or admin)
**Body:** `{ "orderId": "..." }`

**Flow:**
1. Validates order exists and belongs to user
2. Checks not already refunded
3. Creates Stripe refund
4. Updates order status to `refunded`
5. Removes enrollment
6. Decrements course purchased count

---

## Category Management

### 5. Create Category
**Endpoint:** `POST /api/v1/lms/categories`
**Auth:** Admin
**Body:** `{ "name": "Web Development", "description": "..." }`

### 6. List Categories
**Endpoint:** `GET /api/v1/lms/categories`
**Auth:** Public
**Returns:** Active categories only

### 7. List All Categories
**Endpoint:** `GET /api/v1/lms/categories/all`
**Auth:** Admin
**Returns:** All categories including inactive

### 8. Update Category
**Endpoint:** `PUT /api/v1/lms/categories/:categoryId`
**Auth:** Admin
**Body:** `{ "name": "...", "description": "...", "isActive": true }`

### 9. Delete Category
**Endpoint:** `DELETE /api/v1/lms/categories/:categoryId`
**Auth:** Admin

---

## User Progress Analytics

### 10. Progress Analytics
**Endpoint:** `GET /api/v1/lms/progress-analytics`
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "totalEnrollments": 5,
  "completedCount": 2,
  "inProgressCount": 3,
  "avgProgress": 65,
  "lastActivity": "2026-10-05T10:30:00Z",
  "progress": [
    {
      "courseId": "...",
      "course": { "name": "...", "thumbnail": "..." },
      "progress": 100,
      "completed": true,
      "completedAt": "2026-10-01T00:00:00Z",
      "lastAccessedAt": "2026-10-01T00:00:00Z"
    }
  ]
}
```

---

## Course Clone

### 11. Clone Course
**Endpoint:** `POST /api/v1/lms/courses/clone`
**Auth:** Admin
**Body:** `{ "courseId": "..." }`

**Flow:**
1. Finds source course
2. Creates copy with `(Copy)` suffix
3. Sets status to `DRAFT`
4. Copies all lectures, metadata

---

## Password Reset

### 12. Forgot Password
**Endpoint:** `POST /api/v1/auth/forgot-password`
**Auth:** Public
**Body:** `{ "email": "..." }`

**Flow:**
1. Finds user by email
2. Generates JWT token (10min expiry)
3. Sends reset link via email
4. Returns token (for dev/testing)

### 13. Reset Password
**Endpoint:** `POST /api/v1/auth/reset-password`
**Auth:** Public
**Body:** `{ "token": "...", "newPassword": "..." }`

**Flow:**
1. Verifies JWT token
2. Finds user by token id
3. Updates password
4. Clears Redis cache

---

## Two-Factor Authentication

### 14. Setup 2FA
**Endpoint:** `POST /api/v1/auth/2fa/setup`
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "secret": "abc123...",
  "otpauthUrl": "otpauth://totp/LMS:email@example.com?secret=abc123&issuer=LMS"
}
```

**Flow:**
1. Generates random secret
2. Stores on user document
3. Returns otpauth URL for QR code

### 15. Verify 2FA
**Endpoint:** `POST /api/v1/auth/2fa/verify`
**Auth:** Required
**Body:** `{ "token": "123456" }`

**Flow:**
1. Computes expected TOTP (current + previous 30s window)
2. Compares with provided token
3. Enables 2FA on success

### 16. Disable 2FA
**Endpoint:** `POST /api/v1/auth/2fa/disable`
**Auth:** Required
**Body:** `{ "token": "123456" }`

**Flow:**
1. Verifies current TOTP
2. Disables 2FA
3. Removes secret

---

## Certificate Download

### 17. Download Certificate PDF
**Endpoint:** `GET /api/v1/lms/certificates/:certificateId/download`
**Auth:** Required (owner or admin)

**Response:** PDF file download

**Flow:**
1. Validates certificate exists
2. Checks ownership
3. Generates PDF with course name, student name, date
4. Streams PDF to client

---

## Bulk Operations

### 18. Bulk Course Operations
**Endpoint:** `POST /api/v1/lms/courses/bulk`
**Auth:** Admin
**Body:** `{ "courseIds": ["...", "..."], "action": "delete|publish|unpublish" }`

### 19. Bulk Coupon Operations
**Endpoint:** `POST /api/v1/lms/coupons/bulk`
**Auth:** Admin
**Body:** `{ "couponIds": ["...", "..."], "action": "delete|activate|deactivate" }`

---

## Session Management

### 20. Get Sessions
**Endpoint:** `GET /api/v1/auth/sessions`
**Auth:** Required

**Response:**
```json
{
  "success": true,
  "sessions": [
    { "sessionId": "...", "createdAt": "...", "userAgent": "..." }
  ]
}
```

### 21. Revoke Session
**Endpoint:** `DELETE /api/v1/auth/sessions`
**Auth:** Required
**Body:** `{ "sessionId": "..." }`

### 22. Revoke All Sessions
**Endpoint:** `DELETE /api/v1/auth/sessions/all`
**Auth:** Required

---

## Cart & Wishlist

### 23. Get Cart
**Endpoint:** `GET /api/v1/lms/cart`
**Auth:** Required

### 24. Add to Cart
**Endpoint:** `POST /api/v1/lms/cart`
**Auth:** Required
**Body:** `{ "courseId": "..." }`

### 25. Remove from Cart
**Endpoint:** `DELETE /api/v1/lms/cart`
**Auth:** Required
**Body:** `{ "courseId": "..." }`

### 26. Clear Cart
**Endpoint:** `DELETE /api/v1/lms/cart/all`
**Auth:** Required

### 27. Move Wishlist to Cart
**Endpoint:** `POST /api/v1/lms/wishlist/move-to-cart`
**Auth:** Required

**Flow:**
1. Gets all wishlist items
2. Adds each to cart (skip duplicates)
3. Clears wishlist
4. Returns count moved

---

## Enrollment Export

### 28. Export Enrollments CSV
**Endpoint:** `GET /api/v1/lms/admin/enrollments/export`
**Auth:** Admin

**Response:** CSV file with columns:
- Enrollment ID
- Student Name
- Student Email
- Course
- Progress
- Completed
- Enrolled At
- Completed At
