const http = require("http");

async function runTests() {
  console.log("\n🚀 Starting LMS API Test Suite...\n");

  const { app } = require("./dist/app.js");

  const server = http.createServer(app);
  const PORT = 8089;

  await new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`📡 Local Test Server running on http://localhost:${PORT}\n`);
      resolve(null);
    });
    server.on("error", reject);
  });

  const baseUrl = `http://localhost:${PORT}`;
  let passed = 0;
  let failed = 0;

  async function test(name, path, options = {}) {
    const { expectedStatus = 200, validator } = options;
    try {
      const res = await fetch(`${baseUrl}${path}`);
      const json = await res.json().catch(() => null);

      const statusMatch = Array.isArray(expectedStatus)
        ? expectedStatus.includes(res.status)
        : res.status === expectedStatus;

      if (!statusMatch) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Expected status ${expectedStatus}, got ${res.status}`);
        if (json) console.log(`   Response:`, json);
        failed++;
        return;
      }

      if (validator && !validator(json, res)) {
        console.log(`❌ FAIL: ${name} (Data validation failed)`);
        if (json) console.log(`   Response:`, json);
        failed++;
        return;
      }

      console.log(`✅ PASS: ${name} (${path} -> ${res.status})`);
      passed++;
    } catch (err) {
      console.log(`❌ ERROR: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test("System Health Check", "/test", {
    expectedStatus: 200,
    validator: (d) => d && d.success === true,
  });

  // 2. Welcome Index
  await test("Welcome Route & API Directory", "/", {
    expectedStatus: 200,
    validator: (d) =>
      d &&
      d.endpoints &&
      d.endpoints.auth === "/api/v1/auth" &&
      d.endpoints.lms === "/api/v1/lms",
  });

  // 3. OpenAPI Documentation JSON
  await test("Swagger OpenAPI JSON Spec", "/api-docs.json", {
    expectedStatus: 200,
    validator: (d) => d && d.openapi && d.info,
  });

  // 4. LMS Public Endpoints
  await test("LMS List Courses", "/api/v1/lms/courses");
  await test("LMS Categories", "/api/v1/lms/categories");
  await test("LMS Search", "/api/v1/lms/search?q=test");
  await test("LMS Home", "/api/v1/lms/home");

  // 5. Auth Endpoints
  await test("Auth Register", "/api/v1/auth/register", {
    expectedStatus: [201, 400],
  });
  await test("Auth Login (invalid)", "/api/v1/auth/login", {
    expectedStatus: [400, 401],
    body: { email: "invalid@test.com", password: "wrong" },
  });
  await test("Auth Me (no token -> 401)", "/api/v1/auth/me", {
    expectedStatus: [401],
  });

  // 6. Protected Route Guards
  await test("LMS Purchases (no token -> 401)", "/api/v1/lms/purchases", {
    expectedStatus: [401],
  });
  await test("LMS Enrollments (no token -> 401)", "/api/v1/lms/enrollments", {
    expectedStatus: [401],
  });

  // 7. Legacy Course Endpoints
  await test("Course List", "/api/v1/course/get-courses");
  await test("Course Single (bad id)", "/api/v1/course/get-course/000000000000000000000000", {
    expectedStatus: [200, 404],
  });

  // 8. 404 Route Handler
  await test("404 Not Found Handler", "/api/v1/non-existent-route", {
    expectedStatus: [404],
  });

  server.close(() => {
    console.log("\n==================================================");
    console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
    console.log("==================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  });
}

runTests().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
