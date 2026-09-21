const http = require("http");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

async function run() {
  console.log("===============================================================");
  console.log("🔍 COMPREHENSIVE E-COMMERCE API VERIFICATION SUITE");
  console.log("===============================================================\n");

  const { app } = require("./dist/app.js");
  const { CONFIG } = require("./dist/config/index.js");
  const userModel = require("./dist/models/user.model.js").default;

  const PORT = 8099;
  const server = http.createServer(app);

  await new Promise((resolve, reject) => {
    server.listen(PORT, () => {
      console.log(`[INIT] Test Server listening on http://localhost:${PORT}`);
      resolve(null);
    });
    server.on("error", reject);
  });

  const baseUrl = `http://localhost:${PORT}`;

  let passed = 0;
  let failed = 0;
  const results = [];

  async function callApi(desc, method, path, { headers = {}, body = null, expectedStatuses = [200] } = {}) {
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

      const isPass = expectedStatuses.includes(res.status);
      if (isPass) {
        passed++;
        console.log(`  ✅ [${res.status}] ${method.padEnd(6)} ${path} -> ${desc}`);
        results.push({ desc, method, path, status: res.status, ok: true, data });
        return { res, data, ok: true };
      } else {
        failed++;
        console.log(`  ❌ [${res.status}] ${method.padEnd(6)} ${path} -> ${desc} (Expected: ${expectedStatuses.join("/")})`);
        console.log(`     Error detail:`, typeof data === "object" ? JSON.stringify(data) : data.slice(0, 150));
        results.push({ desc, method, path, status: res.status, ok: false, data });
        return { res, data, ok: false };
      }
    } catch (err) {
      failed++;
      console.log(`  ❌ [ERR] ${method.padEnd(6)} ${path} -> ${desc}: ${err.message}`);
      results.push({ desc, method, path, status: 0, ok: false, error: err.message });
      return { ok: false, error: err.message };
    }
  }

  // 1. Check DB Connection
  console.log("\n--- [Phase 1: DB & System Health] ---");
  await callApi("System Health Check", "GET", "/test", { expectedStatuses: [200] });
  await callApi("Welcome & Service Directory", "GET", "/", { expectedStatuses: [200] });
  await callApi("OpenAPI / Swagger JSON", "GET", "/api-docs.json", { expectedStatuses: [200] });
  await callApi("Swagger UI Docs", "GET", "/api-docs", { expectedStatuses: [200] });

  // Connect DB explicitly before testing DB queries
  const connectDb = require("./dist/utils/db.js").default;
  await connectDb();

  // 2. Find or Create User & Admin tokens for authenticated tests
  console.log("\n--- [Phase 2: User Authentication Setup] ---");
  let userToken = null;
  let adminToken = null;
  let testUserId = null;

  try {
    const existingUsers = await userModel.find().limit(5);
    console.log(`[DB] Found ${existingUsers.length} user(s) in database`);

    let user = existingUsers.find((u) => u.role !== "admin") || existingUsers[0];
    let admin = existingUsers.find((u) => u.role === "admin");

    if (!user) {
      console.log("[DB] Creating a test user for test suite...");
      user = await userModel.create({
        name: "API Tester",
        email: `tester_${Date.now()}@mockapi.local`,
        password: "Password123!",
        role: "user",
        isVerified: true,
      });
    }

    testUserId = user._id.toString();
    userToken = jwt.sign({ id: user._id }, CONFIG.ACCESS_TOKEN, { expiresIn: "1h" });
    console.log(`[AUTH] User token generated for: ${user.email} (${user._id}, role: ${user.role})`);

    if (admin) {
      adminToken = jwt.sign({ id: admin._id }, CONFIG.ACCESS_TOKEN, { expiresIn: "1h" });
      console.log(`[AUTH] Admin token generated for admin: ${admin.email} (${admin._id})`);
    } else {
      adminToken = jwt.sign({ id: user._id }, CONFIG.ACCESS_TOKEN, { expiresIn: "1h" });
      user.role = "admin";
      await user.save();
      console.log(`[AUTH] Promoted ${user.email} to admin for comprehensive testing`);
    }
  } catch (dbErr) {
    console.warn("[AUTH] Warning: could not load/create DB user:", dbErr.message);
  }

  const userHeaders = userToken ? { Authorization: `Bearer ${userToken}` } : {};
  const adminHeaders = adminToken ? { Authorization: `Bearer ${adminToken}` } : {};

  // 3. Category & Brand APIs
  console.log("\n--- [Phase 3: Category & Brand APIs] ---");
  await callApi("Public: Get All Categories", "GET", "/api/v1/category/all", { expectedStatuses: [200] });
  await callApi("Public: Get All Brands", "GET", "/api/v1/category/brands/all", { expectedStatuses: [200] });
  await callApi("Public: Single Category (not found slug)", "GET", "/api/v1/category/single/non-existent-category", { expectedStatuses: [404] });
  await callApi("Guard: Create Category without auth", "POST", "/api/v1/category/create", { expectedStatuses: [401] });

  let createdCategoryId = null;
  if (adminToken) {
    const catRes = await callApi("Admin: Create Category", "POST", "/api/v1/category/create", {
      headers: adminHeaders,
      body: { name: `Test Electronics ${Date.now()}`, description: "Testing category APIs" },
      expectedStatuses: [201, 200],
    });
    if (catRes?.data?.category?._id) {
      createdCategoryId = catRes.data.category._id;
      await callApi("Public: Get Single Created Category", "GET", `/api/v1/category/single/${createdCategoryId}`, { expectedStatuses: [200] });
      await callApi("Admin: Update Category", "PUT", `/api/v1/category/update/${createdCategoryId}`, {
        headers: adminHeaders,
        body: { name: `Updated Test Category ${Date.now()}` },
        expectedStatuses: [200],
      });
    }

    await callApi("Admin: Create Brand", "POST", "/api/v1/category/brand/create", {
      headers: adminHeaders,
      body: { name: `Test Brand ${Date.now()}`, description: "Testing Brand API" },
      expectedStatuses: [201, 200],
    });
  }

  // 4. Product APIs
  console.log("\n--- [Phase 4: Product APIs] ---");
  await callApi("Public: Get All Products", "GET", "/api/v1/product/all", { expectedStatuses: [200] });
  await callApi("Public: Get Featured Products", "GET", "/api/v1/product/featured", { expectedStatuses: [200] });
  await callApi("Public: Single Product (not found)", "GET", "/api/v1/product/single/non-existent-product", { expectedStatuses: [404] });
  await callApi("Guard: Create Product without auth", "POST", "/api/v1/product/create", { expectedStatuses: [401] });

  let createdProductId = null;
  if (adminToken && createdCategoryId) {
    const prodRes = await callApi("Admin: Create Product", "POST", "/api/v1/product/create", {
      headers: adminHeaders,
      body: {
        title: `Pro Smartphone ${Date.now()}`,
        description: "High performance smartphone test product with 5G support",
        price: 49999,
        discountPrice: 44999,
        category: createdCategoryId,
        stockQuantity: 50,
        tags: ["electronics", "smartphone"],
      },
      expectedStatuses: [201, 200],
    });

    if (prodRes?.data?.product?._id) {
      createdProductId = prodRes.data.product._id;
      await callApi("Public: Get Single Product by ID", "GET", `/api/v1/product/single/${createdProductId}`, { expectedStatuses: [200] });
      await callApi("Public: Get Related Products", "GET", `/api/v1/product/related/${createdProductId}`, { expectedStatuses: [200] });
      await callApi("Admin: Update Product", "PUT", `/api/v1/product/update/${createdProductId}`, {
        headers: adminHeaders,
        body: { price: 47999, stockQuantity: 60 },
        expectedStatuses: [200],
      });
    }
  }

  // 5. Address Book APIs
  console.log("\n--- [Phase 5: Address Book APIs] ---");
  await callApi("Guard: Get Addresses without auth", "GET", "/api/v1/address/my-addresses", { expectedStatuses: [401] });
  await callApi("Guard: Add Address without auth", "POST", "/api/v1/address/add", { expectedStatuses: [401] });

  let createdAddressId = null;
  if (userToken) {
    const addrRes = await callApi("Auth: Add Shipping Address", "POST", "/api/v1/address/add", {
      headers: userHeaders,
      body: {
        fullName: "Test User",
        phone: "9876543210",
        addressLine1: "123 Main Street, Tech Park",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        country: "India",
        addressType: "home",
        isDefault: true,
      },
      expectedStatuses: [201, 200],
    });

    await callApi("Auth: Get My Addresses", "GET", "/api/v1/address/my-addresses", {
      headers: userHeaders,
      expectedStatuses: [200],
    });

    if (addrRes?.data?.address?._id) {
      createdAddressId = addrRes.data.address._id;
      await callApi("Auth: Update Address", "PUT", `/api/v1/address/update/${createdAddressId}`, {
        headers: userHeaders,
        body: { addressLine1: "124 Main Street, Tech Park Suite 4" },
        expectedStatuses: [200],
      });
      await callApi("Auth: Set Default Address", "PUT", `/api/v1/address/set-default/${createdAddressId}`, {
        headers: userHeaders,
        expectedStatuses: [200],
      });
    }
  }

  // 6. Cart APIs
  console.log("\n--- [Phase 6: Cart APIs] ---");
  await callApi("Guard: Get Cart without auth", "GET", "/api/v1/cart", { expectedStatuses: [401] });
  await callApi("Guard: Add to Cart without auth", "POST", "/api/v1/cart/add", { expectedStatuses: [401] });

  let cartItemId = null;
  if (userToken) {
    await callApi("Auth: Get My Cart", "GET", "/api/v1/cart", {
      headers: userHeaders,
      expectedStatuses: [200],
    });

    if (createdProductId) {
      const addRes = await callApi("Auth: Add Product to Cart", "POST", "/api/v1/cart/add", {
        headers: userHeaders,
        body: { productId: createdProductId, quantity: 2 },
        expectedStatuses: [200, 201],
      });

      if (addRes?.data?.cart?.items?.length > 0) {
        cartItemId = addRes.data.cart.items[0]._id;
      }

      if (cartItemId) {
        await callApi("Auth: Update Cart Item Quantity", "PUT", "/api/v1/cart/update-quantity", {
          headers: userHeaders,
          body: { itemId: cartItemId, quantity: 3 },
          expectedStatuses: [200],
        });
      }
    }
  }

  // 7. Wishlist APIs
  console.log("\n--- [Phase 7: Wishlist APIs] ---");
  await callApi("Guard: Get Wishlist without auth", "GET", "/api/v1/wishlist", { expectedStatuses: [401] });
  await callApi("Guard: Toggle Wishlist without auth", "POST", "/api/v1/wishlist/toggle", { expectedStatuses: [401] });

  if (userToken) {
    await callApi("Auth: Get My Wishlist", "GET", "/api/v1/wishlist", {
      headers: userHeaders,
      expectedStatuses: [200],
    });

    if (createdProductId) {
      await callApi("Auth: Toggle Wishlist Item (Add)", "POST", "/api/v1/wishlist/toggle", {
        headers: userHeaders,
        body: { productId: createdProductId },
        expectedStatuses: [200],
      });
      await callApi("Auth: Toggle Wishlist Item (Remove)", "POST", "/api/v1/wishlist/toggle", {
        headers: userHeaders,
        body: { productId: createdProductId },
        expectedStatuses: [200],
      });
    }
  }

  // 8. Coupon APIs
  console.log("\n--- [Phase 8: Coupon APIs] ---");
  await callApi("Guard: Apply Coupon without auth", "POST", "/api/v1/coupon/apply", { expectedStatuses: [401] });
  await callApi("Guard: Get All Coupons without admin auth", "GET", "/api/v1/coupon/all", { expectedStatuses: [401] });

  let couponCode = `SAVE${Math.floor(1000 + Math.random() * 9000)}`;
  let couponId = null;
  if (adminToken) {
    const coupRes = await callApi("Admin: Create Coupon", "POST", "/api/v1/coupon/create", {
      headers: adminHeaders,
      body: {
        code: couponCode,
        discountType: "percentage",
        discountValue: 15,
        minOrderAmount: 100,
        endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        usageLimit: 100,
      },
      expectedStatuses: [201, 200],
    });
    if (coupRes?.data?.coupon?._id) couponId = coupRes.data.coupon._id;

    await callApi("Admin: Get All Coupons", "GET", "/api/v1/coupon/all", {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }

  if (userToken) {
    await callApi("Auth: Apply Non-Existent Coupon (Validation)", "POST", "/api/v1/coupon/apply", {
      headers: userHeaders,
      body: { code: "INVALID999" },
      expectedStatuses: [400, 404],
    });
    await callApi("Auth: Apply Valid Coupon", "POST", "/api/v1/coupon/apply", {
      headers: userHeaders,
      body: { code: couponCode },
      expectedStatuses: [200],
    });
    await callApi("Auth: Remove Coupon", "POST", "/api/v1/coupon/remove", {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }

  // 9. Payment APIs
  console.log("\n--- [Phase 9: Payment APIs] ---");
  await callApi("Public: Get Razorpay Key", "GET", "/api/v1/payment/razorpay-key", { expectedStatuses: [200] });
  await callApi("Guard: Create Razorpay Order without auth", "POST", "/api/v1/payment/razorpay-order", { expectedStatuses: [401] });
  await callApi("Guard: Verify Payment without auth", "POST", "/api/v1/payment/verify", { expectedStatuses: [401] });
  await callApi("Public: Webhook with Missing Signature", "POST", "/api/v1/payment/webhook", {
    body: { event: "payment.captured" },
    expectedStatuses: [400],
  });

  // 10. E-Commerce Order APIs
  console.log("\n--- [Phase 10: E-Commerce Order APIs] ---");
  await callApi("Guard: Get My Orders without auth", "GET", "/api/v1/ecommerce/order/my-orders", { expectedStatuses: [401] });
  await callApi("Guard: Create Order without auth", "POST", "/api/v1/ecommerce/order/create", { expectedStatuses: [401] });

  let createdOrderId = null;
  if (userToken && createdAddressId && createdProductId) {
    // Ensure cart has an item before placing order
    await callApi("Auth: Add Item to Cart for Order", "POST", "/api/v1/cart/add", {
      headers: userHeaders,
      body: { productId: createdProductId, quantity: 1 },
      expectedStatuses: [200, 201],
    });

    const orderRes = await callApi("Auth: Create E-Commerce Order", "POST", "/api/v1/ecommerce/order/create", {
      headers: userHeaders,
      body: {
        addressId: createdAddressId,
        paymentInfo: { method: "cod" },
      },
      expectedStatuses: [201, 200],
    });

    if (orderRes?.data?.order?._id) {
      createdOrderId = orderRes.data.order._id;
      await callApi("Auth: Get My Orders", "GET", "/api/v1/ecommerce/order/my-orders", {
        headers: userHeaders,
        expectedStatuses: [200],
      });
      await callApi("Auth: Get Single Order", "GET", `/api/v1/ecommerce/order/single/${createdOrderId}`, {
        headers: userHeaders,
        expectedStatuses: [200],
      });
      await callApi("Auth: Cancel Order", "PUT", `/api/v1/ecommerce/order/cancel/${createdOrderId}`, {
        headers: userHeaders,
        body: { reason: "Automated test cancellation" },
        expectedStatuses: [200],
      });
    }
  }

  if (adminToken) {
    await callApi("Admin: Get All Orders", "GET", "/api/v1/ecommerce/order/admin/all", {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
    if (createdOrderId) {
      await callApi("Admin: Update Order Status", "PUT", `/api/v1/ecommerce/order/admin/update-status/${createdOrderId}`, {
        headers: adminHeaders,
        body: { status: "Cancelled" },
        expectedStatuses: [200],
      });
    }
  }

  // 11. Product Reviews APIs
  console.log("\n--- [Phase 11: Product Review APIs] ---");
  await callApi("Public: Get Reviews for Product", "GET", `/api/v1/product-reviews/product/${createdProductId || "507f1f77bcf86cd799439011"}`, {
    expectedStatuses: [200],
  });
  await callApi("Guard: Add Review without auth", "POST", "/api/v1/product-reviews/add", { expectedStatuses: [401] });

  let reviewId = null;
  if (userToken && createdProductId) {
    const revRes = await callApi("Auth: Add Product Review", "POST", "/api/v1/product-reviews/add", {
      headers: userHeaders,
      body: {
        productId: createdProductId,
        rating: 5,
        title: "Excellent build quality!",
        comment: "Exceeded all expectations. Fast shipping and smooth performance.",
      },
      expectedStatuses: [201, 200],
    });

    if (revRes?.data?.review?._id) {
      reviewId = revRes.data.review._id;
      await callApi("Auth: Vote Review Helpful", "PUT", `/api/v1/product-reviews/helpful/${reviewId}`, {
        headers: userHeaders,
        expectedStatuses: [200],
      });
    }
  }

  // 12. Cleanup
  console.log("\n--- [Phase 12: Cleanup Test Artifacts] ---");
  if (createdAddressId && userToken) {
    await callApi("Cleanup: Delete Test Address", "DELETE", `/api/v1/address/delete/${createdAddressId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }
  if (reviewId && userToken) {
    await callApi("Cleanup: Delete Test Review", "DELETE", `/api/v1/product-reviews/delete/${reviewId}`, {
      headers: userHeaders,
      expectedStatuses: [200],
    });
  }
  if (couponId && adminToken) {
    await callApi("Cleanup: Delete Test Coupon", "DELETE", `/api/v1/coupon/delete/${couponId}`, {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }
  if (createdProductId && adminToken) {
    await callApi("Cleanup: Delete Test Product", "DELETE", `/api/v1/product/delete/${createdProductId}`, {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }
  if (createdCategoryId && adminToken) {
    await callApi("Cleanup: Delete Test Category", "DELETE", `/api/v1/category/delete/${createdCategoryId}`, {
      headers: adminHeaders,
      expectedStatuses: [200],
    });
  }

  // Close Server & DB
  await new Promise((res) => server.close(res));
  if (mongoose.connection.readyState >= 1) {
    await mongoose.disconnect();
  }

  console.log("\n===============================================================");
  console.log(`🏁 API VERIFICATION COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log("===============================================================\n");

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("Test Suite crashed:", err);
  process.exit(1);
});
