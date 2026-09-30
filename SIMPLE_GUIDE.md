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

## PART C — Shop categories & brands

### C1. See all categories — Public
1. **GET** → `{{baseUrl}}/api/v1/category/all` → **Send**. Copy a category `_id`.

### C2. See one category — Public
1. **GET** → `{{baseUrl}}/api/v1/category/single/electronics` (name-link works) or `/single/PASTE_ID_HERE` → **Send**.

### C3. Create a category — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/category/create`, Body JSON: `{ "name": "Electronics", "description": "Gadgets" }` → copy the new `_id`.

### C4. Edit a category — Admin needed
1. **PUT** → `{{baseUrl}}/api/v1/category/update/PASTE_ID_HERE`, Body JSON: `{ "description": "New text" }`

### C5. Delete a category — Admin needed
1. **DELETE** → `{{baseUrl}}/api/v1/category/delete/PASTE_ID_HERE` → **Send**.

### C6. Create a brand — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/category/brand/create`, Body JSON: `{ "name": "Acme", "description": "Acme brand" }` → copy the new `_id`.

### C7. See all brands — Public
1. **GET** → `{{baseUrl}}/api/v1/category/brands/all` → **Send**.

---

## PART D — Products (shop items)

### D1. See/search products — Public
1. **GET** → paste one of these → **Send**:
- All: `{{baseUrl}}/api/v1/product/all?page=1&limit=12`
- Search: `{{baseUrl}}/api/v1/product/all?search=mouse`
- Cheap first: `{{baseUrl}}/api/v1/product/all?sort=price-asc`
- Costly first: `{{baseUrl}}/api/v1/product/all?sort=price-desc`
- Top rated: `{{baseUrl}}/api/v1/product/all?sort=rating`
2. Copy a product `_id` for later steps.

### D2. Featured products (homepage) — Public
1. **GET** → `{{baseUrl}}/api/v1/product/featured` → **Send**.

### D3. See one product — Public
1. **GET** → `{{baseUrl}}/api/v1/product/single/PASTE_PRODUCT_ID_HERE` → **Send**.

### D4. Similar products — Public
1. **GET** → `{{baseUrl}}/api/v1/product/related/PASTE_PRODUCT_ID_HERE` → **Send**.

### D5. Create a product — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/product/create`, Body JSON (only `title`, `price`, `category` are a must):
```json
{ "title": "Wireless Mouse", "price": 999, "category": "PASTE_CATEGORY_ID", "stockQuantity": 50 }
```
2. Copy the new product `_id`.

### D6. Edit a product — Admin needed
1. **PUT** → `{{baseUrl}}/api/v1/product/update/PASTE_PRODUCT_ID_HERE`, Body JSON: `{ "price": 899, "stockQuantity": 100 }`

### D7. Delete a product — Admin needed
1. **DELETE** → `{{baseUrl}}/api/v1/product/delete/PASTE_PRODUCT_ID_HERE` → **Send**.

---

## PART E — My addresses (login needed for all 5)

### E1. Add address
1. **POST** → `{{baseUrl}}/api/v1/address/add`, Body JSON:
```json
{ "fullName": "Ravi Kumar", "phone": "9876543210",
  "addressLine1": "H.No 1-2-3, MG Road", "city": "Hyderabad",
  "state": "Telangana", "postalCode": "500001", "isDefault": true }
```
2. Copy the address `_id` — you need it to order (Part J).

### E2. See my addresses
1. **GET** → `{{baseUrl}}/api/v1/address/my-addresses` → **Send**.

### E3. Edit address
1. **PUT** → `{{baseUrl}}/api/v1/address/update/PASTE_ADDRESS_ID_HERE`, Body JSON: `{ "phone": "9123456780" }`

### E4. Delete address
1. **DELETE** → `{{baseUrl}}/api/v1/address/delete/PASTE_ADDRESS_ID_HERE` → **Send**.

