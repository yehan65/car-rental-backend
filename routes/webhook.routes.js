const express = require("express");
const webhookController = require("../controllers/webhook.controller");

const webhookRouter = express.Router();

webhookRouter.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  webhookController.httpWebhook,
);

module.exports = webhookRouter;
