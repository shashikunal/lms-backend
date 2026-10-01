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

**Module C — LMS Marketplace Discovery**
- C1. `GET /api/v1/lms/courses` (public, filters)
- C2. `GET /api/v1/lms/categories` (public)
- C3. `GET /api/v1/lms/search?q=` (public)
- C4. `GET /api/v1/lms/home` (public)
- C5. `GET /api/v1/lms/courses/:courseId` (public)
- C6. `GET /api/v1/lms/courses/:courseId/curriculum` (public)
- C7. `GET /api/v1/lms/courses/:courseId/sections` + `/lms/sections/:sectionId[/lectures]` (public)

**Module D — Lectures, Progress & Certificates**
- D1. `GET /api/v1/lms/lectures/:lectureId` (auth; preview open)
- D2. `GET /api/v1/lms/lectures/:lectureId/access` (auth)
- D3. `POST /api/v1/lms/lectures/:lectureId/progress` (enrolled)
- D4. `POST /api/v1/lms/lectures/:lectureId/complete` (enrolled → certificate at 100%)

**Module E — Digital Purchase & Enrollments**
- E1. `POST /api/v1/lms/payments/create` (auth)
- E2. `POST /api/v1/lms/payments/verify` (auth → 201 enrollment)
- E3. `GET /api/v1/lms/purchases` + `GET /api/v1/lms/orders[/:orderId]` (auth)

**Module F — My Learning**
- F1. `GET /api/v1/lms/my-learning` (auth)
- F2. `GET /api/v1/lms/enrollments[/:enrollmentId]` (auth)
- F3. `GET /api/v1/lms/certificates[/:certificateId]` (auth)

**Module G — Wishlist (courses)**
- G1. `GET /api/v1/lms/wishlist` (auth)
- G2. `POST /api/v1/lms/wishlist` + `/wishlist/toggle` (auth)

**Module H — Coupons (courses)**
- H1. `POST /api/v1/lms/coupons` (admin)
- H2. `GET /api/v1/lms/coupons` (admin)
- H3. `POST /api/v1/lms/coupons/validate` (auth)

**Module I — Reviews (courses)**
- I1. `GET /api/v1/lms/reviews/:courseId` (public, alias `/lms/courses/:courseId/reviews`)
- I2. `POST /api/v1/lms/reviews/:courseId` (enrolled)

**Module J — Instructor Marketplace**
- J1. `GET /api/v1/lms/instructor/courses` (instructor/admin)
- J2. `POST /api/v1/lms/instructor/courses` (DRAFT)
- J3. `PUT /api/v1/lms/instructor/courses/:courseId`
- J4. `POST /api/v1/lms/instructor/courses/:courseId/lectures`
- J5. `POST /api/v1/lms/instructor/courses/:courseId/submit`
- J6. `GET /api/v1/lms/instructor/students|revenue|analytics`

**Module K — Admin Marketplace**
- K1. `GET /api/v1/lms/admin/courses` (admin)
- K2. `PUT /api/v1/lms/admin/courses/:courseId/status` (admin)
- K3. `GET /api/v1/lms/admin/instructors|orders|enrollments|analytics` (admin)

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

Base routes: `/api/v1/course` and `/api/v1/order` (course enrollment; physical shop orders were removed — see Module E).

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

# Module C — LMS Marketplace Discovery

> Base: `/api/v1/lms`. All discovery routes are public. Only `PUBLISHED` courses appear.

## C1. List courses — `GET /api/v1/lms/courses` (Public)

Query: `page` (default 1), `limit` (default 12, max 50), `category`, `level`, `search`.

```http
GET /api/v1/lms/courses?page=1&limit=12&category=Programming
→ 200 { success, total, page, limit, courses }
```

## C2. Categories — `GET /api/v1/lms/categories` (Public)

Aggregated from published courses: `[ { title, count } ]`.

## C3. Search — `GET /api/v1/lms/search?q=` (Public)

```http
GET /api/v1/lms/search?q=react
→ 200 { success, courses }
```

## C4. Home — `GET /api/v1/lms/home` (Public)

Returns `{ featured, topRated, newest }` (6 each).

## C5. Detail — `GET /api/v1/lms/courses/:courseId` (Public)

Locked lecture video URLs are stripped. Unknown/unpublished id → `404`.

## C6. Curriculum — `GET /api/v1/lms/courses/:courseId/curriculum` (Public)

Each lecture carries `locked: true/false` (locked unless enrolled). Enrolled users receive `videoUrl`.

## C7. Sections — `GET /api/v1/lms/courses/:courseId/sections` (Public)

