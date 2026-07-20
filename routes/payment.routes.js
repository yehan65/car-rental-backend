const express = require("express");
const paymentController = require("../controllers/payment.controller");

const paymentRouter = express.Router();

paymentRouter.post(
  "/create-checkout-session",
  paymentController.httpPaymentSession,
);

paymentRouter.get("/payment-status", paymentController.httpGetPaymentStatus);

module.exports = paymentRouter;
