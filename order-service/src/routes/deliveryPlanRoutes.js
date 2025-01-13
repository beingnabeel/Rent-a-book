const express = require("express");
const deliveryPlanController = require("../controllers/deliveryPlanController");

const router = express.Router();

router
  .route("/")
  .post(deliveryPlanController.createDeliveryPlan)
  .get(deliveryPlanController.getAllDeliveryPlans);

router
  .route("/:id")
  .patch(deliveryPlanController.updateDeliveryPlan)
  .delete(deliveryPlanController.deleteDeliveryPlan);

router.get("/user/:userId", deliveryPlanController.getUserDeliveryPlans);

module.exports = router;
