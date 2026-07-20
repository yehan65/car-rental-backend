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

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://car-rental-frontend-fm3n.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-auth-token"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.options("*", cors());

app.use("/api/v1/webhook", webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverrie("_static"));

app.use("/api/v1/users", userRouter);
app.use("/api/v1/cars", carRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/admin", adminRouter);

module.exports = app;
