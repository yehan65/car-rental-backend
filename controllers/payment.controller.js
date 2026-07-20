// This is your test secret API key. Stripe automatically fills it in for code samples.
// Don't put any keys in code. See https://docs.stripe.com/keys-best-practices.

const stripe = require("../config/stripe");
const Booking = require("../models/booking.model");

class PaymentController {
  async httpPaymentSession(req, res) {
    try {
      const { bookingData, amount, vehicleName, customerEmail } = req.body;

      const amountIncents = Math.round(amount * 100);

      console.log("📥 Backend received:");
      console.log("  bookingData:", bookingData);
      console.log("  amount:", amount);
      console.log("  vehicleName:", vehicleName);
      console.log("  customerEmail:", customerEmail);

      // Create a checkout session
      const session = await stripe.checkout.sessions.create({
        // ui_mode: "embedded", // or 'hosted' for Stripe's hosted page
        // return_url: `${process.env.CLIENT_URL}/api/v1/payment-result?session_id={CHECKOUT_SESSION_ID}`,
        success_url: `${process.env.CLIENT_URL}/payment-result?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${process.env.CLIENT_URL}/payment-result?status=cancelled`,
        mode: "payment",
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: amountIncents, // Amount in cents (e.g., $50.00 = 50000),
              product_data: {
                name: `Car Rental ${vehicleName}`,
                description: `Deposit for Booking ${vehicleName}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingData: JSON.stringify(bookingData),
          vehicleName: vehicleName,
        },
        payment_method_options: {
          card: {
            setup_future_usage: "off_session",
          },
        },
        adaptive_pricing: { enabled: true }, // Let customers pay in their currency
      });

      console.log("✅ Session created:", session.id);
      console.log("🔗 Checkout URL:", session.url);

      // console.log("✅ Session created:");
      // console.log("  session.id:", session.id); // ← cs_test_...
      // console.log("  session.client_secret:", session.client_secret); // ← pi_..._secret_...

      // console.log("session: ", session);

      return res.status(200).json({
        success: true,
        // clientSecret: session.client_secret, // For embedded checkout
        url: session.url,
        sessionId: session.id,
      });
    } catch (error) {
      console.error("Stripe error:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async httpGetPaymentStatus(req, res) {
    try {
      const { session_id } = req.query;

      if (!session_id) {
        return res.status(400).json({
          success: false,
          message: "Session ID required",
        });
      }

      // ✅ Retrieve the session from Stripe
      const session = await stripe.checkout.sessions.retrieve(session_id);

      // ✅ Find the booking in your database
      const booking = await Booking.findOne({ stripeSessionId: session_id })
        .populate("vehicleId", "brand model")
        .populate("userId", "fullName email");

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      return res.status(200).json({
        success: true,
        booking: booking,
        paymentStatus: session.payment_status,
      });
    } catch (error) {
      console.error("Error checking payment status:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

const paymentController = new PaymentController();
module.exports = paymentController;
