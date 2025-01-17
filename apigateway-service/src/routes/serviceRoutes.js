const express = require("express");
const router = express.Router();
const {
  verifyToken,
  authorizeRoles,
  authorizePermissions,
} = require("../middleware/authMiddleware");
const { createProxyMiddleware } = require("http-proxy-middleware");

// Get service URLs from environment variables with fallbacks
const BOOK_SERVICE_URL =
  process.env.BOOKS_SERVICE_URL || "http://localhost:4001";
const ORDER_SERVICE_URL =
  process.env.ORDER_SERVICE_URL || "http://localhost:4005";
const SCHOOL_SERVICE_URL =
  process.env.SCHOOL_SERVICE_URL || "http://localhost:4002";
const SUBSCRIPTION_SERVICE_URL =
  process.env.SUBSCRIPTION_SERVICE_URL || "http://localhost:4004";
const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://localhost:8080";

// User Management Service Routes
const userServiceProxy = createProxyMiddleware({
  target: USER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/v1/users": "/users",
    "^/api/v1/auth": "/auth",
    "^/api/v1/roles": "/roles",
    "^/api/v1/permissions": "/permissions",
  },
  onProxyReq: function (proxyReq, req, res) {
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error("User Service Proxy Error:", err);
    res.status(500).json({ message: "User service unavailable" });
  },
});

// Book Service Routes
const bookServiceProxy = createProxyMiddleware({
  target: BOOK_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/v1/books": "/api/v1/books-service",
  },
  onError: (err, req, res) => {
    console.error("Book Service Proxy Error:", err);
    res.status(500).json({ message: "Book service unavailable" });
  },
});

// Order Service Routes
const orderServiceProxy = createProxyMiddleware({
  target: ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/v1/order-service/orders": "/api/v1/order-service/orders",
    "^/api/v1/order-service/carts": "/api/v1/order-service/carts",
    "^/api/v1/order-service/delivery-plans":
      "/api/v1/order-service/delivery-plans",
  },
  onProxyReq: function (proxyReq, req, res) {
    console.log("Proxying to:", proxyReq.path);

    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader("Content-Type", "application/json");
      proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error("Order Service Proxy Error:", err);
    res.status(500).json({ message: "Order service unavailable" });
  },
});

// School Service Routes
const schoolServiceProxy = createProxyMiddleware({
  target: SCHOOL_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/v1/schools": "/api/v1/schools-service",
  },
  onError: (err, req, res) => {
    console.error("School Service Proxy Error:", err);
    res.status(500).json({ message: "School service unavailable" });
  },
});

// Subscription Service Routes
const subscriptionServiceProxy = createProxyMiddleware({
  target: SUBSCRIPTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    "^/api/v1/subscriptions": "/api/v1/subscription-service",
  },
  onError: (err, req, res) => {
    console.error("Subscription Service Proxy Error:", err);
    res.status(500).json({ message: "Subscription service unavailable" });
  },
});

// Public routes (no auth required)
router.use("/api/v1/auth", userServiceProxy);

// Protected Routes
router.use(
  "/api/v1/books",
  verifyToken,
  authorizePermissions(["Read_Data"]),
  bookServiceProxy
);

router.use(
  [
    "/api/v1/order-service/orders",
    "/api/v1/order-service/carts",
    "/api/v1/order-service/delivery-plans",
  ],
  verifyToken,
  authorizePermissions(["Write_Data"]),
  orderServiceProxy
);

router.use(
  "/api/v1/schools",
  verifyToken,
  authorizePermissions(["Read_Data"]),
  schoolServiceProxy
);

router.use(
  "/api/v1/subscriptions",
  verifyToken,
  authorizePermissions(["Write_Data"]),
  subscriptionServiceProxy
);

// User Management Protected Routes
router.use(
  ["/api/v1/users", "/api/v1/roles", "/api/v1/permissions"],
  verifyToken,
  userServiceProxy
);

// Debug logging
console.log("Service URLs:", {
  BOOK_SERVICE_URL,
  ORDER_SERVICE_URL,
  SCHOOL_SERVICE_URL,
  SUBSCRIPTION_SERVICE_URL,
  USER_SERVICE_URL,
});

module.exports = router;