Grouped by `videoSection`. Also: `GET /api/v1/lms/sections/:sectionId` and `GET /api/v1/lms/sections/:sectionId/lectures`, where `:sectionId` is a lecture `_id` or a section title. Unknown → `404`.

---

# Module D — Lectures, Progress & Certificates

> Login required. Locked lectures need enrollment (`403` otherwise); preview lectures are open.

## D1. Lecture — `GET /api/v1/lms/lectures/:lectureId` (Auth)

```http
GET /api/v1/lms/lectures/<lectureId>
Authorization: Bearer <token>
→ 200 { success, lecture } | 403 { "Enroll in this course…" } | 404 lecture not found
```

## D2. Access check — `GET /api/v1/lms/lectures/:lectureId/access` (Auth)

```http
GET /api/v1/lms/lectures/<lectureId>/access
→ 200 { success, hasAccess: true/false }
```

## D3. Save progress — `POST /api/v1/lms/lectures/:lectureId/progress` (Enrolled)

```http
POST /api/v1/lms/lectures/<lectureId>/progress
{ "watchedSeconds": 120 }
→ 200 { success, progress }
```

## D4. Complete — `POST /api/v1/lms/lectures/:lectureId/complete` (Enrolled)

No body. Updates enrollment `progress`; at 100% the enrollment completes and a certificate is auto-issued.

```http
POST /api/v1/lms/lectures/<lectureId>/complete
→ 200 { success, enrollment: { progress: 100, completed: true, … } }
```

---

# Module E — Digital Purchase & Enrollments

> No address, quantity, or cart. Flow: detail → Buy Now → `payments/create` → pay → `payments/verify` → order → enrollment → Go to Course.

## E1. Create payment — `POST /api/v1/lms/payments/create` (Auth)

```http
POST /api/v1/lms/payments/create
{ "courseId": "<courseId>", "couponCode": "WELCOME10" }
→ 200 { success, order: { id }, amount, currency: "INR", course }
```

Already enrolled → `400`. Unpublished course → `404`.

## E2. Verify & enroll — `POST /api/v1/lms/payments/verify` (Auth)

```http
POST /api/v1/lms/payments/verify
{ "razorpay_order_id": "...", "razorpay_payment_id": "...",
  "razorpay_signature": "...", "courseId": "<courseId>" }
→ 201 { success, message: "Payment verified. Enrollment confirmed. Go to Course.", order, enrollment }
```

Bad signature → `400`. Dev note: with placeholder Razorpay keys the create step returns a mock order id; verification is still HMAC-checked with `RAZORPAY_KEY_SECRET`.

## E3. History — `GET /api/v1/lms/purchases` + `GET /api/v1/lms/orders[/:orderId]` (Auth)

```http
GET /api/v1/lms/purchases
GET /api/v1/lms/orders/<orderId>   (owner or admin; else 403)
```

---

# Module F — My Learning

> Primary dashboard; orders are history only.

## F1. Dashboard — `GET /api/v1/lms/my-learning` (Auth)

```http
GET /api/v1/lms/my-learning
→ 200 { success, continueLearning, inProgress, completed, wishlist, certificates }
```

## F2. Enrollments — `GET /api/v1/lms/enrollments[/:enrollmentId]` (Auth)

Owner or admin (else `403`).

## F3. Certificates — `GET /api/v1/lms/certificates[/:certificateId]` (Auth)

Issued automatically at 100% completion.

---

# Module G — Wishlist (courses)

## G1. View — `GET /api/v1/lms/wishlist` (Auth)

## G2. Toggle — `POST /api/v1/lms/wishlist` (Auth, alias `/lms/wishlist/toggle`)

```http
POST /api/v1/lms/wishlist
{ "courseId": "<courseId>" }
→ 200 { success, wishlisted: true/false, wishlist }
```

---

# Module H — Coupons (courses)

## H1. Create — `POST /api/v1/lms/coupons` (Admin)

```http
POST /api/v1/lms/coupons
{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10,
  "maxDiscount": 200, "minPurchaseAmount": 0, "courseId?": "...",
  "usageLimit?": 100, "endDate": "2027-01-01T00:00:00Z" }
→ 201 { success, coupon }
```

`discountType` is `percentage` or `fixed`.

## H2. List — `GET /api/v1/lms/coupons` (Admin)

## H3. Validate — `POST /api/v1/lms/coupons/validate` (Auth)

```http
POST /api/v1/lms/coupons/validate
{ "code": "WELCOME10", "courseId": "<courseId>" }
→ 200 { success, discount, payable } | 400 invalid/expired/used-up/wrong-course
```

