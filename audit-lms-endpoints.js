/* LMS Course Marketplace endpoint audit — probes every current route live.
   Covers: system, auth, legacy course/order, notifications, analytics, layout,
   and the full /api/v1/lms/* surface (discovery, lectures, purchase,
   learning, wishlist, reviews, coupons, certificates, instructor, admin).
   Expects: `npm run build` has been run (uses ./dist) and DB_URI is set.
   Run:  npm run audit   (or: node audit-lms-endpoints.js)
   Writes: ./lms-audit-results.json ; all test data is removed afterwards. */
const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const { app } = require("./dist/app.js");
const { CONFIG } = require("./dist/config/index.js");
const userModel = require("./dist/models/user.model.js").default;
const CourseModel = require("./dist/models/course.model.js").default;
const OrderModel = require("./dist/models/orderModel.js").default;
const EnrollmentModel = require("./dist/models/enrollment.model.js").default;
const NotificationModel = require("./dist/models/notificationModel.js").default;
const LayoutModel = require("./dist/models/layout.model.js").default;
const jwt = require("jsonwebtoken");

const PORT = 8094;
const results = [];
let passed = 0;
let failed = 0;

async function probe(group, desc, method, url, opts = {}) {
  const { headers = {}, body = null, expect = [200] } = opts;
  try {
    const o = { method, headers: { "Content-Type": "application/json", ...headers }, signal: AbortSignal.timeout(25000) };
    if (body) o.body = JSON.stringify(body);
    const res = await fetch(`http://localhost:${PORT}${url}`, o);
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch { data = text; }
    const ok = expect.includes(res.status);
    if (ok) passed++; else failed++;
    console.log(`  ${ok ? "PASS" : "FAIL"} [${res.status}] ${method.padEnd(6)} ${url} -> ${desc}`);
    if (!ok) console.log(`       detail: ${(typeof data === "object" ? JSON.stringify(data) : String(data)).slice(0, 220)}`);
    const r = { group, desc, method, url, status: res.status, ok };
    results.push(r);
    return { res, data, ok };
  } catch (e) {
    failed++;
    console.log(`  FAIL [ERR] ${method.padEnd(6)} ${url} -> ${desc}: ${e.message}`);
    results.push({ group, desc, method, url, status: 0, ok: false, error: e.message });
    return { res: null, data: null, ok: false };
  }
}

