# Frontend + Postman Guide — ReactJS Step by Step

> Companion to [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md).
> **Base URL (Production):** `https://mockapi-mauve.vercel.app`
> **Base URL (Local):** `http://localhost:8000`
> Docs-only file. No backend code was changed.

---

## Table of Contents

- [Part A — Postman step by step](#part-a--postman-step-by-step)
- [Part B — ReactJS step by step](#part-b--reactjs-step-by-step)
- [Part C — User vs Admin checklists](#part-c--user-vs-admin-checklists)
- [Part D — Troubleshooting](#part-d--troubleshooting)

---

# Part A — Postman step by step

Use Postman to prove the API works **before** writing React code.

## A1. One-time setup (2 min)

1. Open Postman → **Environments** → create `LMS API`:
   - `baseUrl` = `http://localhost:8000` (or production URL)
   - `token` = (empty for now)
2. Create a collection `LMS` with folders: `Auth`, `Shop-User`, `Shop-Admin`, `Courses`.
3. Collection → **Authorization** → Type: `Bearer Token`, Token: `{{token}}`.
   - This sends `Authorization: Bearer <token>` on every request in the collection.
   - Public routes ignore it. Protected routes need it.
4. For `GET /api/v1/auth/refreshtoken` only: cookies must be enabled (Postman sends them automatically after login on the same domain).

> Rule: every URL = `{{baseUrl}}` + path, e.g. `{{baseUrl}}/api/v1/auth/login`.

## A2. Auth flow in Postman (do in order)

**1. Register (Public)**

```
POST {{baseUrl}}/api/v1/auth/register
Body (JSON):
{ "name": "Test Student", "email": "student@example.com", "password": "Pass@123" }
```

- Saves response `activationToken` + `activationCode` (6 digits, valid 5 min).

**2. Activate (Public)**

```
POST {{baseUrl}}/api/v1/auth/activate-user
Body (JSON):
{ "activation_token": "<from step 1>", "activation_code": "<from step 1>" }
```

**3. Login (Public) → save token**

```
POST {{baseUrl}}/api/v1/auth/login
Body (JSON):
{ "email": "student@example.com", "password": "Pass@123" }
```

- Copy `accessToken` (or `access_token`) from response → paste into environment `token`.
- Tests tab shortcut (auto-saves token):
  ```js
  const j = pm.response.json();
  pm.environment.set("token", j.accessToken || j.access_token);
  ```

**4. Verify login (Auth)**

```
GET {{baseUrl}}/api/v1/auth/me
```

- Uses `{{token}}` automatically. Should return your user + `role: "user"`.

**5. Refresh (Cookie)**

```
GET {{baseUrl}}/api/v1/auth/refreshtoken
```

- No body, no manual token. If `401`, cookies expired → login again.

## A3. Buy + learn as STUDENT in Postman (digital — no address/cart)

(All need `Bearer {{token}}` of a `user`.)

```
GET  {{baseUrl}}/api/v1/lms/courses?page=1&limit=5
GET  {{baseUrl}}/api/v1/lms/courses/<courseId>
POST {{baseUrl}}/api/v1/lms/coupons/validate
     { "code": "WELCOME10", "courseId": "<courseId>" }
POST {{baseUrl}}/api/v1/lms/payments/create
     { "courseId": "<courseId>", "couponCode": "WELCOME10" }
POST {{baseUrl}}/api/v1/lms/payments/verify
     { "paymentIntentId": "<id>", "courseId": "<courseId>" }
GET  {{baseUrl}}/api/v1/lms/my-learning
GET  {{baseUrl}}/api/v1/lms/lectures/<lectureId>
POST {{baseUrl}}/api/v1/lms/lectures/<lectureId>/complete
```

## A4. Admin in Postman

(All need `Bearer {{token}}` of an `admin`. Promote once via `PUT /auth/update-user-roles`, then login again.)

```
PUT  {{baseUrl}}/api/v1/lms/admin/courses/<courseId>/status
     { "status": "PUBLISHED" }
POST {{baseUrl}}/api/v1/lms/coupons
     { "code": "WELCOME10", "discountType": "percentage",
       "discountValue": 10, "endDate": "2027-01-01T00:00:00Z" }
GET  {{baseUrl}}/api/v1/lms/admin/orders
GET  {{baseUrl}}/api/v1/lms/admin/enrollments
GET  {{baseUrl}}/api/v1/lms/admin/analytics
PUT  {{baseUrl}}/api/v1/auth/update-user-roles
     { "id": "<studentUserId>", "role": "instructor" }
```

## A5. Postman clean points

- Put `{{baseUrl}}` and `{{token}}` in the environment. Never hardcode tokens in URLs.
- One request per endpoint, named exactly like the docs (`Auth-Login`, `LMS-Courses`, …).
- Save example responses so students can compare.
- `401` = login again. `403` = you need an admin token.
- Locked lectures need enrollment first: buy via `POST /lms/payments/create` → `POST /lms/payments/verify`.

---

# Part B — ReactJS step by step

Minimal, copy-paste setup. Assumes React 18 + `axios` + `react-router-dom`.

## B1. Create project + base URL (5 min)

```bash
npm create vite@latest lms-frontend -- --template react
cd lms-frontend
npm install axios react-router-dom
npm run dev
```

Create `.env`:

```env
VITE_API_URL=http://localhost:8000
# VITE_API_URL=https://mockapi-mauve.vercel.app
```

Create `src/api/client.js` — single place for all API calls:

```js
import axios from "axios";

export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  withCredentials: true, // REQUIRED: lets cookies (refresh token) travel
});

// Attach Bearer token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

> Why both? `Bearer` header works for Postman/mobile/every fetch. `withCredentials: true` enables cookie refresh in browsers. Send both — backend accepts either.

## B2. Auth context (login state for whole app)

Create `src/auth/AuthContext.jsx`:

```jsx
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On reload: if token exists, fetch /me
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return setLoading(false);
    api.get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => localStorage.removeItem("accessToken"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const token = data.accessToken || data.access_token;
    localStorage.setItem("accessToken", token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api.get("/auth/logout").catch(() => {});
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading,
      isAdmin: user?.role === "admin" }}>
      {children}
    </AuthCtx.Provider>
  );
}
```

Wrap app in `main.jsx`:

```jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

<AuthProvider><BrowserRouter><App /></BrowserRouter></AuthProvider>
```

## B3. Register → Activate → Login pages

```jsx
// Register
await api.post("/auth/register", { name, email, password });
// → save activationToken + activationCode from response,
//    show "check email" screen, go to /activate

// Activate
await api.post("/auth/activate-user", {
  activation_token: activationToken,
  activation_code: activationCode,
});
// → redirect to /login

// Login (use context)
const user = await login(email, password);
if (user.role === "admin") navigate("/admin");
else if (user.role === "instructor") navigate("/instructor");
else navigate("/courses");
```

Clean points:

- Activation code expires in **5 minutes** → offer "Resend = register again".
- `update-user-info` only applies `name` (email is ignored) — don't build an email-change form.
- Social login: `POST /auth/social-auth` with `{ email, name, avatar }`.

## B4. Protected + Admin routes

```jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <p>Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? children : <p>403 — Admins only.</p>;
}
```

```jsx
<Route path="/my-learning" element={<RequireAuth><MyLearning /></RequireAuth>} />
<Route path="/instructor" element={<RequireInstructor><Instructor /></RequireInstructor>} />
<Route path="/admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
```

## B5. STUDENT screens (marketplace flow — no cart, no address)

**Marketplace (Public):**

```jsx
const { data } = await api.get("/lms/courses", {
  params: { page: 1, limit: 12, search: keyword, category, level },
});
const detail = await api.get(`/lms/courses/${courseId}`);
```

**Buy + enroll (Razorpay):**

```jsx
await api.post("/lms/coupons/validate", { code: "WELCOME10", courseId });
const { data: pay } = await api.post("/lms/payments/create", { courseId, couponCode: "WELCOME10" });
// ... open Razorpay Checkout with pay.order.id ...
await api.post("/lms/payments/verify", {
  razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId,
}); // → enrollment; show "Go to Course"
```

**Learn:**

```jsx
const { data: mine } = await api.get("/lms/my-learning");
const { data: lecture } = await api.get(`/lms/lectures/${lectureId}`); // preview open, locked → 403
await api.post(`/lms/lectures/${lectureId}/complete`); // 100% → certificate
await api.post("/lms/wishlist", { courseId }); // toggle
await api.post(`/lms/reviews/${courseId}`, { rating: 5, comment });
```

## B6. ADMIN screens

```jsx
// Promote a user (admin only)
await api.put("/auth/update-user-roles", { id: studentId, role: "instructor" });

// Publish a submitted course
await api.put(`/lms/admin/courses/${courseId}/status`, { status: "PUBLISHED" });

// Marketplace dashboards
const { data: orders } = await api.get("/lms/admin/orders");
const { data: enrollments } = await api.get("/lms/admin/enrollments");
const { data: stats } = await api.get("/lms/admin/analytics");
```

Hide admin links in UI unless `isAdmin`:

```jsx
{isAdmin && <Link to="/admin">Admin dashboard</Link>}
```

> Backend still enforces admin — hiding links is UX only, never security.

## B7. React clean points (avoid student confusion)

1. **One `api` client** (`src/api/client.js`). Never hardcode URLs in components.
2. **`withCredentials: true` + Bearer interceptor** — set once, forget.
3. **Token in `localStorage`, user in context.** On reload, validate via `GET /auth/me`.
4. **Enrollment = access:** buying via `POST /lms/payments/verify` (or legacy `POST /order/create-order`) creates the enrollment that unlocks lectures.
5. **Handle 401 globally** (optional): on 401, clear token → redirect to login.
   ```js
   api.interceptors.response.use(
     (r) => r,
     (e) => {
       if (e.response?.status === 401) {
         localStorage.removeItem("accessToken");
         if (!location.pathname.includes("/login")) location.href = "/login";
       }
       return Promise.reject(e);
     }
   );
   ```
6. **Forms send exact field names:** `activation_token` (not `activationToken`), `oldPassword/newPassword`, `{ id, role }` for role change.
7. **Course content needs enrollment first:** call `POST /order/create-order`, then `GET /course/get-course-content/:id`.

---

# Part C — User vs Admin checklists

## User checklist (student must demo)

- [ ] Register → activate → login → `/me` works
- [ ] Browse `GET /lms/courses`, view detail + curriculum
- [ ] Validate coupon, create + verify payment, see enrollment in `GET /lms/my-learning`
- [ ] Open preview lecture, complete lectures, earn certificate
- [ ] Toggle wishlist, post review (enrolled)

## Admin checklist

- [ ] Login with admin token
- [ ] As instructor: create DRAFT course → add lectures → submit
- [ ] As admin: publish course (appears in marketplace), create coupon
- [ ] View `GET /lms/admin/orders`, `/lms/admin/enrollments`, `/lms/admin/analytics`
- [ ] View users + analytics
- [ ] Promote/demote a test user via `PUT /auth/update-user-roles`

---

# Part D — Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `401 Unauthorized` | Token missing/expired → login again, check `Authorization: Bearer` header or `withCredentials: true`. |
| `403 Forbidden` | Logged in as `user` on admin route → promote + login again. |
| CORS error in React | Backend allowslisted `localhost:3000/5173` + permissive fallback; ensure `withCredentials: true` and `VITE_API_URL` has no trailing slash. |
| Locked lecture 403 | Enroll first (`POST /lms/payments/create` → verify), then open My Learning. |
| Course content blocked | Enroll first (`POST /order/create-order`). |
| Activation fails | Code is 6 digits, 5-min expiry; field names are `activation_token` + `activation_code`. |
| Email change ignored | By design — `update-user-info` only updates `name`. |
| No certificate yet | Complete **every** lecture (`POST /lms/lectures/:id/complete`) — issued at 100%. |
| `503` DB error | `DB_URI` wrong or Atlas IP not whitelisted (`0.0.0.0/0`). |
