const mongoose = require("mongoose");

const deliveryPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Delivery plan must belong to a user"],
    },
    subscriptionId: {
      type: mongoose.Schema.ObjectId,
      ref: "Subscription",
      required: [true, "Delivery plan must be associated with a subscription"],
    },
    deliveryDay: {
      type: String,
      required: [true, "Delivery day is required"],
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    deliveryAddress: {
      type: String,
      required: [true, "Delivery address is required"],
      trim: true,
    },
    deliveryNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Ensure only one active delivery plan per user
deliveryPlanSchema.index(
  { userId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "ACTIVE" } }
);

const DeliveryPlan = mongoose.model("DeliveryPlan", deliveryPlanSchema);
module.exports = DeliveryPlan;