---

# Module I — Reviews (courses)

## I1. List — `GET /api/v1/lms/reviews/:courseId` (Public)

Alias: `GET /api/v1/lms/courses/:courseId/reviews`.

## I2. Add — `POST /api/v1/lms/reviews/:courseId` (Enrolled)

```http
POST /api/v1/lms/reviews/<courseId>
{ "rating": 5, "comment": "Excellent!" }
→ 201 { success, reviews } | 403 enroll first
```

---

# Module J — Instructor Marketplace

> Roles: `instructor` or `admin` (students get `403`). Lifecycle: `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `PUBLISHED` → `UNPUBLISHED` / `ARCHIVED`.

## J1. My courses — `GET /api/v1/lms/instructor/courses`

## J2. Create — `POST /api/v1/lms/instructor/courses`

Created as `DRAFT` with `instructor: { id, name }` from the token.

```http
POST /api/v1/lms/instructor/courses
{ "name": "My Course", "description": "...", "price": 499, "tags": "js",
  "level": "Beginner", "demoUrl": "https://...", "category": "Programming",
  "courseData": [{ "title": "L1", "videoSection": "Basics", "videoLength": 10, "isPreview": true }] }
→ 201 { success, course }
```

## J3. Edit — `PUT /api/v1/lms/instructor/courses/:courseId`

Own course only (others → `403`). Published courses: non-admin edits ignore `status`.

## J4. Add lecture — `POST /api/v1/lms/instructor/courses/:courseId/lectures`

```http
{ "title": "Lesson 2", "description": "...", "videoUrl": "https://...",
  "videoSection": "Basics", "videoLength": 12, "isPreview": false }
→ 201 { success, courseData }
```

## J5. Submit — `POST /api/v1/lms/instructor/courses/:courseId/submit`

Status → `SUBMITTED`. Admin publishes via `PUT /api/v1/lms/admin/courses/:courseId/status`.

## J6. Students / revenue / analytics

```http
GET /api/v1/lms/instructor/students
GET /api/v1/lms/instructor/revenue    → { totalRevenue, totalEnrollments, byCourse }
GET /api/v1/lms/instructor/analytics  → { totalCourses, totalEnrollments, totalCompletions, courses }
```

---

# Module K — Admin Marketplace

## K1. Courses — `GET /api/v1/lms/admin/courses` (Admin)

All courses including drafts.

## K2. Lifecycle — `PUT /api/v1/lms/admin/courses/:courseId/status` (Admin)

```http
PUT /api/v1/lms/admin/courses/<courseId>/status
{ "status": "PUBLISHED" }
→ 200 { success, course } | 400 invalid status
```

Allowed: `DRAFT, SUBMITTED, UNDER_REVIEW, PUBLISHED, UNPUBLISHED, ARCHIVED`.

## K3. Instructors / orders / enrollments / analytics (Admin)

```http
GET /api/v1/lms/admin/instructors
GET /api/v1/lms/admin/orders
GET /api/v1/lms/admin/enrollments
GET /api/v1/lms/admin/analytics   → { users, courses, orders, enrollments, certificates }
```

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

# Module M — Full LMS example end-to-end

```
# 1. Student: register → activate → login
POST /api/v1/auth/register           { name, email, password } → 201 + code
POST /api/v1/auth/activate-user      { activation_token, activation_code }
POST /api/v1/auth/login              { email, password } → Bearer token

# 2. Instructor: create → curriculum → submit (promote to instructor first)
POST /api/v1/lms/instructor/courses  { name, description, price, tags, level, demoUrl }
POST /api/v1/lms/instructor/courses/<id>/lectures  { title, videoSection, isPreview: true }
POST /api/v1/lms/instructor/courses/<id>/submit

# 3. Admin: publish + coupon
PUT  /api/v1/lms/admin/courses/<id>/status   { status: "PUBLISHED" }
POST /api/v1/lms/coupons  { code, discountType, discountValue, endDate }

# 4. Student: discover → buy → learn → certificate → review
GET  /api/v1/lms/courses
POST /api/v1/lms/payments/create     { courseId, couponCode? }
POST /api/v1/lms/payments/verify     { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId }
GET  /api/v1/lms/my-learning
GET  /api/v1/lms/lectures/<lectureId>
POST /api/v1/lms/lectures/<lectureId>/complete   (× every lecture → certificate)
GET  /api/v1/lms/certificates
POST /api/v1/lms/reviews/<courseId>  { rating: 5, comment }
```
