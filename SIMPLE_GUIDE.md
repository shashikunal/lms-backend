# Simple Guide — Every Endpoint, Step by Step, in Plain Words

> For students who find the other docs confusing. Read top to bottom, do what each step says.
> Other docs: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md) · [`MODULE_WISE_GUIDE.md`](./MODULE_WISE_GUIDE.md) · [`FRONTEND_POSTMAN_GUIDE.md`](./FRONTEND_POSTMAN_GUIDE.md)

---

## PART 0 — First-time Postman setup (do once, 5 minutes)

**Step 1.** Install Postman from https://www.postman.com/downloads/ and open it.
**Step 2.** Left side → **Environments** → **+** → name it `LMS API` → add two variables:
- `baseUrl` = `http://localhost:8000` (your computer) or `https://mockapi-mauve.vercel.app` (internet)
- `token` = leave empty for now
- Click **Save** (top right). Select `LMS API` in the top-right dropdown.
**Step 3.** Left side → **Collections** → **+ New Collection** → name it `LMS` → click it → **Authorization** tab → Type = **Bearer Token** → Token = `{{token}}` → **Save**.
**Step 4.** Every new request you make: put it inside the `LMS` collection, and write the URL starting with `{{baseUrl}}`, like `{{baseUrl}}/api/v1/auth/login`.
**Step 5.** For requests that send data: click **Body** → **raw** → change `Text` to **JSON** → paste the given text → click **Send**.

Words used below: **Public** = no login needed. **Login needed** = you must have done the login step (Step A3) so `{{token}}` is filled. **Admin needed** = login with an admin account.

---

## PART A — Account (do in this order)

### A1. Register (create your account) — Public

**What:** tell the server your name, email, password. It replies with a secret code.

1. New request → method **POST** → URL `{{baseUrl}}/api/v1/auth/register`
2. **Body** → raw → **JSON**, paste this (use YOUR email):
```json
{ "name": "Test Student", "email": "student@example.com", "password": "Pass@123" }
```
3. Click **Send**. You get `activationToken` (long text) and `activationCode` (6 numbers like `417775`). **Copy both** — you need them in the next step. The code dies after 5 minutes.
4. If it says `Email already exists`, use a different email.

### A2. Activate (confirm the code) — Public

1. New request → **POST** → `{{baseUrl}}/api/v1/auth/activate-user`
2. **Body** → raw → **JSON**, paste (put YOUR values from A1):
```json
{ "activation_token": "PASTE_LONG_TOKEN_HERE", "activation_code": "PASTE_6_DIGITS_HERE" }
```
3. **Send.** Good reply: `User activated successfully`. Now your account exists.
4. If it says `Invalid activation code`, you typed the code wrong. If it fails and 5 minutes passed, repeat A1 for a fresh code.

### A3. Login (get your key) — Public

1. New request → **POST** → `{{baseUrl}}/api/v1/auth/login`
2. **Body** → raw → **JSON**:
```json
{ "email": "student@example.com", "password": "Pass@123" }
```
3. **Send.** Copy the `accessToken` from the reply → paste it into your `LMS API` environment as `token` → **Save**. Now all "login needed" steps work.
4. Shortcut: in this request open the **Tests** tab and paste:
```js
const j = pm.response.json();
pm.environment.set("token", j.accessToken);
```
Now the token saves itself every login.
5. If it says `Invalid email or password`, your email or password is wrong.

### A4. See my profile — Login needed

1. New request → **GET** → `{{baseUrl}}/api/v1/auth/me` → **Send**. You see your name, email, and `role` (`user` or `admin`).

### A5. Logout — Login needed

1. New request → **GET** → `{{baseUrl}}/api/v1/auth/logout` → **Send**. Then clear your `token` variable.

### A6. Refresh key (when login expires) — needs cookies

1. New request → **GET** → `{{baseUrl}}/api/v1/auth/refreshtoken` → **Send**. Easiest alternative: just login again (A3).

### A7. Login with Google (no password) — Public

1. **POST** → `{{baseUrl}}/api/v1/auth/social-auth`, Body JSON:
```json
{ "email": "me@gmail.com", "name": "Me" }
```
2. First time = creates account, next times = logs in. Save the token like A3.

### A8. Change my name — Login needed

1. **PUT** → `{{baseUrl}}/api/v1/auth/update-user-info`, Body JSON: `{ "name": "New Name" }` → **Send**. (Only name changes; email never changes here.)

### A9. Change my password — Login needed

1. **PUT** → `{{baseUrl}}/api/v1/auth/update-user-password`, Body JSON:
```json
{ "oldPassword": "Pass@123", "newPassword": "NewPass@456" }
```

### A10. Change my photo — Login needed

1. **PUT** → `{{baseUrl}}/api/v1/auth/update-user-profile-picture`, Body JSON: `{ "avatar": "PASTE_IMAGE_LINK_HERE" }`

