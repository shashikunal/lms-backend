# Module-Wise Full Documentation — Auth & Courses (LMS)

> Companion to [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) (all-module overview) and [`FRONTEND_POSTMAN_GUIDE.md`](./FRONTEND_POSTMAN_GUIDE.md) (Postman + React setup).
> **Base URL:** `http://localhost:8000` (local) · `https://mockapi-mauve.vercel.app` (production)
> Every endpoint below shows: **purpose → who can call → Postman steps → request fields → example request → success response → errors → React snippet**.

---

## Table of Contents

**Module A — Authentication & Users**
- A1. `POST /api/v1/auth/register`
- A2. `POST /api/v1/auth/activate-user`
- A3. `POST /api/v1/auth/login`
- A4. `GET /api/v1/auth/me`
- A5. `GET /api/v1/auth/logout`
- A6. `GET /api/v1/auth/refreshtoken`
- A7. `POST /api/v1/auth/social-auth`
- A8. `PUT /api/v1/auth/update-user-info`
- A9. `PUT /api/v1/auth/update-user-password`
- A10. `PUT /api/v1/auth/update-user-profile-picture`
- A11. `GET /api/v1/auth/get-all-user-dashboard` (admin)
- A12. `PUT /api/v1/auth/update-user-roles` (admin)
- A13. `DELETE /api/v1/auth/delete-user/:id` (admin)
- A14. Full auth example end-to-end (Postman + React)

**Module B — Courses (LMS) + Course Orders**
- B1. `GET /api/v1/course/get-courses`
- B2. `GET /api/v1/course/get-course/:id`
- B3. `POST /api/v1/course/create-course` (admin)
- B4. `PUT /api/v1/course/edit-course/:id` (admin)
- B5. `GET /api/v1/course/get-all-course-dashboard` (admin)
- B6. `DELETE /api/v1/course/delete-course/:id` (admin)
- B7. `POST /api/v1/order/create-order` (enroll)
- B8. `GET /api/v1/order/get-all-order-dashboard` (admin)
- B9. `GET /api/v1/course/get-course-content/:id` (enrolled)
- B10. `PUT /api/v1/course/add-question`
- B11. `PUT /api/v1/course/add-answer`
- B12. `PUT /api/v1/course/add-review/:id`
- B13. `PUT /api/v1/course/add-replay` (admin)
- B14. Full course example end-to-end (admin creates → user enrolls → Q&A → review)

**Module C — Categories & Brands**
- C1. `GET /api/v1/category/all`
- C2. `GET /api/v1/category/single/:idOrSlug`
- C3. `POST /api/v1/category/create` (admin)
- C4. `PUT /api/v1/category/update/:id` (admin)
- C5. `DELETE /api/v1/category/delete/:id` (admin)
- C6. `POST /api/v1/category/brand/create` (admin)
- C7. `GET /api/v1/category/brands/all`

**Module D — Products**
- D1. `GET /api/v1/product/all` (search/filter/sort/paginate)
- D2. `GET /api/v1/product/featured`
- D3. `GET /api/v1/product/single/:idOrSlug`
- D4. `GET /api/v1/product/related/:id`
- D5. `POST /api/v1/product/create` (admin)
- D6. `PUT /api/v1/product/update/:id` (admin)
- D7. `DELETE /api/v1/product/delete/:id` (admin)

**Module E — Address Book**
- E1. `POST /api/v1/address/add`
- E2. `GET /api/v1/address/my-addresses`
- E3. `PUT /api/v1/address/update/:id`
- E4. `DELETE /api/v1/address/delete/:id`
- E5. `PUT /api/v1/address/set-default/:id`

**Module F — Shopping Cart**
- F1. `GET /api/v1/cart/`
- F2. `POST /api/v1/cart/add`
- F3. `PUT /api/v1/cart/update-quantity`
- F4. `DELETE /api/v1/cart/item/:itemId`
- F5. `DELETE /api/v1/cart/clear`
- F6. `POST /api/v1/cart/merge`

**Module G — Wishlist**
- G1. `GET /api/v1/wishlist/`
- G2. `POST /api/v1/wishlist/toggle`
- G3. `POST /api/v1/wishlist/move-to-cart/:productId`

**Module H — Coupons**
- H1. `POST /api/v1/coupon/create` (admin)
- H2. `GET /api/v1/coupon/all` (admin)
- H3. `POST /api/v1/coupon/apply`
- H4. `POST /api/v1/coupon/remove`
- H5. `DELETE /api/v1/coupon/delete/:id` (admin)

**Module I — Payments (Razorpay)**
- I1. `GET /api/v1/payment/razorpay-key`
- I2. `POST /api/v1/payment/razorpay-order`
- I3. `POST /api/v1/payment/verify`
- I4. `POST /api/v1/payment/webhook`
- I5. `POST /api/v1/payment/refund` (admin)

**Module J — E-Commerce Orders**
- J1. `POST /api/v1/ecommerce/order/create`
- J2. `GET /api/v1/ecommerce/order/my-orders`
- J3. `GET /api/v1/ecommerce/order/single/:id`
- J4. `PUT /api/v1/ecommerce/order/cancel/:id`
- J5. `GET /api/v1/ecommerce/order/admin/all` (admin)
- J6. `PUT /api/v1/ecommerce/order/admin/status/:id` (admin)

**Module K — Product Reviews**
- K1. `GET /api/v1/product-reviews/product/:productId`
- K2. `POST /api/v1/product-reviews/add`
- K3. `PUT /api/v1/product-reviews/helpful/:id`
- K4. `DELETE /api/v1/product-reviews/delete/:id`

**Module L — Notifications, Analytics, Layout**
- L1. `GET /api/v1/notifications/get-all-notification` (admin)
- L2. `PUT /api/v1/notifications/update-notification-status/:id` (admin)
- L3–L5. Analytics `users` / `courses` / `orders` (admin)
- L6. `GET /api/v1/layout/get-layout`
- L7. `POST /api/v1/layout/create-layout` + `PUT /api/v1/layout/update-layout` (admin)

**Module M — Full shop example end-to-end**

---

# Module A — Authentication & Users

Base route: `/api/v1/auth`. Auth rule: public routes need nothing; **Auth** routes need `Authorization: Bearer <access_token>`; **Admin** routes need a token whose user has `role: "admin"`.

## A1. Register — `POST /api/v1/auth/register` (Public)

**Purpose:** creates a *pending* account and emails a 6-digit activation code. Nothing is saved to the users collection yet.

