export const ecommerceTags: Array<Record<string, any>> = [
  {
    name: "E-Commerce - Categories & Brands",
    description: "Manage product categories, hierarchical classification, and brands",
  },
  {
    name: "E-Commerce - Products",
    description: "Product catalog with filtering, search, sorting, pagination, stock management, and CRUD",
  },
  {
    name: "E-Commerce - Addresses",
    description: "User shipping and billing address book management",
  },
  {
    name: "E-Commerce - Cart",
    description: "Shopping cart management, item quantity updates, clearing, and guest-to-user merging",
  },
  {
    name: "E-Commerce - Wishlist",
    description: "Saved items, wishlist toggling, and direct transfer into shopping cart",
  },
  {
    name: "E-Commerce - Coupons & Discounts",
    description: "Promotional discount codes, percentage/fixed savings, cart validation, and admin controls",
  },
  {
    name: "E-Commerce - Payments (Razorpay)",
    description: "Razorpay order creation, client key retrieval, cryptographic signature verification, and webhooks",
  },
  {
    name: "E-Commerce - Orders",
    description: "End-to-end order processing, tracking, cancellation, and admin fulfillment workflows",
  },
  {
    name: "E-Commerce - Product Reviews",
    description: "Customer ratings, detailed feedback, helpfulness voting, and moderation",
  },
];

