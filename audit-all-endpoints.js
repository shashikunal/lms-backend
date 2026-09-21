const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

async function runAudit() {
  console.log("===============================================================================");
  console.log("🔍 COMPREHENSIVE ENDPOINT AUDIT & VERIFICATION SUITE");
  console.log("===============================================================================\n");

  const { app } = require("./dist/app.js");
  const { CONFIG } = require("./dist/config/index.js");
  const userModel = require("./dist/models/user.model.js").default;

  const PORT = 8092;
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`[SERVER] Audit Test Server listening on http://localhost:${PORT}`);
      resolve(null);
    });
    server.on("error", reject);
  });

  const baseUrl = `http://localhost:${PORT}`;
  let passed = 0;
  let failed = 0;
  const auditReport = [];

  async function testEndpoint(category, desc, method, path, { headers = {}, body = null, expectedStatuses = [200], validator = null } = {}) {
    try {
      const opts = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };
      if (body) {
        opts.body = JSON.stringify(body);
      }

      const res = await fetch(`${baseUrl}${path}`, opts);
      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      const statusMatches = expectedStatuses.includes(res.status);
      const valid = validator ? validator(data, res) : true;

      if (statusMatches && valid) {
        passed++;
        console.log(`  ✅ [${res.status}] ${method.padEnd(6)} ${path} -> ${desc}`);
        auditReport.push({ category, desc, method, path, status: res.status, ok: true });
        return { res, data, ok: true };
      } else {
        failed++;
        console.log(`  ❌ [${res.status}] ${method.padEnd(6)} ${path} -> ${desc}`);
        console.log(`     Expected: ${expectedStatuses.join(" or ")}, got: ${res.status}`);
        if (data && typeof data === "object") {
          console.log(`     Response: ${JSON.stringify(data).slice(0, 160)}...`);
        }
        auditReport.push({ category, desc, method, path, status: res.status, ok: false, error: data });
        return { res, data, ok: false };
      }
    } catch (err) {
      failed++;
      console.log(`  ❌ [ERR] ${method.padEnd(6)} ${path} -> ${desc}: ${err.message}`);
      auditReport.push({ category, desc, method, path, status: 0, ok: false, error: err.message });
      return { res: null, data: null, ok: false };
    }
  }

  // Connect DB explicitly before testing DB queries
  const connectDb = require("./dist/utils/db.js").default;
  await connectDb();

  // 1. Setup Test Users (Regular User & Admin User)
  const timestamp = Date.now();
  const regularEmail = `audit_user_${timestamp}@example.com`;
  const adminEmail = `audit_admin_${timestamp}@example.com`;

  let regularUser = await userModel.findOne({ email: regularEmail });
  if (!regularUser) {
    regularUser = await userModel.create({
      name: "Audit Regular User",
      email: regularEmail,
      password: "AuditPassword123!",
      role: "user",
      isVerified: true,
    });
  }

  let adminUser = await userModel.findOne({ email: adminEmail });
  if (!adminUser) {
    adminUser = await userModel.create({
      name: "Audit Admin User",
      email: adminEmail,
      password: "AuditAdminPassword123!",
      role: "admin",
      isVerified: true,
    });
  }

  const userToken = jwt.sign({ id: regularUser._id.toString() }, CONFIG.ACCESS_TOKEN, { expiresIn: "1h" });
  const adminToken = jwt.sign({ id: adminUser._id.toString() }, CONFIG.ACCESS_TOKEN, { expiresIn: "1h" });

  const userHeaders = { Authorization: `Bearer ${userToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  console.log(`[AUTH] Test Regular User ID: ${regularUser._id}`);
  console.log(`[AUTH] Test Admin User ID:   ${adminUser._id}\n`);

  // Shared variables across tests
  let testCategoryId = null;
  let testProductId = null;
  let testAddressId = null;
  let testCartItemId = null;
  let testCouponCode = `AUDIT${Math.floor(Math.random() * 9000 + 1000)}`;
  let testCouponId = null;
  let testOrderId = null;
  let testReviewId = null;

  // -------------------------------------------------------------
  // GROUP 1: SYSTEM & SPECIFICATION ENDPOINTS
  // -------------------------------------------------------------
  console.log("--- [Group 1: System & API Documentation Endpoints] ---");
  await testEndpoint("System", "Health Check", "GET", "/test", { expectedStatuses: [200] });
  await testEndpoint("System", "Welcome API Navigation Directory", "GET", "/", { expectedStatuses: [200] });
  await testEndpoint("System", "Swagger OpenAPI JSON Spec", "GET", "/api-docs.json", {
    expectedStatuses: [200],
    validator: (d) => d && d.openapi === "3.0.3" && d.paths && Object.keys(d.paths).length > 80,
  });
  await testEndpoint("System", "Swagger UI HTML Documentation", "GET", "/api-docs", { expectedStatuses: [200] });
  await testEndpoint("System", "Swagger UI HTML Alias Route", "GET", "/docs", { expectedStatuses: [200] });

  // -------------------------------------------------------------
  // GROUP 2: AUTHENTICATION & USER MANAGEMENT
  // -------------------------------------------------------------
  console.log("\n--- [Group 2: Authentication & User Management] ---");
  // Register endpoint
  await testEndpoint("Auth", "User Registration (Sends Activation Email)", "POST", "/api/v1/auth/register", {
    body: {
      name: "New Registrant",
      email: `reg_${timestamp}@example.com`,
      password: "Password123!",
    },
    expectedStatuses: [200, 201],
  });

  // Get current user profile (/me)
  await testEndpoint("Auth", "Get My Profile (/me)", "GET", "/api/v1/auth/me", {
    headers: userHeaders,
    expectedStatuses: [200],
    validator: (d) => d && d.user && d.user.email === regularEmail,
  });

  // Update user info
  await testEndpoint("Auth", "Update User Profile Info", "PUT", "/api/v1/auth/update-user-info", {
    headers: userHeaders,
    body: { name: "Audit User Updated", email: regularEmail },
    expectedStatuses: [200],
  });

  // Admin get users
  await testEndpoint("Auth", "Admin: Get All Registered Users", "GET", "/api/v1/auth/get-users", {
    headers: adminHeaders,
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.users),
  });

  // Logout
  await testEndpoint("Auth", "User Logout", "GET", "/api/v1/auth/logout", {
    headers: userHeaders,
    expectedStatuses: [200],
  });

  // -------------------------------------------------------------
  // GROUP 3: LMS COURSES & CONTENT
  // -------------------------------------------------------------
  console.log("\n--- [Group 3: LMS Course Management] ---");
  await testEndpoint("LMS", "Public: Get All Published Courses", "GET", "/api/v1/course/get-courses", {
    expectedStatuses: [200, 201],
    validator: (d) => d && Array.isArray(d.courses),
  });
  await testEndpoint("LMS", "Admin: Get Master Course Management List", "GET", "/api/v1/course/get-admin-courses", {
    headers: adminHeaders,
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.courses),
  });

  // -------------------------------------------------------------
  // GROUP 4: LMS LAYOUT & DYNAMIC HOMEPAGE
  // -------------------------------------------------------------
  console.log("\n--- [Group 4: LMS Dynamic Layout Config] ---");
  await testEndpoint("Layout", "Get Layout: Banner", "GET", "/api/v1/layout/get-layout?type=Banner", {
    expectedStatuses: [200, 400, 404],
  });
  await testEndpoint("Layout", "Get Layout: FAQ", "GET", "/api/v1/layout/get-layout?type=FAQ", {
    expectedStatuses: [200, 400, 404],
  });
  await testEndpoint("Layout", "Get Layout: Categories", "GET", "/api/v1/layout/get-layout?type=Categories", {
    expectedStatuses: [200, 400, 404],
  });

  // -------------------------------------------------------------
  // GROUP 5: LMS ANALYTICS & NOTIFICATIONS
  // -------------------------------------------------------------
  console.log("\n--- [Group 5: Admin Analytics & Notifications] ---");
  await testEndpoint("Analytics", "Admin: 12-Month User Analytics", "GET", "/api/v1/analytics/users-analytics", {
    headers: adminHeaders,
    expectedStatuses: [200],
  });
  await testEndpoint("Analytics", "Admin: Courses Analytics", "GET", "/api/v1/analytics/courses-analytics", {
    headers: adminHeaders,
    expectedStatuses: [200],
  });
  await testEndpoint("Analytics", "Admin: Orders Analytics", "GET", "/api/v1/analytics/orders-analytics", {
    headers: adminHeaders,
    expectedStatuses: [200],
  });
  await testEndpoint("Notifications", "Admin: Get All In-App Notifications", "GET", "/api/v1/notifications/get-all-notifications", {
    headers: adminHeaders,
    expectedStatuses: [200],
  });

  // -------------------------------------------------------------
  // GROUP 6: E-COMMERCE CATEGORIES & BRANDS
  // -------------------------------------------------------------
  console.log("\n--- [Group 6: E-Commerce Categories & Brands] ---");
  await testEndpoint("Catalog", "Public: Get All Categories", "GET", "/api/v1/category/all", {
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.categories),
  });

  await testEndpoint("Catalog", "Public: Get All Brands", "GET", "/api/v1/category/brands/all", {
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.brands),
  });

  // Admin Create Category
  const createCatRes = await testEndpoint("Catalog", "Admin: Create Category", "POST", "/api/v1/category/create", {
    headers: adminHeaders,
    body: {
      name: `Audit Electronics ${timestamp}`,
      description: "Consumer tech and accessories for audit",
    },
    expectedStatuses: [201],
  });
  if (createCatRes.ok && createCatRes.data && createCatRes.data.category) {
    testCategoryId = createCatRes.data.category._id;
  }

  // Get Single Category
  if (testCategoryId) {
    await testEndpoint("Catalog", "Public: Get Single Category by ID", "GET", `/api/v1/category/single/${testCategoryId}`, {
      expectedStatuses: [200],
    });
    await testEndpoint("Catalog", "Admin: Update Category", "PUT", `/api/v1/category/update/${testCategoryId}`, {
      headers: adminHeaders,
      body: { description: "Updated audit category description" },
      expectedStatuses: [200],
    });
  }

  // Admin Create Brand
  await testEndpoint("Catalog", "Admin: Create Brand", "POST", "/api/v1/category/brand/create", {
    headers: adminHeaders,
    body: {
      name: `AuditBrand ${timestamp}`,
      description: "High performance audio and smart gear",
    },
    expectedStatuses: [201],
  });

  // -------------------------------------------------------------
  // GROUP 7: E-COMMERCE PRODUCTS CATALOG
  // -------------------------------------------------------------
  console.log("\n--- [Group 7: E-Commerce Products Catalog] ---");
  await testEndpoint("Products", "Public: Get Products List (Search & Filter)", "GET", "/api/v1/product/all?keyword=test&sort=newest", {
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.products),
  });

  await testEndpoint("Products", "Public: Get Featured Products", "GET", "/api/v1/product/featured", {
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.products),
  });

  // Admin Create Product
  const createProdRes = await testEndpoint("Products", "Admin: Create Product", "POST", "/api/v1/product/create", {
    headers: adminHeaders,
    body: {
      title: `Audit Studio Headphones ${timestamp}`,
      description: "High fidelity noise-canceling headphones for verification",
      price: 199.99,
      originalPrice: 249.99,
      stock: 50,
      sku: `SKU-AUDIT-${timestamp}`,
      category: testCategoryId,
      tags: ["audio", "bluetooth", "wireless"],
      isFeatured: true,
    },
    expectedStatuses: [201],
  });
  if (createProdRes.ok && createProdRes.data && createProdRes.data.product) {
    testProductId = createProdRes.data.product._id;
  }

  // Get Single Product & Related
  if (testProductId) {
    await testEndpoint("Products", "Public: Get Single Product by ID", "GET", `/api/v1/product/single/${testProductId}`, {
      expectedStatuses: [200],
    });
    await testEndpoint("Products", "Public: Get Related Products", "GET", `/api/v1/product/related/${testProductId}`, {
      expectedStatuses: [200],
      validator: (d) => d && Array.isArray(d.products),
    });
    await testEndpoint("Products", "Admin: Update Product", "PUT", `/api/v1/product/update/${testProductId}`, {
      headers: adminHeaders,
      body: { price: 189.99, stock: 45 },
      expectedStatuses: [200],
    });
  }

  // -------------------------------------------------------------
  // GROUP 8: ADDRESS BOOK
  // -------------------------------------------------------------
  console.log("\n--- [Group 8: Customer Address Book] ---");
  const addAddrRes = await testEndpoint("Address", "Auth: Add Shipping Address", "POST", "/api/v1/address/add", {
    headers: userHeaders,
    body: {
      fullName: "Audit Customer",
      phoneNumber: "+1 555-0199",
      street: "123 Technology Drive",
      city: "San Jose",
      state: "CA",
      postalCode: "95110",
      country: "United States",
      isDefault: true,
      addressType: "Home",
    },
    expectedStatuses: [201],
  });
  if (addAddrRes.ok && addAddrRes.data && addAddrRes.data.address) {
    testAddressId = addAddrRes.data.address._id;
  }

  await testEndpoint("Address", "Auth: Get My Saved Addresses", "GET", "/api/v1/address/my-addresses", {
    headers: userHeaders,
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.addresses),
  });

  if (testAddressId) {
    await testEndpoint("Address", "Auth: Update Address", "PUT", `/api/v1/address/update/${testAddressId}`, {
      headers: userHeaders,
      body: { street: "456 Innovation Parkway" },
      expectedStatuses: [200],
    });
    await testEndpoint("Address", "Auth: Set Default Address", "PUT", `/api/v1/address/set-default/${testAddressId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }

  // -------------------------------------------------------------
  // GROUP 9: SHOPPING CART
  // -------------------------------------------------------------
  console.log("\n--- [Group 9: Shopping Cart State Machine] ---");
  await testEndpoint("Cart", "Auth: Get User Shopping Cart", "GET", "/api/v1/cart", {
    headers: userHeaders,
    expectedStatuses: [200],
  });

  if (testProductId) {
    const addCartRes = await testEndpoint("Cart", "Auth: Add Product to Cart", "POST", "/api/v1/cart/add", {
      headers: userHeaders,
      body: { productId: testProductId, quantity: 2 },
      expectedStatuses: [200],
    });
    if (addCartRes.ok && addCartRes.data && addCartRes.data.cart && addCartRes.data.cart.items.length > 0) {
      testCartItemId = addCartRes.data.cart.items[0]._id;
    }

    if (testCartItemId) {
      await testEndpoint("Cart", "Auth: Update Cart Item Quantity", "PUT", "/api/v1/cart/update-quantity", {
        headers: userHeaders,
        body: { itemId: testCartItemId, quantity: 3 },
        expectedStatuses: [200],
      });
    }

    // Merge guest cart
    await testEndpoint("Cart", "Auth: Merge Guest Cart", "POST", "/api/v1/cart/merge", {
      headers: userHeaders,
      body: { guestItems: [{ productId: testProductId, quantity: 1 }] },
      expectedStatuses: [200],
    });
  }

  // -------------------------------------------------------------
  // GROUP 10: WISHLIST
  // -------------------------------------------------------------
  console.log("\n--- [Group 10: Wishlist Management] ---");
  await testEndpoint("Wishlist", "Auth: Get User Wishlist", "GET", "/api/v1/wishlist", {
    headers: userHeaders,
    expectedStatuses: [200],
  });

  if (testProductId) {
    await testEndpoint("Wishlist", "Auth: Toggle Item In Wishlist (Add)", "POST", "/api/v1/wishlist/toggle", {
      headers: userHeaders,
      body: { productId: testProductId },
      expectedStatuses: [200],
    });

    await testEndpoint("Wishlist", "Auth: Move Wishlist Item to Cart", "POST", `/api/v1/wishlist/move-to-cart/${testProductId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }

  // -------------------------------------------------------------
  // GROUP 11: COUPONS & DISCOUNTS
  // -------------------------------------------------------------
  console.log("\n--- [Group 11: Coupons & Promotional Discounts] ---");
  const createCpnRes = await testEndpoint("Coupon", "Admin: Create Promo Coupon", "POST", "/api/v1/coupon/create", {
    headers: adminHeaders,
    body: {
      code: testCouponCode,
      discountType: "percentage",
      discountValue: 15,
      minPurchaseAmount: 50,
      maxDiscountAmount: 30,
      expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    expectedStatuses: [201],
  });
  if (createCpnRes.ok && createCpnRes.data && createCpnRes.data.coupon) {
    testCouponId = createCpnRes.data.coupon._id;
  }

  await testEndpoint("Coupon", "Admin: Get All Coupons", "GET", "/api/v1/coupon/all", {
    headers: adminHeaders,
    expectedStatuses: [200],
  });

  await testEndpoint("Coupon", "Auth: Apply Valid Coupon to Cart", "POST", "/api/v1/coupon/apply", {
    headers: userHeaders,
    body: { code: testCouponCode },
    expectedStatuses: [200],
  });

  await testEndpoint("Coupon", "Auth: Remove Coupon from Cart", "POST", "/api/v1/coupon/remove", {
    headers: userHeaders,
    expectedStatuses: [200],
  });

  // -------------------------------------------------------------
  // GROUP 12: PAYMENTS (RAZORPAY)
  // -------------------------------------------------------------
  console.log("\n--- [Group 12: Payments & Razorpay Integration] ---");
  await testEndpoint("Payment", "Public: Get Razorpay Client Key", "GET", "/api/v1/payment/razorpay-key", {
    expectedStatuses: [200],
    validator: (d) => d && d.success === true && d.key !== undefined,
  });

  await testEndpoint("Payment", "Auth: Create Razorpay Order", "POST", "/api/v1/payment/razorpay-order", {
    headers: userHeaders,
    body: { amount: 189.99, currency: "INR", receipt: `rcpt_${timestamp}` },
    expectedStatuses: [200],
    validator: (d) => d && d.success === true && d.order && d.order.id,
  });

  await testEndpoint("Payment", "Auth: Verify Signature with invalid hash (Validation check)", "POST", "/api/v1/payment/verify", {
    headers: userHeaders,
    body: {
      razorpay_order_id: "order_mock123",
      razorpay_payment_id: "pay_mock123",
      razorpay_signature: "invalid_signature_hash",
    },
    expectedStatuses: [400], // Must reject fraudulent signature
  });

  await testEndpoint("Payment", "Public: Razorpay Webhook Missing Signature (Validation check)", "POST", "/api/v1/payment/webhook", {
    body: { event: "payment.captured" },
    expectedStatuses: [400],
  });

  // -------------------------------------------------------------
  // GROUP 13: E-COMMERCE ORDERS
  // -------------------------------------------------------------
  console.log("\n--- [Group 13: Orders & Fulfillment] ---");
  if (testAddressId) {
    const createOrderRes = await testEndpoint("Orders", "Auth: Create Order (COD)", "POST", "/api/v1/ecommerce/order/create", {
      headers: userHeaders,
      body: {
        shippingAddressId: testAddressId,
        paymentMethod: "COD",
      },
      expectedStatuses: [201],
    });
    if (createOrderRes.ok && createOrderRes.data && createOrderRes.data.order) {
      testOrderId = createOrderRes.data.order._id;
    }
  }

  await testEndpoint("Orders", "Auth: Get My Orders List", "GET", "/api/v1/ecommerce/order/my-orders", {
    headers: userHeaders,
    expectedStatuses: [200],
    validator: (d) => d && Array.isArray(d.orders),
  });

  if (testOrderId) {
    await testEndpoint("Orders", "Auth: Get Single Order Details", "GET", `/api/v1/ecommerce/order/single/${testOrderId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });

    await testEndpoint("Orders", "Auth: Cancel Order", "PUT", `/api/v1/ecommerce/order/cancel/${testOrderId}`, {
      headers: userHeaders,
      body: { reason: "Audit automated testing cancellation" },
      expectedStatuses: [200],
    });

    await testEndpoint("Orders", "Admin: Get All Orders", "GET", "/api/v1/ecommerce/order/admin/all", {
      headers: adminHeaders,
      expectedStatuses: [200],
      validator: (d) => d && Array.isArray(d.orders),
    });

    await testEndpoint("Orders", "Admin: Update Order Status", "PUT", `/api/v1/ecommerce/order/admin/status/${testOrderId}`, {
      headers: adminHeaders,
      body: { orderStatus: "Shipped" },
      expectedStatuses: [200],
    });
  }

  // -------------------------------------------------------------
  // GROUP 14: PRODUCT REVIEWS
  // -------------------------------------------------------------
  console.log("\n--- [Group 14: Product Reviews & Ratings] ---");
  if (testProductId) {
    await testEndpoint("Reviews", "Public: Get Reviews for Product", "GET", `/api/v1/product-reviews/product/${testProductId}`, {
      expectedStatuses: [200],
      validator: (d) => d && Array.isArray(d.reviews),
    });

    const addRevRes = await testEndpoint("Reviews", "Auth: Submit Product Review", "POST", "/api/v1/product-reviews/add", {
      headers: userHeaders,
      body: {
        productId: testProductId,
        rating: 5,
        title: "Spectacular Audio Quality",
        comment: "Tested during audit suite. Crisp highs and punchy bass.",
      },
      expectedStatuses: [201],
    });
    if (addRevRes.ok && addRevRes.data && addRevRes.data.review) {
      testReviewId = addRevRes.data.review._id;
    }

    if (testReviewId) {
      await testEndpoint("Reviews", "Auth: Vote Review Helpful", "PUT", `/api/v1/product-reviews/helpful/${testReviewId}`, {
        headers: userHeaders,
        expectedStatuses: [200],
      });
    }
  }

  // -------------------------------------------------------------
  // GROUP 15: AUTH SECURITY GUARDS (UNAUTHORIZED TESTS)
  // -------------------------------------------------------------
  console.log("\n--- [Group 15: Security Guard Enforcement] ---");
  await testEndpoint("Security", "Block Cart without Auth Header", "GET", "/api/v1/cart", {
    expectedStatuses: [401],
  });
  await testEndpoint("Security", "Block Address Book without Auth", "GET", "/api/v1/address/my-addresses", {
    expectedStatuses: [401],
  });
  await testEndpoint("Security", "Block Order Creation without Auth", "POST", "/api/v1/ecommerce/order/create", {
    body: { paymentMethod: "COD" },
    expectedStatuses: [401],
  });
  await testEndpoint("Security", "Block Admin Order List from regular user", "GET", "/api/v1/ecommerce/order/admin/all", {
    headers: userHeaders,
    expectedStatuses: [403], // Forbidden
  });
  await testEndpoint("Security", "Block Admin Category Create from regular user", "POST", "/api/v1/category/create", {
    headers: userHeaders,
    body: { name: "Illegal Category" },
    expectedStatuses: [403], // Forbidden
  });

  // -------------------------------------------------------------
  // GROUP 16: TEARDOWN & CLEANUP
  // -------------------------------------------------------------
  console.log("\n--- [Group 16: Automated Teardown & Resource Cleanup] ---");
  if (testReviewId) {
    await testEndpoint("Cleanup", "Delete Test Review", "DELETE", `/api/v1/product-reviews/delete/${testReviewId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }
  if (testAddressId) {
    await testEndpoint("Cleanup", "Delete Test Address", "DELETE", `/api/v1/address/delete/${testAddressId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }
  if (testCouponId) {
    await testEndpoint("Cleanup", "Delete Test Coupon", "DELETE", `/api/v1/coupon/delete/${testCouponId}`, {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }
  if (testProductId) {
    await testEndpoint("Cleanup", "Delete Test Product", "DELETE", `/api/v1/product/delete/${testProductId}`, {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }
  if (testCategoryId) {
    await testEndpoint("Cleanup", "Delete Test Category", "DELETE", `/api/v1/category/delete/${testCategoryId}`, {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }

  // Close Server and MongoDB
  server.close(() => {
    console.log("\n===============================================================================");
    console.log(`🏁 AUDIT COMPLETED: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
    console.log("===============================================================================\n");

    const fs = require("fs");
    fs.writeFileSync(
      "audit-results.json",
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          passed,
          failed,
          total: passed + failed,
          report: auditReport,
        },
        null,
        2
      )
    );
    console.log("📝 Detailed audit report saved to audit-results.json\n");
    process.exit(failed > 0 ? 1 : 0);
  });
}

runAudit().catch((err) => {
  console.error("Audit crashed:", err);
  process.exit(1);
});
