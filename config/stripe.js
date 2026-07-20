const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_API_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

module.exports = stripe;