export const ecommerceSchemas: Record<string, any> = {
  Category: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b90" },
      name: { type: "string", example: "Electronics" },
      slug: { type: "string", example: "electronics" },
      description: { type: "string", example: "Gadgets, accessories, and consumer tech" },
      image: { type: "string", example: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" },
      parentId: { type: "string", nullable: true },
      isActive: { type: "boolean", example: true },
      displayOrder: { type: "number", example: 1 },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  Brand: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b91" },
      name: { type: "string", example: "Sony" },
      slug: { type: "string", example: "sony" },
      logo: { type: "string", example: "https://example.com/sony-logo.png" },
      description: { type: "string", example: "Global consumer electronics leader" },
      isActive: { type: "boolean", example: true },
    },
  },
  Product: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b92" },
      title: { type: "string", example: "Wireless Noise-Canceling Headphones" },
      slug: { type: "string", example: "wireless-noise-canceling-headphones" },
      description: { type: "string", example: "Industry leading noise cancellation with premium audio fidelity" },
      price: { type: "number", example: 199.99 },
      originalPrice: { type: "number", example: 249.99 },
      discountPercentage: { type: "number", example: 20 },
      stock: { type: "number", example: 45 },
      sku: { type: "string", example: "SONY-WH1000-BLK" },
      category: { type: "string", example: "66f0011a2b3c4d5e6f7a8b90" },
      brand: { type: "string", example: "66f0011a2b3c4d5e6f7a8b91" },
      images: {
        type: "array",
        items: { type: "string" },
        example: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e"],
      },
      tags: {
        type: "array",
        items: { type: "string" },
        example: ["audio", "bluetooth", "noise-canceling"],
      },
      ratings: { type: "number", example: 4.8 },
      numReviews: { type: "number", example: 34 },
      isFeatured: { type: "boolean", example: true },
      isActive: { type: "boolean", example: true },
    },
  },
  Address: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b93" },
      user: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
      fullName: { type: "string", example: "Jane Doe" },
      phoneNumber: { type: "string", example: "+1 555-0199" },
      street: { type: "string", example: "742 Evergreen Terrace" },
      city: { type: "string", example: "Springfield" },
      state: { type: "string", example: "OR" },
      postalCode: { type: "string", example: "97477" },
      country: { type: "string", example: "United States" },
      isDefault: { type: "boolean", example: true },
      addressType: { type: "string", enum: ["Home", "Work", "Other"], example: "Home" },
    },
  },
  CartItem: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b94" },
      product: { $ref: "#/components/schemas/Product" },
      quantity: { type: "number", example: 2 },
      price: { type: "number", example: 199.99 },
    },
  },
  Cart: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b95" },
      user: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
      items: {
        type: "array",
        items: { $ref: "#/components/schemas/CartItem" },
      },
      subTotal: { type: "number", example: 399.98 },
      discount: { type: "number", example: 40.0 },
      shippingFee: { type: "number", example: 0 },
      tax: { type: "number", example: 28.8 },
      totalPrice: { type: "number", example: 388.78 },
      coupon: {
        type: "object",
        nullable: true,
        properties: {
          code: { type: "string", example: "WELCOME10" },
          discountAmount: { type: "number", example: 40.0 },
        },
      },
    },
  },
  Wishlist: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b96" },
      user: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
      products: {
        type: "array",
        items: { $ref: "#/components/schemas/Product" },
      },
    },
  },
  Coupon: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b97" },
      code: { type: "string", example: "FESTIVE20" },
      discountType: { type: "string", enum: ["percentage", "fixed"], example: "percentage" },
      discountValue: { type: "number", example: 20 },
      minPurchaseAmount: { type: "number", example: 100 },
      maxDiscountAmount: { type: "number", example: 50 },
      expiryDate: { type: "string", format: "date-time" },
      usageLimit: { type: "number", example: 500 },
      usedCount: { type: "number", example: 32 },
      isActive: { type: "boolean", example: true },
    },
  },
  RazorpayOrder: {
    type: "object",
    properties: {
      id: { type: "string", example: "order_Q123456789abc" },
      entity: { type: "string", example: "order" },
      amount: { type: "number", example: 38878 },
      amount_paid: { type: "number", example: 0 },
      amount_due: { type: "number", example: 38878 },
      currency: { type: "string", example: "INR" },
      receipt: { type: "string", example: "rcpt_66f0011a2b" },
      status: { type: "string", example: "created" },
    },
  },
  EcommerceOrder: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b98" },
      orderNumber: { type: "string", example: "ORD-2026-98124" },
      user: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
      orderItems: {
        type: "array",
        items: {
          type: "object",
          properties: {
            product: { type: "string", example: "66f0011a2b3c4d5e6f7a8b92" },
            title: { type: "string", example: "Wireless Noise-Canceling Headphones" },
            image: { type: "string", example: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e" },
            price: { type: "number", example: 199.99 },
            quantity: { type: "number", example: 2 },
          },
        },
      },
      shippingAddress: { $ref: "#/components/schemas/Address" },
      paymentMethod: { type: "string", enum: ["COD", "Razorpay", "Stripe"], example: "Razorpay" },
      paymentInfo: {
        type: "object",
        properties: {
          razorpay_order_id: { type: "string", example: "order_Q123456789abc" },
          razorpay_payment_id: { type: "string", example: "pay_Q123456789xyz" },
          status: { type: "string", example: "succeeded" },
        },
      },
      itemsPrice: { type: "number", example: 399.98 },
      taxPrice: { type: "number", example: 28.8 },
      shippingPrice: { type: "number", example: 0 },
      discountPrice: { type: "number", example: 40.0 },
      totalPrice: { type: "number", example: 388.78 },
      orderStatus: {
        type: "string",
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        example: "Processing",
      },
      deliveredAt: { type: "string", format: "date-time", nullable: true },
      createdAt: { type: "string", format: "date-time" },
    },
  },
  ProductReview: {
    type: "object",
    properties: {
      _id: { type: "string", example: "66f0011a2b3c4d5e6f7a8b99" },
      product: { type: "string", example: "66f0011a2b3c4d5e6f7a8b92" },
      user: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64e00b8a1c9d2f001c9a1b2c" },
          name: { type: "string", example: "Jane Doe" },
          avatar: { type: "object", properties: { url: { type: "string" } } },
        },
      },
      rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
      title: { type: "string", example: "Superb Soundstage and Comfort" },
      comment: { type: "string", example: "Battery lasts multiple days on a single charge. Highly recommend!" },
      helpfulVotes: { type: "number", example: 12 },
      createdAt: { type: "string", format: "date-time" },
    },
  },
};

