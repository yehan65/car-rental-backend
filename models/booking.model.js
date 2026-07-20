const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "car",
      required: [true, "Vehicle id is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "User id is required"],
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
    },
    bookingDate: {
      type: Date,
      default: null,
      required: [true, "Booking date is required"],
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "duration must be at least 1 day"],
    },
    handOverDate: {
      type: Date,
      default: null,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "active", "completed", "cancelled"],
      default: "pending",
    },
    rentalPrice: {
      type: Number,
      default: 0,
      required: true,
    },
    totalPrice: {
      type: Number,
      default: 0,
      required: true,
    },
    originalTotal: {
      type: Number,
      default: 0,
    },
    priceAdjustment: {
      type: Number,
      default: 0, // Positive = refund, Negative = extra payment
    },
    adjustmentType: {
      type: String,
      enum: ["refund", "extra", "none"],
      default: "none",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "deposit_paid", "paid", "refunded"],
      default: "unpaid",
    },
    paymentIntentId: {
      type: String,
      default: null,
    },
    stripeSessionId: {
      type: String,
      default: null,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    specialRequests: {
      type: String,
      default: "",
    },
    driverNotes: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: Date.now(),
    },
    depositPaid: {
      type: Boolean,
    },
  },
  { timestamps: true },
);

bookingSchema.index({ vehicleId: 1 });
bookingSchema.index({ userId: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index({ bookingDate: 1 });
bookingSchema.index({ handOverDate: 1 });

const Booking = mongoose.model("bookings", bookingSchema);
module.exports = Booking;
