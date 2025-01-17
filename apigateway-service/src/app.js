const express = require("express");
const cors = require("cors");
const serviceRoutes = require("./routes/serviceRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

// Public routes (no auth required)
app.use("/api/v1/auth", require("./routes/authRoutes"));

// Protected service routes
app.use("/", serviceRoutes);

// Error handling
app.use(errorHandler);

module.exports = app;