### A11. See all users — Admin needed

1. **GET** → `{{baseUrl}}/api/v1/auth/get-all-user-dashboard` → **Send**. If it says `Forbidden`, you are not admin (see A12).

### A12. Make someone admin — Admin needed

1. Find the person's `_id` from A11.
2. **PUT** → `{{baseUrl}}/api/v1/auth/update-user-roles`, Body JSON:
```json
{ "id": "PASTE_USER_ID_HERE", "role": "admin" }
```
3. That person must **login again** for it to work.

### A13. Delete a user — Admin needed

1. **DELETE** → `{{baseUrl}}/api/v1/auth/delete-user/PASTE_USER_ID_HERE` → **Send**.

---

## PART B — Courses (learning)

### B1. See all courses — Public

1. **GET** → `{{baseUrl}}/api/v1/course/get-courses` → **Send**. Copy one course `_id` for later.

### B2. See one course — Public

1. **GET** → `{{baseUrl}}/api/v1/course/get-course/PASTE_COURSE_ID_HERE` → **Send**. This shows preview only, no videos.

### B3. Create a course — Admin needed

1. **POST** → `{{baseUrl}}/api/v1/course/create-course`, Body JSON:
```json
{
  "name": "Full Stack Web Dev",
  "description": "Learn React, Node and MongoDB.",
  "price": 59,
  "tags": "react, javascript, nodejs",
  "level": "beginner",
  "demoUrl": "https://www.youtube.com/embed/xyz",
  "benefits": [{ "title": "Build 5 projects" }],
  "prerequisites": [{ "title": "Basic HTML" }],
  "courseData": [{ "title": "1. React basics", "description": "Components", "videoUrl": "https://...", "videoSection": "Frontend", "videoLength": 42 }]
}
```
2. **Send.** Copy the new course `_id` from the reply.

### B4. Edit a course — Admin needed

1. **PUT** → `{{baseUrl}}/api/v1/course/edit-course/PASTE_COURSE_ID_HERE`, Body JSON (only what you change): `{ "price": 49 }`

### B5. See all courses (admin view) — Admin needed

1. **GET** → `{{baseUrl}}/api/v1/course/get-all-course-dashboard` → **Send**.

### B6. Delete a course — Admin needed

1. **DELETE** → `{{baseUrl}}/api/v1/course/delete-course/PASTE_COURSE_ID_HERE` → **Send**.

### B7. Buy a course (enroll) — Login needed

1. **POST** → `{{baseUrl}}/api/v1/order/create-order`, Body JSON:
```json
{ "courseId": "PASTE_COURSE_ID_HERE", "payment_info": { "id": "pay_123", "status": "success" } }
```
2. If it says `already purchased`, you already own it — go to B9.

### B8. See all course orders — Admin needed

1. **GET** → `{{baseUrl}}/api/v1/order/get-all-order-dashboard` → **Send**.

### B9. Watch the course (full videos) — Login needed + must own it (B7)

1. **GET** → `{{baseUrl}}/api/v1/course/get-course-content/PASTE_COURSE_ID_HERE` → **Send**. You see lessons with video links. Copy one lesson `_id` (this is your `contentId`). If it says `not allowed`, buy it first (B7).

### B10. Ask a question in a lesson — Login needed

1. **PUT** → `{{baseUrl}}/api/v1/course/add-question`, Body JSON:
```json
{ "question": "What is a closure?", "courseId": "PASTE_COURSE_ID", "contentId": "PASTE_LESSON_ID" }
```

### B11. Answer a question — Login needed

1. Open B9 again, find your question, copy its `_id` (this is `questionId`).
2. **PUT** → `{{baseUrl}}/api/v1/course/add-answer`, Body JSON:
```json
{ "answer": "A function with its outer scope.", "courseId": "PASTE_COURSE_ID", "contentId": "PASTE_LESSON_ID", "questionId": "PASTE_QUESTION_ID" }
```

### B12. Rate the course — Login needed + must own it

1. **PUT** → `{{baseUrl}}/api/v1/course/add-review/PASTE_COURSE_ID_HERE`, Body JSON: `{ "review": "Excellent!", "rating": 5 }`

### B13. Teacher replies to a review — Admin needed (spelled `add-replay`)

1. **PUT** → `{{baseUrl}}/api/v1/course/add-replay`, Body JSON:
```json
{ "comment": "Thanks!", "courseId": "PASTE_COURSE_ID", "reviewId": "PASTE_REVIEW_ID" }
```

---

## PART C — Marketplace (courses are digital: no address, no cart, no quantity)

### C1. List courses — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/courses?page=1&limit=12` → **Send** (only PUBLISHED show; copy a course `_id`).

### C2. Categories — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/categories` → **Send**.