export const ecommercePaths: Record<string, any> = {
  // CATEGORIES & BRANDS
  "/api/v1/category/all": {
    get: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Get all active categories",
      description: "Returns nested or flat list of active categories for catalog browsing",
      responses: {
        200: {
          description: "Categories fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  count: { type: "number", example: 12 },
                  categories: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Category" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/category/single/{idOrSlug}": {
    get: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Get single category by ID or slug",
      parameters: [
        { name: "idOrSlug", in: "path", required: true, schema: { type: "string" }, description: "Category ID or slug" },
      ],
      responses: {
        200: {
          description: "Category details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  category: { $ref: "#/components/schemas/Category" },
                },
              },
            },
          },
        },
        404: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  },
  "/api/v1/category/brands/all": {
    get: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Get all active brands",
      responses: {
        200: {
          description: "Brands fetched successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  count: { type: "number", example: 8 },
                  brands: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Brand" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/category/create": {
    post: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Create a new category (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", example: "Smart Home" },
                description: { type: "string", example: "Connected IoT appliances and lighting" },
                image: { type: "string", example: "https://example.com/cat.jpg" },
                parentId: { type: "string", nullable: true },
                displayOrder: { type: "number", example: 2 },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Category created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  category: { $ref: "#/components/schemas/Category" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/category/update/{id}": {
    put: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Update existing category (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: { "application/json": { schema: { type: "object" } } },
      },
      responses: {
        200: { description: "Category updated successfully" },
      },
    },
  },
  "/api/v1/category/delete/{id}": {
    delete: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Delete category (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "Category deleted" },
      },
    },
  },
  "/api/v1/category/brand/create": {
    post: {
      tags: ["E-Commerce - Categories & Brands"],
      summary: "Create a new brand (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name"],
              properties: {
                name: { type: "string", example: "Apple" },
                logo: { type: "string", example: "https://example.com/apple.png" },
                description: { type: "string", example: "Premium consumer tech and accessories" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Brand created" },
      },
    },
  },

  // PRODUCTS
  "/api/v1/product/all": {
    get: {
      tags: ["E-Commerce - Products"],
      summary: "Search and filter products with pagination",
      parameters: [
        { name: "keyword", in: "query", required: false, schema: { type: "string" }, description: "Search by title/description" },
        { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Category ID" },
        { name: "brand", in: "query", required: false, schema: { type: "string" }, description: "Brand ID" },
        { name: "minPrice", in: "query", required: false, schema: { type: "number" } },
        { name: "maxPrice", in: "query", required: false, schema: { type: "number" } },
        { name: "rating", in: "query", required: false, schema: { type: "number" } },
        { name: "sort", in: "query", required: false, schema: { type: "string", enum: ["newest", "price_low", "price_high", "rating", "popular"] } },
        { name: "page", in: "query", required: false, schema: { type: "number", default: 1 } },
        { name: "limit", in: "query", required: false, schema: { type: "number", default: 12 } },
      ],
      responses: {
        200: {
          description: "Products list with pagination metadata",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  totalProducts: { type: "number", example: 124 },
                  totalPages: { type: "number", example: 11 },
                  currentPage: { type: "number", example: 1 },
                  count: { type: "number", example: 12 },
                  products: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/featured": {
    get: {
      tags: ["E-Commerce - Products"],
      summary: "Get featured products for landing banner / showcase",
      responses: {
        200: {
          description: "Featured products list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  count: { type: "number", example: 6 },
                  products: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Product" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/single/{idOrSlug}": {
    get: {
      tags: ["E-Commerce - Products"],
      summary: "Get product details by ID or Slug",
      parameters: [{ name: "idOrSlug", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Product full details",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  product: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/related/{id}": {
    get: {
      tags: ["E-Commerce - Products"],
      summary: "Get recommended/related products in same category",
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: {
          description: "Related products array",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  count: { type: "number", example: 4 },
                  products: { type: "array", items: { $ref: "#/components/schemas/Product" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/create": {
    post: {
      tags: ["E-Commerce - Products"],
      summary: "Create a new product (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "description", "price", "stock", "category"],
              properties: {
                title: { type: "string", example: "Mechanical Gaming Keyboard" },
                description: { type: "string", example: "RGB Hot-swappable tactile mechanical switch keyboard" },
                price: { type: "number", example: 89.99 },
                originalPrice: { type: "number", example: 119.99 },
                stock: { type: "number", example: 50 },
                sku: { type: "string", example: "KB-RGB-PRO" },
                category: { type: "string", example: "66f0011a2b3c4d5e6f7a8b90" },
                brand: { type: "string", example: "66f0011a2b3c4d5e6f7a8b91" },
                images: { type: "array", items: { type: "string" } },
                tags: { type: "array", items: { type: "string" } },
                isFeatured: { type: "boolean", example: true },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Product created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  product: { $ref: "#/components/schemas/Product" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product/update/{id}": {
    put: {
      tags: ["E-Commerce - Products"],
      summary: "Update existing product (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Product updated" } },
    },
  },
  "/api/v1/product/delete/{id}": {
    delete: {
      tags: ["E-Commerce - Products"],
      summary: "Delete product (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Product deleted" } },
    },
  },

  // ADDRESSES
  "/api/v1/address/add": {
    post: {
      tags: ["E-Commerce - Addresses"],
      summary: "Add a new shipping address",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["fullName", "phoneNumber", "street", "city", "state", "postalCode", "country"],
              properties: {
                fullName: { type: "string", example: "John Doe" },
                phoneNumber: { type: "string", example: "+1 555-0199" },
                street: { type: "string", example: "123 Market St" },
                city: { type: "string", example: "San Francisco" },
                state: { type: "string", example: "CA" },
                postalCode: { type: "string", example: "94103" },
                country: { type: "string", example: "USA" },
                isDefault: { type: "boolean", example: true },
                addressType: { type: "string", enum: ["Home", "Work", "Other"], example: "Home" },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Address added",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  address: { $ref: "#/components/schemas/Address" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/address/my-addresses": {
    get: {
      tags: ["E-Commerce - Addresses"],
      summary: "Get all saved addresses for logged-in user",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "User address book",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  count: { type: "number", example: 2 },
                  addresses: { type: "array", items: { $ref: "#/components/schemas/Address" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/address/update/{id}": {
    put: {
      tags: ["E-Commerce - Addresses"],
      summary: "Update existing address",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
      responses: { 200: { description: "Address updated" } },
    },
  },
  "/api/v1/address/delete/{id}": {
    delete: {
      tags: ["E-Commerce - Addresses"],
      summary: "Delete an address",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Address removed" } },
    },
  },
  "/api/v1/address/set-default/{id}": {
    put: {
      tags: ["E-Commerce - Addresses"],
      summary: "Set an address as default shipping destination",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Default address updated" } },
    },
  },

  // CART
  "/api/v1/cart": {
    get: {
      tags: ["E-Commerce - Cart"],
      summary: "Get logged-in user cart with calculated totals",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Active shopping cart",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  cart: { $ref: "#/components/schemas/Cart" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/cart/add": {
    post: {
      tags: ["E-Commerce - Cart"],
      summary: "Add item to cart or increment quantity",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["productId"],
              properties: {
                productId: { type: "string", example: "66f0011a2b3c4d5e6f7a8b92" },
                quantity: { type: "number", default: 1, example: 1 },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Item added to cart" } },
    },
  },
  "/api/v1/cart/update-quantity": {
    put: {
      tags: ["E-Commerce - Cart"],
      summary: "Update cart item quantity",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["itemId", "quantity"],
              properties: {
                itemId: { type: "string", example: "66f0011a2b3c4d5e6f7a8b94" },
                quantity: { type: "number", example: 3 },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Quantity adjusted" } },
    },
  },
  "/api/v1/cart/item/{itemId}": {
    delete: {
      tags: ["E-Commerce - Cart"],
      summary: "Remove item from cart",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Item removed" } },
    },
  },
  "/api/v1/cart/clear": {
    delete: {
      tags: ["E-Commerce - Cart"],
      summary: "Clear all items from user cart",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: { 200: { description: "Cart emptied" } },
    },
  },
  "/api/v1/cart/merge": {
    post: {
      tags: ["E-Commerce - Cart"],
      summary: "Merge guest session cart items after user login",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["guestItems"],
              properties: {
                guestItems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      productId: { type: "string" },
                      quantity: { type: "number" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Cart merged" } },
    },
  },

  // WISHLIST
  "/api/v1/wishlist": {
    get: {
      tags: ["E-Commerce - Wishlist"],
      summary: "Get user wishlist items",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Wishlist contents",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  wishlist: { $ref: "#/components/schemas/Wishlist" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/wishlist/toggle": {
    post: {
      tags: ["E-Commerce - Wishlist"],
      summary: "Toggle product in/out of wishlist",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["productId"],
              properties: { productId: { type: "string", example: "66f0011a2b3c4d5e6f7a8b92" } },
            },
          },
        },
      },
      responses: { 200: { description: "Product added or removed from wishlist" } },
    },
  },
  "/api/v1/wishlist/move-to-cart/{productId}": {
    post: {
      tags: ["E-Commerce - Wishlist"],
      summary: "Transfer product from wishlist directly into cart",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "productId", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Transferred to cart" } },
    },
  },

  // COUPONS
  "/api/v1/coupon/apply": {
    post: {
      tags: ["E-Commerce - Coupons & Discounts"],
      summary: "Apply coupon code to cart",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code"],
              properties: { code: { type: "string", example: "FESTIVE20" } },
            },
          },
        },
      },
      responses: { 200: { description: "Coupon applied successfully" } },
    },
  },
  "/api/v1/coupon/remove": {
    post: {
      tags: ["E-Commerce - Coupons & Discounts"],
      summary: "Remove applied coupon from cart",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: { 200: { description: "Coupon removed" } },
    },
  },
  "/api/v1/coupon/create": {
    post: {
      tags: ["E-Commerce - Coupons & Discounts"],
      summary: "Create promo coupon (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["code", "discountType", "discountValue", "minPurchaseAmount", "expiryDate"],
              properties: {
                code: { type: "string", example: "SUPER50" },
                discountType: { type: "string", enum: ["percentage", "fixed"], example: "fixed" },
                discountValue: { type: "number", example: 50 },
                minPurchaseAmount: { type: "number", example: 150 },
                maxDiscountAmount: { type: "number", example: 50 },
                expiryDate: { type: "string", format: "date-time" },
                usageLimit: { type: "number", example: 1000 },
              },
            },
          },
        },
      },
      responses: { 201: { description: "Coupon created" } },
    },
  },
  "/api/v1/coupon/all": {
    get: {
      tags: ["E-Commerce - Coupons & Discounts"],
      summary: "List all coupons (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: { 200: { description: "Coupons list" } },
    },
  },
  "/api/v1/coupon/delete/{id}": {
    delete: {
      tags: ["E-Commerce - Coupons & Discounts"],
      summary: "Delete coupon by ID (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Coupon deleted" } },
    },
  },

  // PAYMENTS (RAZORPAY)
  "/api/v1/payment/razorpay-key": {
    get: {
      tags: ["E-Commerce - Payments (Razorpay)"],
      summary: "Retrieve public Razorpay Client Key for frontend SDK",
      responses: {
        200: {
          description: "Razorpay Key ID",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  key: { type: "string", example: "rzp_test_1234567890abcdef" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/payment/razorpay-order": {
    post: {
      tags: ["E-Commerce - Payments (Razorpay)"],
      summary: "Create Razorpay Order for checkout payment",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["amount"],
              properties: {
                amount: { type: "number", example: 388.78, description: "Amount in main currency (e.g. INR/USD)" },
                currency: { type: "string", default: "INR", example: "INR" },
                receipt: { type: "string", example: "rcpt_user_123" },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Razorpay Order created",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  order: { $ref: "#/components/schemas/RazorpayOrder" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/payment/verify": {
    post: {
      tags: ["E-Commerce - Payments (Razorpay)"],
      summary: "Cryptographically verify Razorpay payment signature",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["razorpay_order_id", "razorpay_payment_id", "razorpay_signature"],
              properties: {
                razorpay_order_id: { type: "string", example: "order_Q123456789abc" },
                razorpay_payment_id: { type: "string", example: "pay_Q123456789xyz" },
                razorpay_signature: { type: "string", example: "f9b8972e34fa..." },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Signature verified successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Payment verified successfully" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/payment/webhook": {
    post: {
      tags: ["E-Commerce - Payments (Razorpay)"],
      summary: "Razorpay server-to-server webhook endpoint",
      responses: {
        200: { description: "Webhook event received" },
      },
    },
  },

  // ECOMMERCE ORDERS
  "/api/v1/ecommerce/order/create": {
    post: {
      tags: ["E-Commerce - Orders"],
      summary: "Place a new order (COD or post-online payment)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["shippingAddressId", "paymentMethod"],
              properties: {
                shippingAddressId: { type: "string", example: "66f0011a2b3c4d5e6f7a8b93" },
                paymentMethod: { type: "string", enum: ["COD", "Razorpay", "Stripe"], example: "Razorpay" },
                paymentInfo: {
                  type: "object",
                  properties: {
                    razorpay_order_id: { type: "string" },
                    razorpay_payment_id: { type: "string" },
                    status: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Order placed successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  order: { $ref: "#/components/schemas/EcommerceOrder" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/ecommerce/order/my-orders": {
    get: {
      tags: ["E-Commerce - Orders"],
      summary: "Get order history for logged-in user",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: "Customer orders list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  count: { type: "number", example: 3 },
                  orders: { type: "array", items: { $ref: "#/components/schemas/EcommerceOrder" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/ecommerce/order/single/{id}": {
    get: {
      tags: ["E-Commerce - Orders"],
      summary: "Get order details by order ID",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Order details" } },
    },
  },
  "/api/v1/ecommerce/order/cancel/{id}": {
    put: {
      tags: ["E-Commerce - Orders"],
      summary: "Cancel order (if pending or processing)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: false,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: { reason: { type: "string", example: "Changed my mind" } },
            },
          },
        },
      },
      responses: { 200: { description: "Order cancelled" } },
    },
  },
  "/api/v1/ecommerce/order/admin/all": {
    get: {
      tags: ["E-Commerce - Orders"],
      summary: "Get all customer orders with pagination & status filter (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: "status", in: "query", required: false, schema: { type: "string" } },
        { name: "page", in: "query", required: false, schema: { type: "number" } },
        { name: "limit", in: "query", required: false, schema: { type: "number" } },
      ],
      responses: { 200: { description: "Admin orders master list" } },
    },
  },
  "/api/v1/ecommerce/order/admin/status/{id}": {
    put: {
      tags: ["E-Commerce - Orders"],
      summary: "Update order delivery status (Admin only)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["orderStatus"],
              properties: {
                orderStatus: {
                  type: "string",
                  enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
                  example: "Shipped",
                },
              },
            },
          },
        },
      },
      responses: { 200: { description: "Status updated" } },
    },
  },

  // PRODUCT REVIEWS
  "/api/v1/product-reviews/product/{productId}": {
    get: {
      tags: ["E-Commerce - Product Reviews"],
      summary: "Get reviews for a product with pagination",
      parameters: [
        { name: "productId", in: "path", required: true, schema: { type: "string" } },
        { name: "page", in: "query", required: false, schema: { type: "number" } },
        { name: "limit", in: "query", required: false, schema: { type: "number" } },
      ],
      responses: {
        200: {
          description: "Product reviews list",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  totalReviews: { type: "number", example: 15 },
                  totalPages: { type: "number", example: 2 },
                  reviews: { type: "array", items: { $ref: "#/components/schemas/ProductReview" } },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/product-reviews/add": {
    post: {
      tags: ["E-Commerce - Product Reviews"],
      summary: "Add a review and rating for a product",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["productId", "rating", "comment"],
              properties: {
                productId: { type: "string", example: "66f0011a2b3c4d5e6f7a8b92" },
                rating: { type: "number", minimum: 1, maximum: 5, example: 5 },
                title: { type: "string", example: "Excellent build quality" },
                comment: { type: "string", example: "Sounds fantastic and pairs seamlessly." },
              },
            },
          },
        },
      },
      responses: { 201: { description: "Review added" } },
    },
  },
  "/api/v1/product-reviews/helpful/{id}": {
    put: {
      tags: ["E-Commerce - Product Reviews"],
      summary: "Vote a review as helpful",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Helpful vote recorded" } },
    },
  },
  "/api/v1/product-reviews/delete/{id}": {
    delete: {
      tags: ["E-Commerce - Product Reviews"],
      summary: "Delete review (author or admin)",
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: { 200: { description: "Review removed" } },
    },
  },
};
