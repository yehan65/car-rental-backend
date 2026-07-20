const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const bookingController = require("../controllers/booking.controller");

const bookingRouter = express.Router();

bookingRouter.get(
  "/my/all",
  authMiddleware,
  bookingController.httpRetrieveBookings,
);
bookingRouter.get(
  "/active",
  authMiddleware,
  bookingController.httpGetActiveBooking,
);
bookingRouter.get(
  "/:bookingId",
  authMiddleware,
  bookingController.httpViewBooking,
);
bookingRouter.post(
  "/new/:carId",
  authMiddleware,
  bookingController.httpNewBooking,
);
bookingRouter.put(
  "/cancel/:bookingId",
  authMiddleware,
  bookingController.httpCancelBooking,
);
bookingRouter.put(
  "/reschedule/:bookingId",
  authMiddleware,
  bookingController.httpRescheduleBooking,
);

module.exports = bookingRouter;
