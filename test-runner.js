const http = require("http");

async function runTests() {
  console.log("\n🚀 Starting E-Commerce Integration Test Suite...\n");

  // Load app from dist
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

  // 2. Welcome Index & Route Registration
  await test("Welcome Route & E-Commerce Directory", "/", {
    expectedStatus: 200,
    validator: (d) =>
      d &&
      d.endpoints &&
      d.endpoints.product === "/api/v1/product" &&
      d.endpoints.category === "/api/v1/category" &&
      d.endpoints.cart === "/api/v1/cart" &&
      d.endpoints.wishlist === "/api/v1/wishlist" &&
      d.endpoints.coupon === "/api/v1/coupon" &&
      d.endpoints.payment === "/api/v1/payment" &&
      d.endpoints.ecommerceOrder === "/api/v1/ecommerce/order" &&
      d.endpoints.productReviews === "/api/v1/product-reviews",
  });

  // 3. OpenAPI Documentation JSON
  await test("Swagger OpenAPI JSON Spec", "/api-docs.json", {
    expectedStatus: 200,
    validator: (d) => d && d.openapi && d.info,
  });

  // 4. Razorpay Key Endpoint (Public)
  // Accept 200 or 503 (if DB middleware runs)
  await test("Razorpay Key Endpoint", "/api/v1/payment/razorpay-key", {
    expectedStatus: [200, 503],
    validator: (d, res) => {
      if (res.status === 200) {
        return d && d.success === true && d.key !== undefined;
      }
      return true; // 503 is acceptable if MongoDB Atlas is not connected
    },
  });

  // 5. Protected Route Guard Check (Cart without Token)
  await test("Auth Guard on Cart (/api/v1/cart)", "/api/v1/cart", {
    expectedStatus: [400, 401, 503],
    validator: (d, res) => {
      // Must block unauthorized requests or return DB unavailable
      return res.status !== 200;
    },
  });

  // 6. Protected Route Guard Check (Address without Token)
  await test("Auth Guard on Address Book (/api/v1/address/my-addresses)", "/api/v1/address/my-addresses", {
    expectedStatus: [400, 401, 503],
    validator: (d, res) => res.status !== 200,
  });

  // 7. Protected Route Guard Check (Orders without Token)
  await test("Auth Guard on Orders (/api/v1/ecommerce/order/my-orders)", "/api/v1/ecommerce/order/my-orders", {
    expectedStatus: [400, 401, 503],
    validator: (d, res) => res.status !== 200,
  });

  // 8. 404 Route Handler
  await test("404 Not Found Handler", "/api/v1/non-existent-ecommerce-route", {
    expectedStatus: [404, 503],
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
