const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./src/middleware/authMiddleware");

// Load environment variables
dotenv.config({ path: "./config.env" });

const app = express();

// Enable CORS
app.use(cors());

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Auth routes (no authentication required)
const publicPaths = [
  "/api/v1/users/login",
  "/api/v1/users/register",
  "/api/v1/users/refresh-token",
  "/api/v1/users/forgot-password",
  "/api/v1/users/reset-password",
];

// Proxy configuration for each service
const serviceProxies = {
  users: createProxyMiddleware({
    target: process.env.USER_SERVICE_URL || "http://localhost:4003",
    pathRewrite: {
      "^/api/v1/users": "/api/v1/users",
    },
    changeOrigin: true,
  }),

  books: createProxyMiddleware({
    target: process.env.BOOKS_SERVICE_URL || "http://localhost:4001",
    pathRewrite: {
      "^/api/v1/books-service": "/api/v1/books-service",
    },
    changeOrigin: true,
  }),

  orders: createProxyMiddleware({
    target: process.env.ORDER_SERVICE_URL || "http://localhost:4005",
    pathRewrite: {
      "^/api/v1/order-service": "/api/v1/order-service",
    },
    changeOrigin: true,
  }),

  schools: createProxyMiddleware({
    target: process.env.SCHOOL_SERVICE_URL || "http://localhost:4002",
    pathRewrite: {
      "^/api/v1/schools-service": "/api/v1/schools-service",
    },
    changeOrigin: true,
  }),

  subscriptions: createProxyMiddleware({
    target: process.env.SUBSCRIPTION_SERVICE_URL || "http://localhost:4004",
    pathRewrite: {
      "^/api/v1/subscription-service": "/api/v1/subscription-service",
    },
    changeOrigin: true,
  }),
};

// Public routes (no authentication required)
app.use("/api/v1/users", serviceProxies.users);

// Protected routes (authentication required)
app.use("/api/v1/books-service", authenticateToken, serviceProxies.books);
app.use("/api/v1/order-service", authenticateToken, serviceProxies.orders);
app.use("/api/v1/schools-service", authenticateToken, serviceProxies.schools);
app.use(
  "/api/v1/subscription-service",
  authenticateToken,
  serviceProxies.subscriptions
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong in the gateway!",
  });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API Gateway running on port ${port}`);
});
