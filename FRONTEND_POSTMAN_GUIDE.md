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

## A3. Shop as USER in Postman

(All need `Bearer {{token}}` of a `user`.)

```
GET  {{baseUrl}}/api/v1/product/all?page=1&limit=5
POST {{baseUrl}}/api/v1/address/add
     { "fullName": "Ravi Kumar", "phone": "9876543210",
       "addressLine1": "H.No 1-2-3, MG Road", "city": "Hyderabad",
       "state": "Telangana", "postalCode": "500001" }
POST {{baseUrl}}/api/v1/cart/add
     { "productId": "<productId>", "quantity": 2 }
GET  {{baseUrl}}/api/v1/cart/
POST {{baseUrl}}/api/v1/coupon/apply
     { "code": "WELCOME10" }
POST {{baseUrl}}/api/v1/ecommerce/order/create
     { "addressId": "<addressId>", "paymentInfo": { "method": "cod" } }
GET  {{baseUrl}}/api/v1/ecommerce/order/my-orders
```

## A4. Admin in Postman

(All need `Bearer {{token}}` of an `admin`. Promote once via `PUT /auth/update-user-roles`, then login again.)

```
POST {{baseUrl}}/api/v1/category/create
     { "name": "Electronics", "description": "Gadgets" }
POST {{baseUrl}}/api/v1/category/brand/create
     { "name": "Acme", "description": "Acme brand" }
POST {{baseUrl}}/api/v1/product/create
     { "title": "Wireless Mouse", "price": 999,
       "category": "<categoryId>", "stockQuantity": 50 }
POST {{baseUrl}}/api/v1/coupon/create
     { "code": "WELCOME10", "discountType": "percentage",
       "discountValue": 10, "minOrderAmount": 500, "endDate": "2026-12-31" }
GET  {{baseUrl}}/api/v1/ecommerce/order/admin/all?status=all&page=1&limit=20
PUT  {{baseUrl}}/api/v1/ecommerce/order/admin/status/<orderId>
     { "status": "Shipped" }
PUT  {{baseUrl}}/api/v1/auth/update-user-roles
     { "id": "<studentUserId>", "role": "admin" }
```

## A5. Postman clean points

- Put `{{baseUrl}}` and `{{token}}` in the environment. Never hardcode tokens in URLs.
- One request per endpoint, named exactly like the docs (`Auth-Login`, `Cart-Add`, …).
- Save example responses so students can compare.
- `401` = login again. `403` = you need an admin token.
- Cart remove uses **cart item ID**: `DELETE /api/v1/cart/item/:itemId`, not product ID.

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
else navigate("/shop");
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
<Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
<Route path="/admin/products" element={<RequireAdmin><AdminProducts /></RequireAdmin>} />
```

## B5. USER screens (shop flow)

**Product list (Public):**

```jsx
const { data } = await api.get("/product/all", {
  params: { page: 1, limit: 12, search: keyword, minPrice, maxPrice, sort: "price-asc" },
});
```

**Addresses:**

```jsx
await api.post("/address/add", {
  fullName, phone, addressLine1, city, state, postalCode,
});
const { data } = await api.get("/address/my-addresses");
```

**Cart:**

```jsx
await api.post("/cart/add", { productId, quantity: 1 });
await api.put("/cart/update-quantity", { itemId, quantity: 3 });
await api.delete(`/cart/item/${itemId}`);
const { data } = await api.get("/cart/");
```

**Coupon + Order (COD simplest):**

```jsx
await api.post("/coupon/apply", { code: "WELCOME10" });
await api.post("/ecommerce/order/create", {
  addressId, paymentInfo: { method: "cod" },
});
```

**Razorpay (online payment) order:**

```jsx
const { data: k } = await api.get("/payment/razorpay-key");
const { data: o } = await api.post("/payment/razorpay-order", { amount: 999 });
// ... open Razorpay Checkout with k.key + o.order.id ...
await api.post("/payment/verify", {
  razorpay_order_id, razorpay_payment_id, razorpay_signature,
});
await api.post("/ecommerce/order/create", {
  addressId, paymentInfo: { method: "Razorpay", razorpay_order_id, razorpay_payment_id, razorpay_signature },
});
```

## B6. ADMIN screens

```jsx
// Promote a user (admin only)
await api.put("/auth/update-user-roles", { id: studentId, role: "admin" });

// Catalog
await api.post("/category/create", { name, description });
await api.post("/product/create", { title, price, category: categoryId, stockQuantity: 50 });

// Orders dashboard
const { data } = await api.get("/ecommerce/order/admin/all", {
  params: { status: "all", page: 1, limit: 20 },
});
await api.put(`/ecommerce/order/admin/status/${orderId}`, { status: "Shipped" });
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
4. **Separate LMS vs shop orders:** courses → `POST /order/create-order`; products → `POST /ecommerce/order/create`.
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
- [ ] Browse `GET /product/all`, view `GET /product/single/:id`
- [ ] Add address, add to cart, view cart
- [ ] Apply coupon (or handle "invalid coupon" message)
- [ ] Place COD order, see it in `GET /ecommerce/order/my-orders`
- [ ] Enroll in course (`POST /order/create-order`), open content, post question + review

## Admin checklist

- [ ] Login with admin token
- [ ] Create category → brand → product (product appears in public list)
- [ ] Create coupon (user can apply it)
- [ ] View `GET /ecommerce/order/admin/all`, update status to `Shipped`
- [ ] View users + analytics
- [ ] Promote/demote a test user via `PUT /auth/update-user-roles`

---

# Part D — Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `401 Unauthorized` | Token missing/expired → login again, check `Authorization: Bearer` header or `withCredentials: true`. |
| `403 Forbidden` | Logged in as `user` on admin route → promote + login again. |
| CORS error in React | Backend allowslisted `localhost:3000/5173` + permissive fallback; ensure `withCredentials: true` and `VITE_API_URL` has no trailing slash. |
| Empty cart on order | Add to cart first; ordering reads the server cart, not local state. |
| Course content blocked | Enroll first (`POST /order/create-order`). |
| Activation fails | Code is 6 digits, 5-min expiry; field names are `activation_token` + `activation_code`. |
| Email change ignored | By design — `update-user-info` only updates `name`. |
| Cart delete 404 | Use cart **item ID** (`/cart/item/:itemId`), not product ID. |
| `503` DB error | `DB_URI` wrong or Atlas IP not whitelisted (`0.0.0.0/0`). |
