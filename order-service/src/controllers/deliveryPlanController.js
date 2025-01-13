const DeliveryPlan = require("../models/deliveryPlanModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const axios = require("axios");

const SUBSCRIPTION_SERVICE_URL =
  process.env.SUBSCRIPTION_SERVICE_URL ||
  "http://localhost:4004/api/v1/subscription-service";

// Helper function to get subscription details
const getSubscriptionDetails = async (subscriptionId) => {
  try {
    const response = await axios.get(
      `${SUBSCRIPTION_SERVICE_URL}/subscriptions/${subscriptionId}`
    );
    return response.data.data.subscription;
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return null;
  }
};

// Create delivery plan
exports.createDeliveryPlan = catchAsync(async (req, res, next) => {
  // Validate delivery day
  const validDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  if (!validDays.includes(req.body.deliveryDay)) {
    return next(new AppError("Invalid delivery day", 400));
  }

  // Check if user already has an active delivery plan for this subscription
  const existingPlan = await DeliveryPlan.findOne({
    userId: req.body.userId,
    subscriptionId: req.body.subscriptionId,
    status: "ACTIVE",
  });

  if (existingPlan) {
    return next(
      new AppError(
        "An active delivery plan already exists for this subscription",
        400
      )
    );
  }

  const deliveryPlan = await DeliveryPlan.create({
    userId: req.body.userId,
    subscriptionId: req.body.subscriptionId,
    deliveryDay: req.body.deliveryDay,
    deliveryAddress: req.body.deliveryAddress,
    deliveryNotes: req.body.deliveryNotes,
    status: "ACTIVE",
  });

  res.status(201).json({
    status: "success",
    data: {
      deliveryPlan,
    },
  });
});

// Get all delivery plans
exports.getAllDeliveryPlans = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  let query = DeliveryPlan.find();
  const features = new APIFeatures(query, req.query).filter().search();

  const totalDocuments = await DeliveryPlan.countDocuments(
    features.query.getFilter()
  );

  features.sort().limitFields().paginate();
  const deliveryPlans = await features.query;

  // Fetch subscription details for each delivery plan
  const enrichedDeliveryPlans = await Promise.all(
    deliveryPlans.map(async (plan) => {
      const subscription = await getSubscriptionDetails(plan.subscriptionId);
      const planObj = plan.toObject();
      return {
        ...planObj,
        subscription: subscription || null,
      };
    })
  );

  const totalPages = Math.ceil(totalDocuments / limit);
  const formattedResponse = {
    data: enrichedDeliveryPlans,
    pageNumber: page,
    pageSize: limit,
    totalPages,
    totalDocuments,
    first: page === 1,
    last: page === totalPages,
    numberOfDocuments: deliveryPlans.length,
  };

  res.status(200).json({
    status: "success",
    data: formattedResponse,
  });
});

// Get user's delivery plans
exports.getUserDeliveryPlans = catchAsync(async (req, res, next) => {
  const deliveryPlans = await DeliveryPlan.find({ userId: req.params.userId });

  res.status(200).json({
    status: "success",
    results: deliveryPlans.length,
    data: {
      deliveryPlans,
    },
  });
});

// Update delivery plan
exports.updateDeliveryPlan = catchAsync(async (req, res, next) => {
  // Validate delivery day if it's being updated
  if (req.body.deliveryDay) {
    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    if (!validDays.includes(req.body.deliveryDay)) {
      return next(new AppError("Invalid delivery day", 400));
    }
  }

  const deliveryPlan = await DeliveryPlan.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!deliveryPlan) {
    return next(new AppError("No delivery plan found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      deliveryPlan,
    },
  });
});

// Delete (soft) delivery plan
exports.deleteDeliveryPlan = catchAsync(async (req, res, next) => {
  const deliveryPlan = await DeliveryPlan.findByIdAndUpdate(
    req.params.id,
    { status: "INACTIVE" },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!deliveryPlan) {
    return next(new AppError("No delivery plan found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