### E5. Make default address
1. **PUT** → `{{baseUrl}}/api/v1/address/set-default/PASTE_ADDRESS_ID_HERE` → **Send** (no body needed).

---

## PART F — Cart (login needed for all 6)

### F1. See my cart
1. **GET** → `{{baseUrl}}/api/v1/cart/` → **Send**. You see items + `summary` (subtotal, discount, tax, shipping, grandTotal). Each item has its own `_id` — that is the `itemId` for F3/F4 (NOT the product id!).

### F2. Add to cart
1. **POST** → `{{baseUrl}}/api/v1/cart/add`, Body JSON: `{ "productId": "PASTE_PRODUCT_ID", "quantity": 2 }`

### F3. Change quantity
1. **PUT** → `{{baseUrl}}/api/v1/cart/update-quantity`, Body JSON: `{ "itemId": "PASTE_CART_ITEM_ID", "quantity": 3 }` (use `0` to remove).

### F4. Remove one item
1. **DELETE** → `{{baseUrl}}/api/v1/cart/item/PASTE_CART_ITEM_ID_HERE` → **Send**.

### F5. Empty the whole cart
1. **DELETE** → `{{baseUrl}}/api/v1/cart/clear` → **Send**.

### F6. Merge guest cart (after login)
1. **POST** → `{{baseUrl}}/api/v1/cart/merge`, Body JSON: `{ "guestItems": [{ "productId": "PASTE_ID", "quantity": 1 }] }`

---

## PART G — Wishlist (login needed for all 3)

### G1. See my wishlist
1. **GET** → `{{baseUrl}}/api/v1/wishlist/` → **Send**.

### G2. Add/remove (same button)
1. **POST** → `{{baseUrl}}/api/v1/wishlist/toggle`, Body JSON: `{ "productId": "PASTE_PRODUCT_ID" }`
2. Reply says `"action": "added"` or `"removed"`. Click Send again to undo.

### G3. Move to cart
1. **POST** → `{{baseUrl}}/api/v1/wishlist/move-to-cart/PASTE_PRODUCT_ID_HERE` → **Send** (no body).

---

## PART H — Coupons

### H1. Create coupon — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/coupon/create`, Body JSON:
```json
{ "code": "WELCOME10", "discountType": "percentage", "discountValue": 10,
  "minOrderAmount": 500, "endDate": "2026-12-31" }
```
(`discountType` is `percentage` or `fixed`.)

### H2. See all coupons — Admin needed
1. **GET** → `{{baseUrl}}/api/v1/coupon/all` → **Send**.

### H3. Use coupon — Login needed
1. **POST** → `{{baseUrl}}/api/v1/coupon/apply`, Body JSON: `{ "code": "WELCOME10" }`
2. Reply tells you how much you saved. If it says minimum amount, add more items first.

### H4. Remove coupon — Login needed
1. **POST** → `{{baseUrl}}/api/v1/coupon/remove` → **Send** (no body).

### H5. Delete coupon — Admin needed
1. **DELETE** → `{{baseUrl}}/api/v1/coupon/delete/PASTE_COUPON_ID_HERE` → **Send**.

---

## PART I — Payments (online money)

### I1. Get shop key — Public
1. **GET** → `{{baseUrl}}/api/v1/payment/razorpay-key` → **Send**. Copy the `key` (your website needs it).

### I2. Make a payment order — Login needed
1. **POST** → `{{baseUrl}}/api/v1/payment/razorpay-order`, Body JSON: `{}` (empty! it counts your cart itself) → **Send**. Copy the order `id`.

### I3. Confirm payment — Login needed
1. After paying on the website you get 3 values. **POST** → `{{baseUrl}}/api/v1/payment/verify`, Body JSON:
```json
{ "razorpay_order_id": "PASTE", "razorpay_payment_id": "PASTE", "razorpay_signature": "PASTE" }
```

### I4. Webhook — NOT for you
This is called by Razorpay's computer automatically. Skip it.