**Postman:** method POST → `{{baseUrl}}/api/v1/auth/register` → Body → raw JSON.

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Any display name |
| `email` | Yes | Must be unique; duplicate → `400 Email already exists` |
| `password` | Yes | Stored hashed (bcrypt) after activation |

```http
POST /api/v1/auth/register
Content-Type: application/json

{ "name": "Test Student", "email": "student@example.com", "password": "Pass@123" }
```

**Success `201` — SAVE `activationToken` + `activationCode`:**

```json
{
  "success": true,
  "message": "Please check your student@example.com address to activate your account!",
  "activationToken": "eyJhbGciOi...",
  "activationCode": "417775",
  "mailUrl": "https://ethereal.email/messages"
}
```

**Errors:** `400 Email already exists` (register with another email) · `400` mail failure (SMTP misconfigured).

```jsx
// React
const { data } = await api.post("/auth/register", { name, email, password });
// data.activationToken + data.activationCode → go to /activate screen
```

## A2. Activate — `POST /api/v1/auth/activate-user` (Public)

**Purpose:** verifies the code + token from A1 and creates the real user. Code is 6 digits, token expires in **5 minutes**.

**Postman:** POST → `{{baseUrl}}/api/v1/auth/activate-user` → raw JSON. Field names use **snake_case** (common mistake!).

| Field | Required | Notes |
|---|---|---|
| `activation_token` | Yes | Exact `activationToken` from A1 (not the code) |
| `activation_code` | Yes | Exact 6-digit `activationCode` from A1 |

```http
POST /api/v1/auth/activate-user
Content-Type: application/json

{ "activation_token": "eyJhbGciOi...", "activation_code": "417775" }
```

**Success `201`:** `{ "success": true, "message": "User activated successfully" }` → now login.

**Errors:** `400 Invalid activation code` (wrong code) · `500` jwt expired (older than 5 min → register again for a fresh code).

```jsx
await api.post("/auth/activate-user", {
  activation_token: activationToken,
  activation_code: activationCode,
});
```

## A3. Login — `POST /api/v1/auth/login` (Public)

**Purpose:** validates credentials, returns `accessToken` JSON **and** sets `access_token` + `refresh_token` HTTP-only cookies.

