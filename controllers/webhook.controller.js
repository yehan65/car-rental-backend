const stripe = require("../config/stripe");
const Booking = require("../models/booking.model");
const Car = require("../models/car.model");
const User = require("../models/user.model");

class WebhookController {
  constructor() {
    this.httpWebhook = this.httpWebhook.bind(this);
    this.handleCheckoutCompleted = this.handleCheckoutCompleted.bind(this);
    this.handleCheckoutExpired = this.handleCheckoutExpired.bind(this);
  }

  async httpWebhook(req, res) {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // ✅ Check if secret is missing
    if (!endpointSecret) {
      console.error(
        "❌ STRIPE_WEBHOOK_SECRET is not set in environment variables!",
      );
      return res.status(500).send("Webhook secret not configured");
    }

    // ✅ Check if signature is missing
    if (!sig) {
      console.error("❌ No stripe-signature header found!");
      return res.status(400).send("No signature header");
    }

    let event;

    try {
      // Verify webhook signature - this is your security check![citation:4]

      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`📨 Received webhook event: ${event.type}`);

    // Handle different event types
    try {
      switch (event.type) {
        case "checkout.session.completed":
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case "checkout.session.expired":
          await this.handleCheckoutExpired(event.data.object);
          break;

        case "charge.updated":
          console.log("🔄 Charge updated:", event.data.object.id);
          break;

        case "charge.dispute.created":
          const dispute = event.data.object;
          // Handle disputes
          console.log(`⚠️ Dispute created: ${dispute.id}`);
          break;

        case "charge.refunded":
          const refund = event.data.object;
          // Handle refunds
          console.log(`🔄 Refund processed: ${refund.id}`);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Error processing webhook event: ${error.message}`);
      return res.status(500).send(`Webhook processing error: ${error.message}`);
    }
    res.json({ received: true });
  }

  async handleCheckoutCompleted(session) {
    try {
      // ✅ CORRECT: session.metadata directly
      if (!session.metadata?.bookingData) {
        console.error("❌ No bookingData in session metadata!");
        console.log(
          "📦 Available metadata:",
          Object.keys(session.metadata || {}),
        );
        return;
      }

      const bookingData = JSON.parse(session.metadata.bookingData);
      console.log("✅ Parsed bookingData:", bookingData);

      const user = await User.findById(bookingData.userId).select(
        "-password -phone -nic -emailVerificationToken -emailVerificationExpires",
      );
      if (!user.isEmailVerified) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You must verify your account before make a booking!",
          });
      }

      // ✅ Check if booking already exists
      const existingBooking = await Booking.findOne({
        stripeSessionId: session.id,
      });
      if (existingBooking) {
        console.log(`⚠️ Booking already exists for session ${session.id}`);
        return;
      }

      const booking = new Booking({
        vehicleId: bookingData.vehicleId,
        userId: bookingData.userId, // Get from session
        bookingDate: new Date(bookingData.bookingDate),
        handOverDate: new Date(bookingData.handOverDate),
        duration: bookingData.duration,
        destination: bookingData.destination || "",
        totalPrice: bookingData.totalPrice,
        depositAmount: bookingData.depositAmount,
        // subtotal: bookingData.subtotal,
        // dailyRate: bookingData.dailyRate,
        // remaining: bookingData.remaining,
        paymentStatus: "paid",
        status: "confirmed",
        stripeSessionId: session.id,
        paymentIntentId: session.payment_intent,
        paidAt: new Date(),
        depositPaid: true,
      });

      const vehicle = await Car.findById(bookingData.vehicleId);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "No vehicle found!" });
      }

      vehicle.isAvailable = false;
      vehicle.bookings.push(booking._id);

      user.bookings.push(booking._id);

      await booking.save();
      await vehicle.save();
      await user.save();

      console.log(`✅ Booking created: ${booking._id} (Payment completed)`);
    } catch (error) {
      console.error(`❌ Failed to create booking: ${error.message}`);
    }
  }

  async handleCheckoutExpired(session) {
    // Session expired - no booking created, nothing to do
    console.log(`⏰ Checkout session expired: ${session.id}`);
  }
}
const webhookController = new WebhookController();
module.exports = webhookController;
