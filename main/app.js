const express = require("express");
const cors = require("cors");
const methodOverrie = require("method-override");
const carRouter = require("../routes/car.routes");
const userRouter = require("../routes/user.routes");
const bookingRouter = require("../routes/booking.routes");
const adminRouter = require("../routes/admin.routes");
const paymentRouter = require("../routes/payment.routes");
const webhookRouter = require("../routes/webhook.routes");

const app = express();

// ✅ Global error handlers (MUST be at the top)
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't crash!
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise);
  console.error("❌ Reason:", reason);
  // Don't crash!
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://car-rental-frontend-fm3n.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token"],
    credentials: true,
    // maxAge: 86400,
  }),
);

// app.options("*", cors());

app.use("/api/v1/webhook", webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverrie("_static"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/cars", carRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/admin", adminRouter);

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

module.exports = app;