| Field | Required |
|---|---|
| `email` | Yes |
| `password` | Yes |

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "student@example.com", "password": "Pass@123" }
```

**Success `200`:**

```json
{
  "success": true,
  "accessToken": "eyJhbGciOi...",
  "user": { "_id": "6abc...", "name": "Test Student", "email": "student@example.com", "role": "user", "courses": [] }
}
```

**Errors:** `401 Invalid email or password` (wrong email OR wrong password — same message on purpose).

```jsx
// React (Postman Tests-tab auto-save):
// const j = pm.response.json(); pm.environment.set("token", j.accessToken);
const { data } = await api.post("/auth/login", { email, password });
localStorage.setItem("accessToken", data.accessToken);
setUser(data.user);
navigate(data.user.role === "admin" ? "/admin" : "/shop");
```

## A4. Who am I — `GET /api/v1/auth/me` (Auth)

**Purpose:** returns the current user from the token. Use on app reload to restore sessions and to check `role`.

**Postman:** GET → `{{baseUrl}}/api/v1/auth/me` (Bearer `{{token}}` from collection auth).

**Success `200`:** `{ "success": true, "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "courses": [...] } }`

**Errors:** `401` (no/expired token → login again).

```jsx
useEffect(() => {
  const t = localStorage.getItem("accessToken");
  if (!t) return setLoading(false);
  api.get("/auth/me").then((r) => setUser(r.data.user))
    .catch(() => localStorage.removeItem("accessToken"))
    .finally(() => setLoading(false));
}, []);
```

## A5. Logout — `GET /api/v1/auth/logout` (Auth)

**Purpose:** clears both cookies server-side. Also delete the stored token client-side.

```jsx
await api.get("/auth/logout").catch(() => {});
localStorage.removeItem("accessToken");
setUser(null);
```

## A6. Refresh token — `GET /api/v1/auth/refreshtoken` (Cookie)

**Purpose:** mints a fresh access token from the `refresh_token` cookie (no body, no Bearer needed). Browser: works automatically with `withCredentials: true`. Postman: enable the cookie jar for the domain, otherwise just re-login.

**Errors:** `401/400` (refresh cookie missing/expired → login again).

## A7. Social login — `POST /api/v1/auth/social-auth` (Public)

**Purpose:** Google/GitHub login. First call **creates** the user, later calls log in. Returns the same `accessToken` + `user` shape as A3 (and sets cookies).

| Field | Required | Notes |
|---|---|---|
| `email` | Yes | Identity key |
| `name` | Yes | |
| `avatar` | No | Profile picture URL |

```http
POST /api/v1/auth/social-auth
{ "email": "me@gmail.com", "name": "Me", "avatar": "https://..." }
```

## A8. Update profile — `PUT /api/v1/auth/update-user-info` (Auth)

**Purpose:** updates your own **name**. Note: `email` is currently **ignored** by the server — only `name` is applied.

```http
PUT /api/v1/auth/update-user-info
Authorization: Bearer <user_token>
{ "name": "New Name" }
```

**Success `200`:** `{ "success": true, "message": "User updated successfully", "user": {...} }`
**Errors:** `404 User not found`.

## A9. Change password — `PUT /api/v1/auth/update-user-password` (Auth)

| Field | Required | Notes |
|---|---|---|
| `oldPassword` | Yes | Must match current password |
| `newPassword` | Yes | New password (hashed on save) |

```http
PUT /api/v1/auth/update-user-password
Authorization: Bearer <user_token>
{ "oldPassword": "Pass@123", "newPassword": "NewPass@456" }
```

**Errors:** `400 Please enter old and new password` · `401 Old password is incorrect` · `400 password not available` (social-only accounts with no password set).

## A10. Update avatar — `PUT /api/v1/auth/update-user-profile-picture` (Auth)

**Purpose:** uploads avatar to Cloudinary (`lms-avatar` folder). Real route name is `update-user-profile-picture` (not `update-user-avatar`).

```http
PUT /api/v1/auth/update-user-profile-picture
Authorization: Bearer <user_token>
{ "avatar": "<cloudinary-url-or-base64-image>" }
```

## A11. List users — `GET /api/v1/auth/get-all-user-dashboard` (Admin)

**Purpose:** all registered accounts for the admin dashboard. Alias `/api/v1/auth/get-users` works identically.

```http
GET /api/v1/auth/get-all-user-dashboard
Authorization: Bearer <admin_token>
```

**Errors:** `403` (caller is `user`, not `admin`).

## A12. Change role — `PUT /api/v1/auth/update-user-roles` (Admin)

**Purpose:** promote/demote accounts. Body uses `id` + `role` (plural `roles` in the path, singular `role` in the body — watch out).

| Field | Required | Notes |
|---|---|---|
| `id` | Yes | Target user's `_id` (find via A11 or login response) |
| `role` | Yes | `"user"` or `"admin"` only |

```http
PUT /api/v1/auth/update-user-roles
Authorization: Bearer <admin_token>
{ "id": "6abc...", "role": "admin" }
```

> After promoting, that user must **login again** to receive a token carrying the new role.

## A13. Delete user — `DELETE /api/v1/auth/delete-user/:id` (Admin)

```http
DELETE /api/v1/auth/delete-user/6abc...
Authorization: Bearer <admin_token>
```

**Success `200`:** `{ "success": true, "message": "User deleted successfully" }` · **Errors:** `404 User not found`.

## A14. Full auth example end-to-end

**Postman (do in order):** A1 register → copy `activationToken`/`activationCode` → A2 activate → A3 login (Tests tab auto-saves `token`) → A4 `/me` shows `"role": "user"` → admin promotes via A12 → login again → `/me` shows `"role": "admin"`.

**React:** register page → activate page (two inputs: token hidden field + code input) → login page → `AuthContext` (`/me` on reload, `isAdmin` flag) → `<RequireAuth>` / `<RequireAdmin>` route guards (see `FRONTEND_POSTMAN_GUIDE.md` B2–B4).

---

# Module B — Courses (LMS) + Course Orders

Base routes: `/api/v1/course` and `/api/v1/order` (course enrollment — **not** shop products; those are `/api/v1/ecommerce/order/*`).

Course object shape (what admin sends / what public reads):

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Course title |
| `description` | Yes | Full description |
| `price` | Yes | Number (e.g. `59`) |
| `estimatedPrice` | No | Strikethrough price (e.g. `129.66`) |
| `tags` | Yes | Comma string, e.g. `"react, javascript, nodejs"` |
| `level` | Yes | e.g. `"beginner"` |
| `demoUrl` | Yes | Preview video URL |
| `thumbnail` | No | Base64/URL (uploaded to Cloudinary `courses` folder) or `{ public_id, url }` |
| `benefits` | No | `[{ "title": "..." }]` |
| `prerequisites` | No | `[{ "title": "..." }]` |
| `courseData` | No | Lessons array — each: `{ title, description, videoUrl, videoSection, videoLength, links: [{title,url}], suggestion }` |

Public reads (`get-courses`, `get-course`) **exclude** `videoUrl`, `suggestion`, `questions`, `links` — only enrolled users get them via B9.

## B1. List courses — `GET /api/v1/course/get-courses` (Public)

```http
GET /api/v1/course/get-courses
```

**Success:** `201` (note: `201`, not `200`) → `{ "success": true, "courses": [ { "_id": "...", "name": "java", "price": 59, "ratings": 4.5, "purchased": 12, ... } ] }`. Save a course `_id` for the steps below.

```jsx
const { data } = await api.get("/course/get-courses");
setCourses(data.courses);
```

## B2. Single course preview — `GET /api/v1/course/get-course/:id` (Public)

```http
GET /api/v1/course/get-course/6abb50b7e98fc20a9c143ecb
```

**Success `200`:** `{ "success": true, "course": {...} }` (safe fields only — no video URLs).

## B3. Create course — `POST /api/v1/course/create-course` (Admin)

**Postman:** POST → `{{baseUrl}}/api/v1/course/create-course` → Bearer admin token → raw JSON body:

```http
POST /api/v1/course/create-course
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Full Stack Web Dev",
  "description": "Learn React, Node, Express and MongoDB from scratch.",
  "price": 59,
  "estimatedPrice": 129,
  "tags": "react, javascript, nodejs, express, mongodb",
  "level": "beginner",
  "demoUrl": "https://www.youtube.com/embed/xyz",
  "benefits": [{ "title": "Build 5 portfolio projects" }, { "title": "Learn REST APIs + auth" }],
  "prerequisites": [{ "title": "Basic HTML + JS" }],
  "courseData": [
    {
      "title": "1. React basics",
      "description": "Components, props, state",
      "videoUrl": "https://...",
      "videoSection": "Frontend",
      "videoLength": 42,
      "links": [{ "title": "Slides", "url": "https://..." }],
      "suggestion": "Practice hooks daily"
    }
  ]
}
```

**Success `201`:** `{ "success": true, "course": {...} }` → save the new course `_id`.

## B4. Edit course — `PUT /api/v1/course/edit-course/:id` (Admin)

Same body shape as B3 (partial OK — only sent fields are `$set`). To replace the thumbnail, send `thumbnail` as base64/URL (old Cloudinary image is deleted automatically).

```http
PUT /api/v1/course/edit-course/<courseId>
Authorization: Bearer <admin_token>
{ "price": 49, "level": "intermediate" }
```

**Success `201`:** `{ "success": true, "course": {...updated} }`.

## B5. Admin course list — `GET /api/v1/course/get-all-course-dashboard` (Admin)

Alias `/api/v1/course/get-admin-courses`. Returns all courses + service stats (vs B1 public list).

## B6. Delete course — `DELETE /api/v1/course/delete-course/:id` (Admin)

**Success `200`:** `{ "success": true, "message": "Course deleted successfully" }` · **Errors:** `404 Course not found`.

## B7. Enroll — `POST /api/v1/order/create-order` (Auth)

**Purpose:** buys a course: pushes it into `user.courses`, increments `course.purchased`, sends confirmation email, creates order record. Buying twice → `403 You have already purchased this course`.

| Field | Required | Notes |
|---|---|---|
| `courseId` | Yes | From B1/B3 |
| `payment_info` | No | Any object, e.g. `{ "id": "pay_123", "status": "success" }` (LMS checkout is not Razorpay-gated) |

```http
POST /api/v1/order/create-order
Authorization: Bearer <user_token>
{ "courseId": "6abb50b7e98fc20a9c143ecb", "payment_info": { "id": "pay_123", "status": "success" } }
```

**Success `201`:** order object. **Errors:** `404 Course not found` · `403 already purchased`.

```jsx
await api.post("/order/create-order", { courseId, payment_info: { id: "manual", status: "success" } });
```

## B8. All course orders — `GET /api/v1/order/get-all-order-dashboard` (Admin)

```http
GET /api/v1/order/get-all-order-dashboard
Authorization: Bearer <admin_token>
```

## B9. Full content — `GET /api/v1/course/get-course-content/:id` (Auth, enrolled or admin)

**Purpose:** returns the complete `courseData` lessons (video URLs, links, suggestions, Q&A). Non-enrolled users get `403 You are not allowed to access this course` — enroll via B7 first.

```http
GET /api/v1/course/get-course-content/6abb50b7e98fc20a9c143ecb
Authorization: Bearer <user_token>
```

**Success `200`:** `{ "success": true, "content": [ { "_id": "<contentId>", "title": "1. React basics", "videoUrl": "...", "questions": [...] } ] }` → save a lesson `_id` as `contentId` for B10.

## B10. Ask question — `PUT /api/v1/course/add-question` (Auth)

Asks under one lesson (`contentId` from B9). Creates an admin notification automatically.

| Field | Required | Notes |
|---|---|---|
| `question` | Yes | Question text |
| `courseId` | Yes | Course `_id` |
| `contentId` | Yes | Lesson `_id` (must be a valid ObjectId inside this course, else `400 Invalid content id`) |

```http
PUT /api/v1/course/add-question
Authorization: Bearer <user_token>
{ "question": "What is a closure?", "courseId": "6abb...", "contentId": "6acc..." }
```

**Success `201`:** `{ "success": true, "message": "Question added successfully" }`. The question's `_id` (`questionId`) appears when you re-fetch B9 content → needed for B11.

## B11. Answer — `PUT /api/v1/course/add-answer` (Auth)

Replies to a `questionId`. If the replier is someone else, the asker gets an email.

```http
PUT /api/v1/course/add-answer
Authorization: Bearer <user_token>
{
  "answer": "A closure is a function + its outer scope.",
  "courseId": "6abb...",
  "contentId": "6acc...",
  "questionId": "6add..."
}
```

**Success `201`:** `{ "success": true, "message": "Answer added successfully" }` · **Errors:** `400 Invalid content id` / `400 Invalid question id`.

## B12. Review — `PUT /api/v1/course/add-review/:id` (Auth, enrolled)

`:id` is the course ID in the **URL**, body carries `review` + `rating`. Ratings average is recomputed automatically.

```http
PUT /api/v1/course/add-review/6abb50b7e98fc20a9c143ecb
Authorization: Bearer <user_token>
{ "review": "Excellent explanations!", "rating": 5 }
```

**Success `200`:** `{ "success": true, "message": "Review added successfully", "course": {...} }` → each review gets `_id` (`reviewId`) for B13. **Errors:** `403` (not enrolled).

## B13. Instructor reply — `PUT /api/v1/course/add-replay` (Admin)

Route is spelled `add-replay` (not `add-reply`).

| Field | Required |
|---|---|
| `comment` | Yes |
| `courseId` | Yes |
| `reviewId` | Yes |

```http
PUT /api/v1/course/add-replay
Authorization: Bearer <admin_token>
{ "comment": "Thanks for the feedback!", "courseId": "6abb...", "reviewId": "6aee..." }
```

**Success `200`:** `{ "success": true, "message": "Replay added successfully", "course": {...} }` · **Errors:** `400 Course not found` / `400 Review not found`.

## B14. Full course example end-to-end

**Admin (Postman):** B3 create → save `courseId` (+ first lesson `contentId`) → B5 verify in dashboard.
**Student:** B1 browse → B2 preview → B7 enroll → B9 content (video URLs now visible) → B10 ask → (read `questionId` from B9) → B11 answer → B12 review (read `reviewId`) → **admin** B13 replies.
**React:** `/courses` (B1) → `/courses/:id` (B2 + enroll button B7) → `/learn/:id` (B9 lessons + Q&A B10/B11 + review form B12); admin `/admin/courses` (B3/B4/B5/B6).

---

**React:** `/courses` (B1) → `/courses/:id` (B2 + enroll button B7) → `/learn/:id` (B9 lessons + Q&A B10/B11 + review form B12); admin `/admin/courses` (B3/B4/B5/B6).

---

# Module C — Categories & Brands

Base route: `/api/v1/category`. Slugs are auto-generated from names (`"Mobile Phones"` → `"mobile-phones"`); fetching by ID **or** slug works. Public lists show only `isActive: true`.

## C1. List categories — `GET /api/v1/category/all` (Public)

Sorted by `displayOrder`, parent populated (`name`, `slug`).

**Success `200`:** `{ "success": true, "count": 2, "categories": [...] }` → save a category `_id` for products (D5).

## C2. Single category — `GET /api/v1/category/single/:idOrSlug` (Public)

24-hex-char strings are treated as Mongo IDs, anything else as slug:

```
GET /api/v1/category/single/66f0011a2b3c4d5e6f7a8b90   (by ID)
GET /api/v1/category/single/electronics                 (by slug)
```

**Errors:** `404 Category not found`.

## C3. Create category — `POST /api/v1/category/create` (Admin)

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Must be unique (slug check) → duplicate = `400 Category with this name already exists` |
| `description` | No | |
| `image` | No | Base64/URL string → uploaded to Cloudinary `ecommerce/categories` |
| `parentCategory` | No | `_id` of parent for sub-categories (e.g. `Laptops` under `Electronics`) |
| `displayOrder` | No | Number, controls C1 sort order (default `0`) |

```http
POST /api/v1/category/create
Authorization: Bearer <admin_token>
{ "name": "Electronics", "description": "Gadgets", "displayOrder": 1 }
```

**Success `201`:** `{ "success": true, "message": "Category created successfully", "category": { "_id": "...", "slug": "electronics", ... } }`.

```jsx
const { data } = await api.post("/category/create", { name, description });
```

## C4. Update category — `PUT /api/v1/category/update/:id` (Admin)

Partial update. Renaming regenerates the slug. Accepts `isActive` (hide without deleting).

```http
PUT /api/v1/category/update/<categoryId>
Authorization: Bearer <admin_token>
{ "description": "New text", "isActive": true }
```

**Success `200`:** `{ "success": true, "message": "Category updated successfully", "category": {...} }` · **Errors:** `404 Category not found`.

## C5. Delete category — `DELETE /api/v1/category/delete/:id` (Admin)

Deletes the Cloudinary image too. **Success `200`:** `{ "success": true, "message": "Category deleted successfully" }`.

## C6. Create brand — `POST /api/v1/category/brand/create` (Admin)

| Field | Required | Notes |
|---|---|---|
| `name` | Yes | Unique → duplicate = `400 Brand already exists` |
| `description` | No | |
| `logo` | No | Base64/URL → Cloudinary `ecommerce/brands` |
| `website` | No | Brand site URL |

```http
POST /api/v1/category/brand/create
Authorization: Bearer <admin_token>
{ "name": "Acme", "description": "Acme brand", "website": "https://acme.example" }
```

**Success `201`:** `{ "success": true, "message": "Brand created successfully", "brand": {...} }` → save brand `_id` for D5.

## C7. List brands — `GET /api/v1/category/brands/all` (Public)

Sorted A–Z. **Success `200`:** `{ "success": true, "count": 1, "brands": [...] }`.

---

# Module D — Products

Base route: `/api/v1/product`. Only `isPublished: true` products appear in public reads. Prices: cart/checkout always uses `discountPrice` when set, else `price`.

## D1. List / search — `GET /api/v1/product/all` (Public)

> ⚠️ The real query names are `search` and `sort=price-asc|price-desc|rating|oldest` (not `keyword` / `price_low`).

| Param | Notes |
|---|---|
| `search` | Case-insensitive match on title, description, tags |
| `category` / `brand` | Filter by `_id` |
| `minPrice` / `maxPrice` | Applied on `price` |
| `rating` | Minimum `ratings` (e.g. `rating=4`) |
| `inStock` | `true` / `false` |
| `sort` | default newest (`createdAt` desc) · `price-asc` · `price-desc` · `rating` · `oldest` |
| `page` / `limit` | Defaults `1` / `12` |

```
GET /api/v1/product/all?search=mouse&minPrice=100&maxPrice=2000&sort=price-asc&page=1&limit=12
```

**Success `200`:**

```json
{ "success": true, "totalProducts": 25, "totalPages": 3, "currentPage": 1, "count": 12, "products": [...] }
```

```jsx
const { data } = await api.get("/product/all", { params: { search, page: 1, limit: 12, sort: "price-asc" } });
```

## D2. Featured — `GET /api/v1/product/featured` (Public)

Products with `isFeatured: true` (max 8) for banners/heroes. **Success `200`:** `{ "success": true, "products": [...] }`.

## D3. Single product — `GET /api/v1/product/single/:idOrSlug` (Public)

ID or slug, category/subCategory/brand populated. **Errors:** `404 Product not found`.

## D4. Related — `GET /api/v1/product/related/:id` (Public)

Up to 6 other published products in the same category. `:id` is the product ID. **Errors:** `404` (source product not found).

## D5. Create product — `POST /api/v1/product/create` (Admin)

| Field | Required | Notes |
|---|---|---|
| `title` | Yes | Slug auto-generated (uniquified if taken) |
| `price` | Yes | Number |
| `category` | Yes | Category `_id` from C1 |
| `sku` | No | Upper-cased; auto `SKU-<timestamp>` if omitted; duplicate → `400 Product SKU already exists` |
| `discountPrice` | No | Sale price used by cart |
| `description` / `shortDescription` | No | |
| `subCategory` / `brand` | No | `_id`s |
| `images` | No | Array of base64 strings (uploaded to `ecommerce/products`) or `[{public_id,url}]` |
| `variants` | No | Array, e.g. `[{sku, price, stock}]` |
| `stockQuantity` (alias `stock`) | No | Default `0`; `inStock` auto = `> 0` |
| `lowStockThreshold` | No | Default `5` |
| `tags` | No | String array |
| `specifications` | No | Array, e.g. `[{key, value}]` |
| `isFeatured` | No | Default `false` |
| `isPublished` | No | Default `true` (`false` hides from shop but keeps for admin) |

```http
POST /api/v1/product/create
Authorization: Bearer <admin_token>

{
  "title": "Wireless Mouse",
  "price": 999,
  "discountPrice": 799,
  "category": "<categoryId>",
  "brand": "<brandId>",
  "description": "Ergonomic 2.4GHz mouse",
  "stockQuantity": 50,
  "isFeatured": true,
  "tags": ["wireless", "mouse"]
}
```

**Success `201`:** `{ "success": true, "message": "Product created successfully", "product": {...} }` → save `_id`.
**Errors:** `400 Title, price, and category are required` · `400 Product SKU already exists`.

## D6. Update product — `PUT /api/v1/product/update/:id` (Admin)

Any fields (partial OK). Extras: renaming regenerates slug; `stock` maps to `stockQuantity`; `stockQuantity` flips `inStock` automatically; `newImages: [...]` (base64 array) appends gallery images.

```http
PUT /api/v1/product/update/<productId>
Authorization: Bearer <admin_token>
{ "price": 899, "stockQuantity": 100 }
```

## D7. Delete product — `DELETE /api/v1/product/delete/:id` (Admin)

Removes Cloudinary gallery images too. **Success `200`:** `{ "success": true, "message": "Product deleted successfully" }`.

---

# Module E — Address Book

Base route: `/api/v1/address`, all routes Auth (users only ever see their own). First address is auto-made default; deleting the default promotes another.

## E1. Add — `POST /api/v1/address/add` (Auth)

| Field | Required | Notes |
|---|---|---|
| `fullName` | Yes | |
| `phone` (alias `phoneNumber`) | Yes | |
| `addressLine1` (alias `street`) | Yes | |
| `city` / `state` | Yes | |
| `postalCode` (alias `zipCode`) | Yes | |
| `alternatePhone` / `addressLine2` / `landmark` | No | |
| `country` | No | Default `"India"` |
| `addressType` | No | `home` / `work` / `other` (default `home`) |
| `isDefault` | No | `true` resets all other defaults |

```http
POST /api/v1/address/add
Authorization: Bearer <user_token>

{ "fullName": "Ravi Kumar", "phone": "9876543210",
  "addressLine1": "H.No 1-2-3, MG Road", "city": "Hyderabad",
  "state": "Telangana", "postalCode": "500001", "isDefault": true }
```

**Success `201`:** `{ "success": true, "message": "Address saved successfully", "address": { "_id": "...", ... } }` → save `_id` as `addressId` for orders (J1).
**Errors:** `400 Please provide all required address fields`.

## E2. List — `GET /api/v1/address/my-addresses` (Auth)

Default first. **Success `200`:** `{ "success": true, "count": 2, "addresses": [...] }`.

## E3. Edit — `PUT /api/v1/address/update/:id` (Auth)

Any fields; `isDefault: true` resets others. **Errors:** `404 Address not found` (also when it belongs to someone else).

## E4. Delete — `DELETE /api/v1/address/delete/:id` (Auth)

If it was default, the next address becomes default automatically.

## E5. Set default — `PUT /api/v1/address/set-default/:id` (Auth)

**Success `200`:** `{ "success": true, "message": "Default address set successfully", "address": {...} }`.

---

# Module F — Shopping Cart

Base route: `/api/v1/cart`, all routes Auth. Money math (returned as `summary` on every cart response): `subtotal` → minus coupon `discount` → +18% GST `tax` → +`shipping` (free over ₹500, else ₹50) = `grandTotal`. Item price snapshot = `discountPrice || price` at add time.

## F1. View — `GET /api/v1/cart/` (Auth)

Auto-creates an empty cart on first call. **Success `200`:** `{ "success": true, "cart": { "items": [...] }, "summary": { "subtotal": 1598, "discount": 0, "tax": 287.64, "shipping": 0, "grandTotal": 1885.64 } }`.

## F2. Add — `POST /api/v1/cart/add` (Auth)

Same product twice **increments** quantity (minus variants tracked separately via `variantSku`).

| Field | Required | Notes |
|---|---|---|
| `productId` | Yes | Must exist + `isPublished` |
| `quantity` | No | Default `1`; must be ≤ `stockQuantity` |
| `variantSku` | No | For variant products |

```http
POST /api/v1/cart/add
Authorization: Bearer <user_token>
{ "productId": "<productId>", "quantity": 2 }
```

**Success `200`:** `{ "success": true, "message": "Item added to cart", "cart": {...}, "summary": {...} }` → each item has `_id` (`itemId` for F3/F4).
**Errors:** `404 Product not found or unavailable` · `400 Only N items in stock` / `Cannot add more. Max stock is N`.

## F3. Change quantity — `PUT /api/v1/cart/update-quantity` (Auth)

Uses the cart **item ID**, not the product ID. `quantity: 0` removes the item.

```http
PUT /api/v1/cart/update-quantity
Authorization: Bearer <user_token>
{ "itemId": "<cartItemId>", "quantity": 3 }
```

**Errors:** `400 Item ID and quantity are required` · `404 Item not found in cart` · `400 Only N items in stock`.

## F4. Remove item — `DELETE /api/v1/cart/item/:itemId` (Auth)

`:itemId` = cart item `_id` from F1/F2 (a frequent student mistake is passing the product ID → item silently stays).

## F5. Clear — `DELETE /api/v1/cart/clear` (Auth)

Empties items **and** removes any applied coupon.

## F6. Merge guest cart — `POST /api/v1/cart/merge` (Auth)

After login, push the pre-login localStorage cart; quantities clamp to stock.

```http
POST /api/v1/cart/merge
Authorization: Bearer <user_token>
{ "guestItems": [{ "productId": "...", "quantity": 1 }] }
```

**Success `200`:** `{ "success": true, "message": "Cart merged successfully", ... }` · **Errors:** `400 guestItems array is required`.

```jsx
// React: on login success
const guest = JSON.parse(localStorage.getItem("guestCart") || "[]");
if (guest.length) { await api.post("/cart/merge", { guestItems: guest }); localStorage.removeItem("guestCart"); }
```

---

# Module G — Wishlist

Base route: `/api/v1/wishlist`, all routes Auth.

## G1. View — `GET /api/v1/wishlist/` (Auth)

**Success `200`:** `{ "success": true, "wishlist": { "products": [...] } }` (product preview populated).

## G2. Toggle — `POST /api/v1/wishlist/toggle` (Auth)

Adds if absent, removes if present — response tells you which happened:

```http
POST /api/v1/wishlist/toggle
Authorization: Bearer <user_token>
{ "productId": "<productId>" }
```

**Success `200`:** `{ "success": true, "message": "Product added to wishlist", "action": "added", "count": 3 }` (or `"removed"`).

## G3. Move to cart — `POST /api/v1/wishlist/move-to-cart/:productId` (Auth)

Removes from wishlist, adds (qty 1, or +1 if already in cart) at `discountPrice || price`. Needs stock. **Errors:** `400 Product is not available in stock`.

---

# Module H — Coupons

Base route: `/api/v1/coupon`, all routes Auth; create/list/delete are admin-only. Codes are stored/looked up **UPPERCASE** (`welcome10` works for `WELCOME10`). Math: `percentage` → `subtotal × value / 100` capped by `maxDiscountLimit` (and by subtotal); `fixed` → flat value capped by subtotal.

## H1. Create — `POST /api/v1/coupon/create` (Admin)

| Field | Required | Notes |
|---|---|---|
| `code` | Yes | Upper-cased; duplicate → `400 Coupon code already exists` |
| `discountType` | Yes | `"percentage"` or `"fixed"` |
| `discountValue` (alias `discountAmount`) | Yes | % or ₹ depending on type |
| `endDate` (aliases `expiryDate`, `expiresAt`) | Yes | ISO date |
| `minOrderAmount` (alias `minPurchaseAmount`) | No | Default `0` — cart subtotal must reach it |
| `maxDiscountLimit` (alias `maxDiscountAmount`) | No | Cap for percentage coupons |
| `startDate` | No | Default now |
| `usageLimit` | No | Total redemptions allowed |

```http
POST /api/v1/coupon/create
Authorization: Bearer <admin_token>

{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10,
  "minOrderAmount": 500, "maxDiscountLimit": 200,
  "startDate": "2026-01-01", "endDate": "2026-12-31", "usageLimit": 100 }
```

**Success `201`:** `{ "success": true, "message": "Coupon created successfully", "coupon": {...} }`.

## H2. List — `GET /api/v1/coupon/all` (Admin)

Newest first. **Success `200`:** `{ "success": true, "count": N, "coupons": [...] }`.

## H3. Apply — `POST /api/v1/coupon/apply` (Auth)

Validates code → active window → usage limit → non-empty cart → min order amount, then stores `couponDiscount` on the cart (visible in F1 `summary.discount`).

```http
POST /api/v1/coupon/apply
Authorization: Bearer <user_token>
{ "code": "WELCOME10" }
```

**Success `200`:** `{ "success": true, "message": "Coupon 'WELCOME10' applied! You saved ₹160", "discount": 160 }`.
**Errors:** `404 Invalid coupon code` · `400 Coupon has expired or is not yet active` · `400 Coupon usage limit reached` · `400 Your cart is empty` · `400 Minimum order amount to apply this coupon is ₹500`.

## H4. Remove — `POST /api/v1/coupon/remove` (Auth)

No body. **Success `200`:** `{ "success": true, "message": "Coupon removed successfully" }`.

## H5. Delete — `DELETE /api/v1/coupon/delete/:id` (Admin)

`:id` is the coupon `_id` from H2. **Errors:** `404 Coupon not found`.

---

# Module I — Payments (Razorpay)

Base route: `/api/v1/payment`. Amounts are in **INR** (server converts to paise for Razorpay). Without real Razorpay keys the server returns a `order_mock_...` order in non-production — full flow testable end-to-end (signature check uses your configured secret).

## I1. Public key — `GET /api/v1/payment/razorpay-key` (Public)

No auth — frontend needs this before opening Checkout. **Success `200`:** `{ "success": true, "key": "rzp_test_..." }`.

## I2. Create order — `POST /api/v1/payment/razorpay-order` (Auth)

| Field | Required | Notes |
|---|---|---|
| `amount` | No | INR. **Omit it** to charge the exact cart total (subtotal − coupon + 18% tax + shipping) — recommended |
| `receipt` | No | Your reference, default `rcpt_<timestamp>` |

```http
POST /api/v1/payment/razorpay-order
Authorization: Bearer <user_token>
{}
```

**Success `200`:** `{ "success": true, "order": { "id": "order_...", "amount": 188564, "currency": "INR", ... }, "amount": 1885.64, "currency": "INR" }` → pass `order.id` + key (I1) into Razorpay Checkout.
**Errors:** `400 Cart is empty`.

## I3. Verify — `POST /api/v1/payment/verify` (Auth)

Confirms the HMAC-SHA256 signature Checkout returned. All three fields required.

```http
POST /api/v1/payment/verify
Authorization: Bearer <user_token>

{ "razorpay_order_id": "order_...", "razorpay_payment_id": "pay_...", "razorpay_signature": "..." }
```

**Success `200`:** `{ "success": true, "message": "Payment successfully verified", "paymentId": "pay_...", "orderId": "order_..." }` → then place shop order (J1).
**Errors:** `400 Missing required payment verification parameters` · `400 Payment verification failed! Invalid signature`.

## I4. Webhook — `POST /api/v1/payment/webhook` (Public)

Called by **Razorpay servers**, not by students. Verifies `x-razorpay-signature`, marks matching shop orders paid (`payment.captured`) or failed (`payment.failed`). Always replies `{ "status": "ok" }`.

## I5. Refund — `POST /api/v1/payment/refund` (Admin)

| Field | Required | Notes |
|---|---|---|
| `paymentId` | Yes | Razorpay `pay_...` id |
| `amount` | No | Partial refund INR; omit = full |

**Success `200`:** `{ "success": true, "message": "Refund initiated successfully", "refund": {...} }`.

```jsx
// React Checkout (razorpay checkout.js loaded in index.html)
const { data: k } = await api.get("/payment/razorpay-key");
const { data: o } = await api.post("/payment/razorpay-order", {});
const rzp = new window.Razorpay({ key: k.key, amount: o.order.amount, currency: "INR",
  order_id: o.order.id, name: "My Shop",
  handler: async (r) => {
    await api.post("/payment/verify", { razorpay_order_id: r.razorpay_order_id,
      razorpay_payment_id: r.razorpay_payment_id, razorpay_signature: r.razorpay_signature });
    await api.post("/ecommerce/order/create", { addressId,
      paymentInfo: { method: "Razorpay", orderId: r.razorpay_order_id,
        id: r.razorpay_payment_id, signature: r.razorpay_signature } });
  } });
rzp.open();
```

---

# Module J — E-Commerce Orders

Base route: `/api/v1/ecommerce/order`, all routes Auth. Ordering reads the **server cart** (must be non-empty), validates stock, decrements stock, emails confirmation, notifies, then **clears the cart**. Order numbers look like `ORD-1730000000000-4821`.

Payment method strings: Razorpay-paid orders send `paymentInfo: { method: "Razorpay", orderId, id, signature }`; cash-on-delivery sends `paymentInfo: { method: "cod" }` — use **lowercase `cod`** so the Deliver step (J6) auto-marks it paid.

## J1. Place order — `POST /api/v1/ecommerce/order/create` (Auth)

Two address styles: saved `addressId` (E1) **or** inline `shippingAddress`.

```http
POST /api/v1/ecommerce/order/create
Authorization: Bearer <user_token>
{ "addressId": "<addressId>", "paymentInfo": { "method": "cod" } }
```

```http
POST /api/v1/ecommerce/order/create
Authorization: Bearer <user_token>

{
  "shippingAddress": { "fullName": "Ravi Kumar", "phone": "9876543210",
    "addressLine1": "H.No 1-2-3, MG Road", "city": "Hyderabad",
    "state": "Telangana", "postalCode": "500001", "country": "India" },
  "paymentInfo": { "method": "Razorpay", "orderId": "order_...",
    "id": "pay_...", "signature": "..." }
}
```

**Success `201`:** `{ "success": true, "message": "Order placed successfully", "order": { "orderNumber": "ORD-...", "itemsPrice": 1598, "discountPrice": 160, "taxPrice": 258.84, "shippingPrice": 0, "totalPrice": 1696.84, "orderStatus": "Processing", ... } }`.
**Errors:** `400 Shipping address is required` · `404 Selected shipping address not found` · `400 Your cart is empty` · `400 Insufficient stock for "X". Available: N`.

## J2. My orders — `GET /api/v1/ecommerce/order/my-orders` (Auth)

Newest first. **Success `200`:** `{ "success": true, "count": 2, "orders": [...] }`.

## J3. Single order — `GET /api/v1/ecommerce/order/single/:id` (Auth)

Owner or admin only. **Errors:** `404 Order not found` · `403 Access denied to this order`.

## J4. Cancel — `PUT /api/v1/ecommerce/order/cancel/:id` (Auth)

Owner or admin. Blocked once `Shipped` / `OutForDelivery` / `Delivered` (or already `Cancelled`); cancelling **restocks** inventory.

```http
PUT /api/v1/ecommerce/order/cancel/<orderId>
Authorization: Bearer <user_token>
{ "reason": "Ordered by mistake" }
```

**Success `200`:** `{ "success": true, "message": "Order cancelled and items returned to stock", "order": {...} }`.

## J5. All orders — `GET /api/v1/ecommerce/order/admin/all` (Admin)

`status` filters by **exact** `orderStatus` (omit or `all`-style listing needs no filter — note: any `status` value becomes the query, so use real statuses).

```
GET /api/v1/ecommerce/order/admin/all?status=Processing&page=1&limit=20
```

**Success `200`:** `{ "success": true, "totalOrders": 42, "totalPages": 3, "orders": [...] }` (buyer `name`/`email` populated).

## J6. Update status — `PUT /api/v1/ecommerce/order/admin/status/:id` (Admin)

Alias `/admin/update-status/:id`. `Delivered` auto-stamps `deliveredAt` and marks `cod` payments paid; `Shipped` stamps `shippedAt`; buyer gets a notification with tracking info.

```http
PUT /api/v1/ecommerce/order/admin/status/<orderId>
Authorization: Bearer <admin_token>
{ "status": "Shipped", "trackingNumber": "TRK123", "courierPartner": "Delhivery" }
```

---

# Module K — Product Reviews

Base route: `/api/v1/product-reviews`. Rules from code: **one review per user per product**; `isVerifiedPurchase` is auto-set when the user has a **Delivered** order containing the product; product `ratings`/`numOfReviews` recalculate on add **and** delete.

## K1. List — `GET /api/v1/product-reviews/product/:productId` (Public)

Verified purchases first, then most helpful. `:productId` must be a valid ObjectId.

```
GET /api/v1/product-reviews/product/<productId>?page=1&limit=10
```

**Success `200`:** `{ "success": true, "totalReviews": 4, "totalPages": 1, "reviews": [...] }` · **Errors:** `400 Invalid product ID`.

## K2. Add — `POST /api/v1/product-reviews/add` (Auth)

| Field | Required | Notes |
|---|---|---|
| `productId` | Yes | Must exist |
| `rating` | Yes | Number (1–5) |
| `comment` | Yes | Review text |
| `title` | No | Headline |
| `images` | No | Base64 array → Cloudinary `ecommerce/reviews` |

```http
POST /api/v1/product-reviews/add
Authorization: Bearer <user_token>
{ "productId": "<productId>", "rating": 5, "title": "Loved it", "comment": "Value for money" }
```

**Success `201`:** `{ "success": true, "message": "Review submitted successfully", "review": { "isVerifiedPurchase": false, ... } }`.
**Errors:** `400 Product ID, rating, and comment are required` · `404 Product not found` · `400 You have already reviewed this product`.

## K3. Helpful vote — `PUT /api/v1/product-reviews/helpful/:id` (Auth)

`:id` = review `_id`. **Success `200`:** `{ "success": true, "helpfulVotes": 6 }` · **Errors:** `404 Review not found`.

## K4. Delete — `DELETE /api/v1/product-reviews/delete/:id` (Auth)

Author **or** admin (others → `403 Unauthorized to delete this review`). Recalculates product rating.

---

# Module L — Notifications, Analytics, Layout

## L1. List notifications — `GET /api/v1/notifications/get-all-notification` (Admin)

Alias `/get-all-notifications`. Newest first — includes order, question, review events. **Success `200`:** `{ "success": true, "notifications": [...] }`.

## L2. Mark read — `PUT /api/v1/notifications/update-notification-status/:id` (Admin)

Sets `status: "read"` and returns the refreshed list. **Errors:** `404 Notification not found`. Note: `read` notifications older than 30 days are auto-deleted (except on Vercel serverless).

## L3–L5. Analytics (Admin)

12-month buckets for charts. Each has a short alias:

| Endpoint | Response key | Source |
|---|---|---|
| `GET /api/v1/analytics/get-users-analytics` (alias `/users-analytics`) | `users` | User signups |
| `GET /api/v1/analytics/get-course-analytics` (alias `/courses-analytics`) | `courses` | Course creation |
| `GET /api/v1/analytics/get-order-analytics` (alias `/orders-analytics`) | `Orders` (capital O) | **LMS course orders** (not shop orders) |

```http
GET /api/v1/analytics/orders-analytics
Authorization: Bearer <admin_token>
```

```jsx
const { data } = await api.get("/analytics/users-analytics");
// data.users → [{ month: "Jan", count: 12 }, ...] → feed your chart
```

## L6. Get layout — `GET /api/v1/layout/get-layout` (Public)

> ⚠️ `type` is **lowercase**: `banner` | `faq` | `categories` (capitalised values return `400 ... does not exist`).

```
GET /api/v1/layout/get-layout?type=faq
```

**Success `200`:** `{ "success": true, "layout": {...} }`.

## L7. Create / update layout (Admin)

One document per type (re-creating an existing type → `400 <type> already exist`; updating a missing one → `400 <type> does not exist`).

```http
POST /api/v1/layout/create-layout
Authorization: Bearer <admin_token>
{ "type": "faq", "faq": [{ "question": " refunds?", "answer": "7 days" }] }
```

Banner: `{ "type": "banner", "image": "<base64-or-url>", "title": "...", "subTitle": "..." }` (image uploaded to Cloudinary `layout`).
Categories: `{ "type": "categories", "categories": [{ "title": "Electronics" }] }`.
Update = same bodies to `PUT /api/v1/layout/update-layout`.

---

# Module M — Full shop example end-to-end

**Admin (Postman):** C3 category → C6 brand → D5 product (note `_id`, keep `isFeatured: true` for D2) → H1 coupon `WELCOME10` → H2 verify.
**Student:** D1 browse (`?search=mouse&sort=price-asc`) → D3 details → D4 related → G2 wishlist toggle → G3 move-to-cart → E1 address → F2 add ×2 → F1 check `summary` → H3 apply coupon → `summary.discount` appears → I1+I2+I3 Razorpay **or** COD → J1 order → J2 history → K2 review → J4 cancel (before ship) **or** wait for admin J6 `Shipped` → `Delivered`.
**Admin fulfilment:** J5 `?status=Processing` → J6 `Shipped` (+tracking) → J6 `Delivered` (`cod` auto-paid) → L1 notifications show the trail → L3–L5 charts.
**React pages:** `/shop` (D1) → `/product/:slug` (D3+D4+K1+K2) → `/cart` (F1–F5+H3) → `/checkout` (E2+I+J1) → `/orders` (J2+J3+J4) → `/admin/*` (C/D/H/J5+J6/L, all behind `RequireAdmin`).
