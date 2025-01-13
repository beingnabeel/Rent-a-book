const express = require("express");
const morgan = require("morgan");
const AppError = require("./src/utils/appError");
const globalErrorHandler = require("./src/controllers/errorController");
const orderRouter = require("./src/routes/orderRoutes");
const deliveryPlanRouter = require("./src/routes/deliveryPlanRoutes");
const cartRouter = require("./src/routes/cartRoutes");

const app = express();
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));

app.use("/api/v1/order-service/orders", orderRouter);
app.use("/api/v1/order-service/delivery-plans", deliveryPlanRouter);
app.use("/api/v1/order-service/carts", cartRouter);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