### C3. Search — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/search?q=react` → **Send**.

### C4. Home blocks — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/home` → **Send** (featured / top rated / newest).

### C5. Course detail — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/courses/PASTE_COURSE_ID` → **Send** (locked video URLs stay hidden).

### C6. Curriculum — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/courses/PASTE_COURSE_ID/curriculum` → **Send** (each lecture has `locked: true/false`).

### C7. Sections — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/courses/PASTE_COURSE_ID/sections` → **Send**.
2. Or by title/lecture: `{{baseUrl}}/api/v1/lms/sections/Basics` (+ `/lectures` for the lecture list).

---

## PART D — Lectures & access (enrollment = key, login needed)

### D1. Watch preview lecture
1. **GET** → `{{baseUrl}}/api/v1/lms/lectures/PASTE_LECTURE_ID` → **Send** (preview lectures are open).

### D2. Locked lecture
1. Same URL without enrollment → `403 Enroll in this course`. Buy first (PART E).

### D3. Am I allowed?
1. **GET** → `{{baseUrl}}/api/v1/lms/lectures/PASTE_LECTURE_ID/access` → **Send** → `{ "hasAccess": true/false }`.

### D4. Save progress — enrolled
1. **POST** → `{{baseUrl}}/api/v1/lms/lectures/PASTE_LECTURE_ID/progress`, Body JSON: `{ "watchedSeconds": 120 }`.

### D5. Complete lecture — enrolled
1. **POST** → `{{baseUrl}}/api/v1/lms/lectures/PASTE_LECTURE_ID/complete` → **Send** (no body). At 100% a certificate is issued automatically.

---

## PART E — Buy course (digital checkout, login needed)

> Flow: detail → **Buy Now** → payment → verify → order → enrollment → **Go to Course** in My Learning.

### E1. Create payment
1. **POST** → `{{baseUrl}}/api/v1/lms/payments/create`, Body JSON: `{ "courseId": "PASTE_COURSE_ID" }` (optional `"couponCode"`).
2. Copy `order.id` from the reply.

### E2. Verify & enroll
1. **POST** → `{{baseUrl}}/api/v1/lms/payments/verify`, Body JSON: `{ "razorpay_order_id": "PASTE", "razorpay_payment_id": "PASTE", "razorpay_signature": "PASTE", "courseId": "PASTE_COURSE_ID" }`.
2. Good reply: `201` + enrollment. Bad signature → `400`.

### E3. My purchases
1. **GET** → `{{baseUrl}}/api/v1/lms/purchases` → **Send**.
2. **GET** → `{{baseUrl}}/api/v1/lms/orders` → **Send**.

### E4. One order
1. **GET** → `{{baseUrl}}/api/v1/lms/orders/PASTE_ORDER_ID` → **Send**.

---

## PART F — My Learning (login needed; orders are just history)

### F1. Dashboard
1. **GET** → `{{baseUrl}}/api/v1/lms/my-learning` → **Send** (`continueLearning`, `inProgress`, `completed`, `wishlist`, `certificates`).

### F2. Enrollments
1. **GET** → `{{baseUrl}}/api/v1/lms/enrollments` → **Send**.
2. One: **GET** → `{{baseUrl}}/api/v1/lms/enrollments/PASTE_ENROLLMENT_ID`.

### F3. Certificates
1. **GET** → `{{baseUrl}}/api/v1/lms/certificates` → **Send**.
2. One: **GET** → `{{baseUrl}}/api/v1/lms/certificates/PASTE_CERT_ID`.

---

## PART G — Wishlist, courses (login needed)

### G1. Toggle (add/remove, same button)
1. **POST** → `{{baseUrl}}/api/v1/lms/wishlist`, Body JSON: `{ "courseId": "PASTE_COURSE_ID" }` → `{ "wishlisted": true/false }`. Alias: `POST /api/v1/lms/wishlist/toggle` (same body).

### G2. See mine
1. **GET** → `{{baseUrl}}/api/v1/lms/wishlist` → **Send**.

---

## PART H — Coupons, courses

### H1. Create coupon — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/lms/coupons`, Body JSON: `{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10, "endDate": "2027-01-01T00:00:00Z" }`.

### H2. See all — Admin needed
1. **GET** → `{{baseUrl}}/api/v1/lms/coupons` → **Send**.

### H3. Check a code — Login needed
1. **POST** → `{{baseUrl}}/api/v1/lms/coupons/validate`, Body JSON: `{ "code": "WELCOME10", "courseId": "PASTE_COURSE_ID" }` → `{ "discount": 49.9, "payable": 449.1 }`.

---

## PART I — Reviews, courses

### I1. See reviews — Public
1. **GET** → `{{baseUrl}}/api/v1/lms/reviews/PASTE_COURSE_ID` → **Send** (alias: `GET /api/v1/lms/courses/PASTE_COURSE_ID/reviews`).