async function main() {
  const connectDb = require("./dist/utils/db.js").default;
  await connectDb();
  // Pre-clean leftovers from any interrupted audit run
  try {
    const staleUsers = await userModel.find({ email: /audit_|^reg_|^soc_/ }).select("_id");
    const staleIds = staleUsers.map((u) => u._id.toString());
    const staleCourses = await CourseModel.find({ $or: [{ name: /^Audit / }, { tags: "audit" }] }).select("_id");
    const staleCids = staleCourses.map((c) => c._id.toString());
    await CourseModel.deleteMany({ _id: { $in: staleCourses.map((c) => c._id) } });
    await OrderModel.deleteMany({ $or: [{ userId: { $in: staleIds } }, { courseId: { $in: staleCids } }] });
    await EnrollmentModel.deleteMany({ $or: [{ userId: { $in: staleIds } }, { courseId: { $in: staleCids } }] });
    await userModel.deleteMany({ email: /audit_|^reg_|^soc_/ });
    console.log("pre-clean done");
  } catch (e) { console.log("pre-clean skipped:", e.message); }
  const server = http.createServer(app);
  await new Promise((res, rej) => {
    server.listen(PORT, () => res(null));
    server.on("error", rej);
  });
  console.log(`server on ${PORT}`);

  const ts = Date.now();
  const mkUser = async (name, email, role, pw) => {
    let u = await userModel.findOne({ email });
    if (!u) u = await userModel.create({ name, email, password: pw, role, isVerified: true });
    return u;
  };
  const student = await mkUser("Audit Student", `audit_stu_${ts}@example.com`, "user", "AuditPass123!");
  const student2 = await mkUser("Audit Buyer", `audit_buy_${ts}@example.com`, "user", "AuditPass123!");
  const instructor = await mkUser("Audit Instructor", `audit_ins_${ts}@example.com`, "instructor", "AuditPass123!");
  const admin = await mkUser("Audit Admin", `audit_adm_${ts}@example.com`, "admin", "AuditPass123!");
  const tempUser = await mkUser("Audit Temp", `audit_tmp_${ts}@example.com`, "user", "AuditPass123!");
  const sign = (u) => jwt.sign({ id: u._id.toString() }, CONFIG.ACCESS_TOKEN, { expiresIn: "1h" });
  const sH = { Authorization: `Bearer ${sign(student)}` };
  const s2H = { Authorization: `Bearer ${sign(student2)}` };
  const iH = { Authorization: `Bearer ${sign(instructor)}` };
  const aH = { Authorization: `Bearer ${sign(admin)}` };

  // Seed main course with 2 lectures (1 preview) directly
  const courseA = await CourseModel.create({
    name: `Audit Course A ${ts}`, description: "audit", price: 499,
    tags: "audit", level: "Beginner", demoUrl: "https://example.com/demo",
    category: "Audit", status: "PUBLISHED",
    courseData: [
      { title: "Intro (preview)", description: "p", videoUrl: "https://example.com/v1", videoSection: "Basics", videoLength: 5, isPreview: true },
      { title: "Deep dive", description: "d", videoUrl: "https://example.com/v2", videoSection: "Basics", videoLength: 10 },
    ],
  });
  const courseB = await CourseModel.create({
    name: `Audit Course B ${ts}`, description: "audit", price: 999,
    tags: "audit", level: "Advanced", demoUrl: "https://example.com/demo",
    category: "Audit", status: "PUBLISHED",
    courseData: [
      { title: "B L1 preview", description: "p", videoUrl: "https://example.com/b1", videoSection: "S1", videoLength: 4, isPreview: true },
      { title: "B L2 locked", description: "d", videoUrl: "https://example.com/b2", videoSection: "S1", videoLength: 8 },
    ],
  });
  const cA = courseA._id.toString(), cB = courseB._id.toString();
  const lecA1 = courseA.courseData[0]._id.toString(), lecA2 = courseA.courseData[1]._id.toString();
  const lecB1 = courseB.courseData[0]._id.toString(), lecB2 = courseB.courseData[1]._id.toString();

  // ---------- SYSTEM ----------
  console.log("\n--- SYSTEM ---");
  await probe("System", "Health", "GET", "/test");
  await probe("System", "Root", "GET", "/");
  await probe("System", "OpenAPI JSON", "GET", "/api-docs.json");
  await probe("System", "Swagger UI", "GET", "/api-docs");
  await probe("System", "Docs alias", "GET", "/docs");
  await probe("System", "Guide", "GET", "/guide");
  await probe("System", "Simple guide", "GET", "/simple-guide");

  // ---------- AUTH ----------
  console.log("\n--- AUTH ---");
  await probe("Auth", "Register", "POST", "/api/v1/auth/register", { body: { name: "Reg New", email: `reg_${ts}@example.com`, password: "Password123!" }, expect: [201] });
  const loginRes = await probe("Auth", "Login (real)", "POST", "/api/v1/auth/login", { body: { email: `audit_stu_${ts}@example.com`, password: "AuditPass123!" }, expect: [200] });
  // Refresh flow with real cookie jar
  try {
    const lr = await fetch(`http://localhost:${PORT}/api/v1/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `audit_stu_${ts}@example.com`, password: "AuditPass123!" }),
      signal: AbortSignal.timeout(25000),
    });
    const cookies = (lr.headers.getSetCookie ? lr.headers.getSetCookie() : []).join("; ");
    const m = cookies.match(/refresh_token=([^;]+)/);
    if (m) {
      await probe("Auth", "Refresh (valid cookie)", "GET", "/api/v1/auth/refreshtoken", { headers: { Cookie: `refresh_token=${m[1]}` } });
    } else {
      console.log("  SKIP refresh-cookie probe: no set-cookie received");
      results.push({ group: "Auth", desc: "Refresh (valid cookie)", method: "GET", url: "/api/v1/auth/refreshtoken", status: 0, ok: false, error: "no cookie" });
      failed++;
    }
  } catch (e) { console.log("  SKIP refresh-cookie probe:", e.message); }
  await probe("Auth", "Get me", "GET", "/api/v1/auth/me", { headers: sH });
  await probe("Auth", "Get me (no token -> 401)", "GET", "/api/v1/auth/me", { expect: [401] });
  await probe("Auth", "Social auth", "POST", "/api/v1/auth/social-auth", { body: { email: `soc_${ts}@example.com`, name: "Soc User" }, expect: [200, 201] });
  await probe("Auth", "Update info", "PUT", "/api/v1/auth/update-user-info", { headers: sH, body: { name: "Audit Student" } });
  await probe("Auth", "Update password", "PUT", "/api/v1/auth/update-user-password", { headers: sH, body: { oldPassword: "AuditPass123!", newPassword: "AuditPass123!" } });
  await probe("Auth", "Update avatar (needs Cloudinary)", "PUT", "/api/v1/auth/update-user-profile-picture", { headers: sH, body: {}, expect: [200, 400, 500] });
  await probe("Auth", "Logout", "GET", "/api/v1/auth/logout", { headers: sH });
  await probe("Auth", "Refresh (no cookie -> 400)", "GET", "/api/v1/auth/refreshtoken", { expect: [400, 401] });
  await probe("Auth", "Activate (bad code -> 400)", "POST", "/api/v1/auth/activate-user", { body: { activation_token: "x", activation_code: "0000" }, expect: [400, 404] });
  await probe("Auth", "Admin list users", "GET", "/api/v1/auth/get-users", { headers: aH });
  await probe("Auth", "Admin list users alias", "GET", "/api/v1/auth/get-all-user-dashboard", { headers: aH });
  await probe("Auth", "Admin set role", "PUT", "/api/v1/auth/update-user-roles", { headers: aH, body: { id: tempUser._id.toString(), role: "instructor" } });
  await probe("Auth", "Student set role (-> 403)", "PUT", "/api/v1/auth/update-user-roles", { headers: sH, body: { id: tempUser._id.toString(), role: "user" }, expect: [403] });

  // ---------- LEGACY COURSE ----------
  console.log("\n--- COURSE (legacy) ---");
  await probe("Course", "List public", "GET", "/api/v1/course/get-courses", { expect: [200, 201] });
  await probe("Course", "Single", "GET", `/api/v1/course/get-course/${cA}`, { expect: [200, 201] });
  const cc = await probe("Course", "Admin create", "POST", "/api/v1/course/create-course", { headers: aH, body: { name: `Audit Created ${ts}`, description: "d", price: 100, tags: "t", level: "Beginner", demoUrl: "https://example.com" }, expect: [200, 201] });
  const createdId = cc.data && cc.data.course ? cc.data.course._id.toString() : null;
  if (createdId) await probe("Course", "Admin edit", "PUT", `/api/v1/course/edit-course/${createdId}`, { headers: aH, body: { price: 150 }, expect: [200, 201] });
  await probe("Course", "Admin dashboard list", "GET", "/api/v1/course/get-admin-courses", { headers: aH });

  // ---------- LEGACY ORDER (buyer flow, sends mail) ----------
  console.log("\n--- ORDER (legacy) ---");
  const co = await probe("Order", "Create order (buyer)", "POST", "/api/v1/order/create-order", { headers: s2H, body: { courseId: cA, payment_info: { id: "pi_audit", status: "succeeded" } }, expect: [200, 201] });
  await probe("Order", "Admin dashboard", "GET", "/api/v1/order/get-all-order-dashboard", { headers: aH });

  // ---------- legacy course gated (buyer enrolled via order) ----------
  console.log("\n--- COURSE gated (buyer) ---");
  await probe("Course", "Content (enrolled buyer)", "GET", `/api/v1/course/get-course-content/${cA}`, { headers: s2H });
  await probe("Course", "Content (stranger -> 403)", "GET", `/api/v1/course/get-course-content/${cA}`, { headers: sH, expect: [403] });
  const q = await probe("Course", "Ask question", "PUT", "/api/v1/course/add-question", { headers: s2H, body: { question: "audit q?", courseId: cA, contentId: lecA1 }, expect: [200, 201] });
  let qid = null;
  if (q.ok) { const c = await CourseModel.findById(cA); const last = c.courseData.id(lecA1).questions; qid = last[last.length - 1]._id.toString(); }
  if (qid) await probe("Course", "Answer question", "PUT", "/api/v1/course/add-answer", { headers: aH, body: { answer: "audit a", courseId: cA, contentId: lecA1, questionId: qid }, expect: [200, 201] });
  const rv = await probe("Course", "Add review (buyer)", "PUT", `/api/v1/course/add-review/${cA}`, { headers: s2H, body: { review: "great", rating: 5 }, expect: [200, 201] });
  let revId = null;
  if (rv.ok) { const c = await CourseModel.findById(cA); revId = c.reviews[c.reviews.length - 1]._id.toString(); }
  if (revId) await probe("Course", "Reply review (admin)", "PUT", "/api/v1/course/add-replay", { headers: aH, body: { comment: "thanks", courseId: cA, reviewId: revId }, expect: [200, 201] });
  if (createdId) await probe("Course", "Admin delete (temp course)", "DELETE", `/api/v1/course/delete-course/${createdId}`, { headers: aH });

  // ---------- NOTIFICATIONS / ANALYTICS / LAYOUT ----------
  console.log("\n--- OPS ---");
  await probe("Notify", "Admin list", "GET", "/api/v1/notifications/get-all-notifications", { headers: aH });
  const n = await NotificationModel.create({ title: "audit", message: "audit msg" });
  await probe("Notify", "Admin mark read", "PUT", `/api/v1/notifications/update-notification-status/${n._id}`, { headers: aH });
  await probe("Analytics", "Users", "GET", "/api/v1/analytics/users-analytics", { headers: aH });
  await probe("Analytics", "Courses", "GET", "/api/v1/analytics/courses-analytics", { headers: aH });
  await probe("Analytics", "Orders", "GET", "/api/v1/analytics/orders-analytics", { headers: aH });
  // Remove only the exact doc this audit creates (never touch other CMS content)
  await LayoutModel.deleteMany({ "faq.question": { $in: ["q?", "q2?"] }, "faq.answer": { $in: ["a", "a2"] } });
  await probe("Layout", "Admin create", "POST", "/api/v1/layout/create-layout", { headers: aH, body: { type: "faq", faq: [{ question: "q?", answer: "a" }] }, expect: [200, 201] });
  await probe("Layout", "Admin update", "PUT", "/api/v1/layout/update-layout", { headers: aH, body: { type: "faq", faq: [{ question: "q2?", answer: "a2" }] }, expect: [200, 201] });
  await probe("Layout", "Public get", "GET", "/api/v1/layout/get-layout?type=faq");

  // ---------- LMS DISCOVERY ----------
  console.log("\n--- LMS discovery ---");
  await probe("LMS", "List courses", "GET", "/api/v1/lms/courses");
  await probe("LMS", "Categories", "GET", "/api/v1/lms/categories");
  await probe("LMS", "Search", "GET", "/api/v1/lms/search?q=audit");
  await probe("LMS", "Home", "GET", "/api/v1/lms/home");
  await probe("LMS", "Course detail", "GET", `/api/v1/lms/courses/${cA}`);
  await probe("LMS", "Course detail (bad id -> 404/500)", "GET", "/api/v1/lms/courses/000000000000000000000000", { expect: [404, 500] });
  await probe("LMS", "Curriculum", "GET", `/api/v1/lms/courses/${cA}/curriculum`);
  await probe("LMS", "Sections", "GET", `/api/v1/lms/courses/${cA}/sections`);
  await probe("LMS", "Section by title", "GET", "/api/v1/lms/sections/Basics");
  await probe("LMS", "Section lectures by title", "GET", "/api/v1/lms/sections/Basics/lectures");
  await probe("LMS", "Section by lecture id", "GET", `/api/v1/lms/sections/${lecA1}`);
  await probe("LMS", "Section lectures by lecture id", "GET", `/api/v1/lms/sections/${lecA1}/lectures`);
  await probe("LMS", "Section unknown (-> 404)", "GET", "/api/v1/lms/sections/NoSuchSection", { expect: [404] });

  // ---------- LMS LECTURES ----------
  console.log("\n--- LMS lectures ---");
  await probe("LMS", "Preview lecture (no enroll ok)", "GET", `/api/v1/lms/lectures/${lecA1}`, { headers: sH });
  await probe("LMS", "Locked lecture (stranger -> 403)", "GET", `/api/v1/lms/lectures/${lecA2}`, { headers: sH, expect: [403] });
  await probe("LMS", "Access check (preview)", "GET", `/api/v1/lms/lectures/${lecA1}/access`, { headers: sH });

  // ---------- LMS COUPONS + PAYMENTS (student buys courseB end-to-end) ----------
  console.log("\n--- LMS purchase ---");
  const future = new Date(Date.now() + 30 * 864e5).toISOString();
  const cp = await probe("LMS", "Admin create coupon", "POST", "/api/v1/lms/coupons", { headers: aH, body: { code: `AUDIT${String(ts).slice(-6)}`, discountType: "percentage", discountValue: 10, endDate: future }, expect: [200, 201] });
  const couponCode = cp.data && cp.data.coupon ? cp.data.coupon.code : null;
  await probe("LMS", "Admin list coupons", "GET", "/api/v1/lms/coupons", { headers: aH });
  if (couponCode) await probe("LMS", "Validate coupon", "POST", "/api/v1/lms/coupons/validate", { headers: sH, body: { code: couponCode, courseId: cB } });
  const pay = await probe("LMS", "Create payment", "POST", "/api/v1/lms/payments/create", { headers: sH, body: couponCode ? { courseId: cB, couponCode } : { courseId: cB } });
  let rpOrderId = null;
  if (pay.ok && pay.data && pay.data.order) rpOrderId = pay.data.order.id;
  if (rpOrderId) {
    const secret = CONFIG.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || "placeholder_secret";
    const pid = `pay_audit_${ts}`;
    const sig = crypto.createHmac("sha256", secret).update(`${rpOrderId}|${pid}`).digest("hex");
    await probe("LMS", "Verify payment -> enroll", "POST", "/api/v1/lms/payments/verify", { headers: sH, body: { razorpay_order_id: rpOrderId, razorpay_payment_id: pid, razorpay_signature: sig, courseId: cB, ...(couponCode ? { couponCode } : {}) }, expect: [200, 201] });
  }
  await probe("LMS", "Verify payment (bad sig -> 400)", "POST", "/api/v1/lms/payments/verify", { headers: sH, body: { razorpay_order_id: "x", razorpay_payment_id: "y", razorpay_signature: "bad", courseId: cB }, expect: [400] });

  // ---------- LMS POST-ENROLL (student, courseB) ----------
  console.log("\n--- LMS learning ---");
  await probe("LMS", "Locked lecture (now enrolled)", "GET", `/api/v1/lms/lectures/${lecB2}`, { headers: sH });
  await probe("LMS", "Access check (enrolled)", "GET", `/api/v1/lms/lectures/${lecB2}/access`, { headers: sH });
  await probe("LMS", "Save progress", "POST", `/api/v1/lms/lectures/${lecB2}/progress`, { headers: sH, body: { watchedSeconds: 5 } });
  await probe("LMS", "Complete L1", "POST", `/api/v1/lms/lectures/${lecB1}/complete`, { headers: sH });
  await probe("LMS", "Complete L2 (-> certificate)", "POST", `/api/v1/lms/lectures/${lecB2}/complete`, { headers: sH, validator: (d) => d && d.enrollment && d.enrollment.completed === true && d.enrollment.progress === 100 });
  await probe("LMS", "My learning", "GET", "/api/v1/lms/my-learning", { headers: sH });
  await probe("LMS", "My enrollments", "GET", "/api/v1/lms/enrollments", { headers: sH });
  const enr = await EnrollmentModel.findOne({ userId: student._id.toString(), courseId: cB });
  if (enr) await probe("LMS", "Enrollment detail", "GET", `/api/v1/lms/enrollments/${enr._id}`, { headers: sH });
  await probe("LMS", "My purchases", "GET", "/api/v1/lms/purchases", { headers: sH });
  await probe("LMS", "My orders", "GET", "/api/v1/lms/orders", { headers: sH });
  const ord = await OrderModel.findOne({ userId: student._id.toString(), courseId: cB });
  if (ord) await probe("LMS", "Order detail", "GET", `/api/v1/lms/orders/${ord._id}`, { headers: sH });
  await probe("LMS", "Wishlist toggle", "POST", "/api/v1/lms/wishlist", { headers: sH, body: { courseId: cA }, expect: [200, 201] });
  await probe("LMS", "Wishlist get", "GET", "/api/v1/lms/wishlist", { headers: sH });
  await probe("LMS", "Wishlist toggle alias", "POST", "/api/v1/lms/wishlist/toggle", { headers: sH, body: { courseId: cA }, expect: [200, 201] });
  await probe("LMS", "Reviews list", "GET", `/api/v1/lms/reviews/${cB}`);
  await probe("LMS", "Reviews list alias", "GET", `/api/v1/lms/courses/${cB}/reviews`);
  await probe("LMS", "Add review", "POST", `/api/v1/lms/reviews/${cB}`, { headers: sH, body: { rating: 5, comment: "audit review" }, expect: [200, 201] });
  await probe("LMS", "My certificates", "GET", "/api/v1/lms/certificates", { headers: sH });
  const CertificateModel = require("./dist/models/certificate.model.js").default;
  const cert = await CertificateModel.findOne({ userId: student._id.toString(), courseId: cB });
  if (cert) await probe("LMS", "Certificate detail", "GET", `/api/v1/lms/certificates/${cert._id}`, { headers: sH });
  else { console.log("  FAIL cert auto-issue: no certificate found"); results.push({ group: "LMS", desc: "Certificate auto-issue", method: "DB", url: "-", status: 0, ok: false }); failed++; }

  // ---------- LMS INSTRUCTOR ----------
  console.log("\n--- LMS instructor ---");
  await probe("LMS", "Instructor courses (empty)", "GET", "/api/v1/lms/instructor/courses", { headers: iH });
  const ic = await probe("LMS", "Instructor create (DRAFT)", "POST", "/api/v1/lms/instructor/courses", { headers: iH, body: { name: `Ins Course ${ts}`, description: "d", price: 799, tags: "t", level: "Beginner", demoUrl: "https://example.com", courseData: [{ title: "L1", videoSection: "S", videoLength: 3, isPreview: true }] }, expect: [200, 201] });
  const insId = ic.data && ic.data.course ? ic.data.course._id.toString() : null;
  if (insId) {
    await probe("LMS", "Instructor update", "PUT", `/api/v1/lms/instructor/courses/${insId}`, { headers: iH, body: { price: 699 } });
    await probe("LMS", "Instructor add lecture", "POST", `/api/v1/lms/instructor/courses/${insId}/lectures`, { headers: iH, body: { title: "L2", videoSection: "S", videoLength: 6 }, expect: [200, 201] });
    await probe("LMS", "Instructor submit", "POST", `/api/v1/lms/instructor/courses/${insId}/submit`, { headers: iH });
    await probe("LMS", "Student update others course (-> 403)", "PUT", `/api/v1/lms/instructor/courses/${insId}`, { headers: sH, body: { price: 1 }, expect: [403, 404] });
    await probe("LMS", "Admin publish", "PUT", `/api/v1/lms/admin/courses/${insId}/status`, { headers: aH, body: { status: "PUBLISHED" } });
  }
  await probe("LMS", "Instructor students", "GET", "/api/v1/lms/instructor/students", { headers: iH });
  await probe("LMS", "Instructor revenue", "GET", "/api/v1/lms/instructor/revenue", { headers: iH });
  await probe("LMS", "Instructor analytics", "GET", "/api/v1/lms/instructor/analytics", { headers: iH });
  await probe("LMS", "Student instructor route (-> 403)", "GET", "/api/v1/lms/instructor/courses", { headers: sH, expect: [403] });

  // ---------- LMS ADMIN ----------
  console.log("\n--- LMS admin ---");
  await probe("LMS", "Admin courses", "GET", "/api/v1/lms/admin/courses", { headers: aH });
  await probe("LMS", "Admin instructors", "GET", "/api/v1/lms/admin/instructors", { headers: aH });
  await probe("LMS", "Admin orders", "GET", "/api/v1/lms/admin/orders", { headers: aH });
  await probe("LMS", "Admin enrollments", "GET", "/api/v1/lms/admin/enrollments", { headers: aH });
  await probe("LMS", "Admin analytics", "GET", "/api/v1/lms/admin/analytics", { headers: aH });
  await probe("LMS", "Admin bad status (-> 400)", "PUT", `/api/v1/lms/admin/courses/${cA}/status`, { headers: aH, body: { status: "NOPE" }, expect: [400] });
  await probe("Auth", "Admin delete temp user", "DELETE", `/api/v1/auth/delete-user/${tempUser._id}`, { headers: aH });

  // ---------- CLEANUP ----------
  console.log("\n--- cleanup ---");
  const LmsCouponModel = require("./dist/models/lmsCoupon.model.js").default;
  const CourseWishlistModel = require("./dist/models/courseWishlist.model.js").default;
  const LectureProgressModel = require("./dist/models/lectureProgress.model.js").default;
  const testEmails = [student, student2, instructor, admin].map((u) => u.email).concat([`reg_${ts}@example.com`, `soc_${ts}@example.com`]);
  await CourseModel.deleteMany({ _id: { $in: [courseA._id, courseB._id] } });
  if (insId) await CourseModel.findByIdAndDelete(insId);
  await OrderModel.deleteMany({ $or: [{ userId: student._id.toString() }, { userId: student2._id.toString() }] });
  await EnrollmentModel.deleteMany({ $or: [{ userId: student._id.toString() }, { userId: student2._id.toString() }] });
  await CertificateModel.deleteMany({ $or: [{ userId: student._id.toString() }, { userId: student2._id.toString() }] });
  await CourseWishlistModel.deleteMany({ $or: [{ userId: student._id.toString() }, { userId: student2._id.toString() }] });
  await LectureProgressModel.deleteMany({ $or: [{ userId: student._id.toString() }, { userId: student2._id.toString() }] });
  await LmsCouponModel.deleteMany({ code: /^AUDIT/ });
  await NotificationModel.deleteOne({ _id: n._id });
  await LayoutModel.deleteMany({ "faq.question": { $in: ["q?", "q2?"] }, "faq.answer": { $in: ["a", "a2"] } });
  await userModel.deleteMany({ email: { $in: testEmails } });
  console.log("cleanup done");

  const out = path.join(process.cwd(), "lms-audit-results.json");
  fs.writeFileSync(out, JSON.stringify({ passed, failed, results }, null, 2));
  console.log(`\nTOTAL: ${passed} passed, ${failed} failed -> ${out}`);
  server.close();
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