### I5. Refund — Admin needed
1. **POST** → `{{baseUrl}}/api/v1/payment/refund`, Body JSON: `{ "paymentId": "pay_PASTE_ID" }`

**Easy choice:** skip I1–I3 completely and pay cash on delivery — order with `"method": "cod"` (Part J).

---

## PART J — Shop orders

### J1. Place order — Login needed (cart must NOT be empty!)
1. **POST** → `{{baseUrl}}/api/v1/ecommerce/order/create`, Body JSON (use your address id from E1):
```json
{ "addressId": "PASTE_ADDRESS_ID", "paymentInfo": { "method": "cod" } }
```
2. Write down the `orderNumber` (like `ORD-...`) from the reply. If it says cart is empty, do F2 first.
3. Paid online? Use instead:
```json
{ "addressId": "PASTE_ADDRESS_ID",
  "paymentInfo": { "method": "Razorpay", "orderId": "PASTE_ORDER_ID", "id": "PASTE_PAY_ID", "signature": "PASTE_SIGN" } }
```

### J2. My orders — Login needed
1. **GET** → `{{baseUrl}}/api/v1/ecommerce/order/my-orders` → **Send**.

### J3. One order details — Login needed
1. **GET** → `{{baseUrl}}/api/v1/ecommerce/order/single/PASTE_ORDER_ID_HERE` → **Send** (only yours, unless admin).

### J4. Cancel my order — Login needed
1. **PUT** → `{{baseUrl}}/api/v1/ecommerce/order/cancel/PASTE_ORDER_ID_HERE`, Body JSON: `{ "reason": "Ordered by mistake" }`
2. Works only BEFORE it ships. After shipping it says cannot cancel.

### J5. All orders — Admin needed
1. **GET** → `{{baseUrl}}/api/v1/ecommerce/order/admin/all?status=Processing&page=1&limit=20` → **Send**.

### J6. Change order status — Admin needed
1. **PUT** → `{{baseUrl}}/api/v1/ecommerce/order/admin/status/PASTE_ORDER_ID_HERE`, Body JSON:
```json
{ "status": "Shipped", "trackingNumber": "TRK123", "courierPartner": "Delhivery" }
```
2. Change `"status"` to `Shipped`, then later `Delivered`.

---

## PART K — Product reviews

### K1. See reviews — Public
1. **GET** → `{{baseUrl}}/api/v1/product-reviews/product/PASTE_PRODUCT_ID_HERE` → **Send**.

### K2. Write a review — Login needed
1. **POST** → `{{baseUrl}}/api/v1/product-reviews/add`, Body JSON:
```json
{ "productId": "PASTE_PRODUCT_ID", "rating": 5, "title": "Loved it", "comment": "Value for money" }
```
2. One review per product only. `rating` is 1 to 5.

### K3. Say review was helpful — Login needed
1. **PUT** → `{{baseUrl}}/api/v1/product-reviews/helpful/PASTE_REVIEW_ID_HERE` → **Send** (no body).

### K4. Delete a review — Login needed (yours or admin)
1. **DELETE** → `{{baseUrl}}/api/v1/product-reviews/delete/PASTE_REVIEW_ID_HERE` → **Send**.

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
| `Your cart is empty` | Nothing in cart | Do F2 first |
| `not allowed to access this course` | You didn't buy it | Do B7 first |
| `already purchased/reviewed` | You did it before | Nothing to do |
| `cannot be cancelled` | Already shipped | Too late to cancel |
| `... does not exist` | Wrong id or CAPITAL letters in layout type | Check id / use lowercase |
| `Only N items in stock` | Asked for more than shop has | Lower the quantity |
| `Not found` (404) | Wrong id in URL | Copy the id again |

**Golden rules:** IDs come from earlier replies (course `_id`, `addressId`, cart `itemId`, `orderId`). Cart item id ≠ product id. Course buying (`/order/...`) and shop buying (`/ecommerce/order/...`) are different. `cod` and layout types are lowercase.