### I2. Write a review — Login needed + enrolled
1. **POST** → `{{baseUrl}}/api/v1/lms/reviews/PASTE_COURSE_ID`, Body JSON: `{ "rating": 5, "comment": "Excellent!" }`. Strangers get `403`.

---

## PART J — Instructor (Instructor or Admin role)

> Lifecycle: `DRAFT` → `SUBMITTED` → `UNDER_REVIEW` → `PUBLISHED` (admin) → `UNPUBLISHED` / `ARCHIVED`. Only `PUBLISHED` shows in the marketplace.

### J1. My courses
1. **GET** → `{{baseUrl}}/api/v1/lms/instructor/courses` → **Send**.

### J2. Create (DRAFT)
1. **POST** → `{{baseUrl}}/api/v1/lms/instructor/courses`, same course body as B3.

### J3. Edit
1. **PUT** → `{{baseUrl}}/api/v1/lms/instructor/courses/PASTE_COURSE_ID`, Body JSON: `{ "price": 499 }`.

### J4. Add lecture
1. **POST** → `{{baseUrl}}/api/v1/lms/instructor/courses/PASTE_COURSE_ID/lectures`, Body JSON: `{ "title": "Lesson 1", "videoSection": "Basics", "videoLength": 10, "isPreview": true }`.

### J5. Submit for review
1. **POST** → `{{baseUrl}}/api/v1/lms/instructor/courses/PASTE_COURSE_ID/submit` → **Send** (no body).

### J6. Students / revenue / analytics
1. **GET** → `{{baseUrl}}/api/v1/lms/instructor/students`, `.../revenue`, `.../analytics`.

---

## PART K — Admin marketplace

### K1. All courses (any status)
1. **GET** → `{{baseUrl}}/api/v1/lms/admin/courses` → **Send**.

### K2. Publish / unpublish
1. **PUT** → `{{baseUrl}}/api/v1/lms/admin/courses/PASTE_COURSE_ID/status`, Body JSON: `{ "status": "PUBLISHED" }`.

### K3. Instructors
1. **GET** → `{{baseUrl}}/api/v1/lms/admin/instructors` → **Send**.

### K4. Orders / enrollments / analytics
1. **GET** → `{{baseUrl}}/api/v1/lms/admin/orders`, `.../enrollments`, `.../analytics`.

---

## PART L — Admin extras

### L1. See notifications — Admin needed
1. **GET** → `{{baseUrl}}/api/v1/notifications/get-all-notification` → **Send**.

### L2. Mark notification read — Admin needed
1. **PUT** → `{{baseUrl}}/api/v1/notifications/update-notification-status/PASTE_ID_HERE` → **Send** (no body).

### L3–L5. Charts data — Admin needed
1. **GET** → `{{baseUrl}}/api/v1/analytics/users-analytics` (signups)
2. **GET** → `{{baseUrl}}/api/v1/analytics/courses-analytics` (courses made)
3. **GET** → `{{baseUrl}}/api/v1/analytics/orders-analytics` (course orders)

### L6. See homepage layout — Public (use SMALL letters!)
1. **GET** → `{{baseUrl}}/api/v1/layout/get-layout?type=faq` → **Send**. (`banner`, `faq`, or `categories` — capital letters FAIL.)

### L7. Make/edit layout — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/layout/create-layout`, Body JSON: `{ "type": "faq", "faq": [{ "question": "Refunds?", "answer": "7 days" }] }`
2. To change: same body to **PUT** → `{{baseUrl}}/api/v1/layout/update-layout`

---

## PART M — What errors mean (plain words)

| Message you see | What it means | What to do |
|---|---|---|
| `Invalid email or password` | Email or password wrong | Retype both |
| `Email already exists` | Email taken | Use another email |
| `Invalid activation code` | Wrong 6 digits | Copy again from register reply |
| `Unauthorized` (401) | You are not logged in (or key expired) | Login again (A3) |
| `Forbidden` / admin only (403) | Logged in, but not admin | Ask an admin to do A12 for you |
| `Enroll in this course` (403) | Lecture locked, no enrollment | Buy via E1–E2, then F1 |
| `already purchased/enrolled` | You did it before | Open F1 My Learning |
| `Payment verification failed` (400) | Bad signature | Check Razorpay ids |
| `... does not exist` | Wrong id or CAPITAL letters in layout type | Check id / use lowercase |
| `Section/Course not found` (404) | Wrong id | Copy the id again |
| 404 on `/product` `/cart` `/address` | Removed shop APIs | Use `/api/v1/lms/*` |

**Golden rules:** IDs come from earlier replies. Enrollment = access (locked lectures need E1–E2 first). Courses are digital: no address, no quantity, no cart. Layout types are lowercase.
