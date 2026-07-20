const Booking = require("../models/booking.model");
const Car = require("../models/car.model");
const User = require("../models/user.model");

class BookingController {
  async httpNewBooking(req, res) {
    try {
      const currentUser = req.user;
      const carId = req.params.carId;
      const {
        destination,
        bookingDate,
        duration,
        handOverDate,
        rentalPrice,
        depositAmount,
        specialRequests,
        totalPrice,
        driverNotes,
      } = req.body;

      const user = await User.findById(currentUser._id).select(
        "-password -phone -nic -emailVerificationToken -emailVerificationExpires",
      );
      if (!user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: "You must verify your account before make a booking!",
        });
      }

      if (currentUser._id.toString() !== user._id.toString()) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthorized!" });
      }

      const car = await Car.findById(carId).select(
        "-totalRentals -averageRating -reviewsCount -price -mileage -yom",
      );

      if (!car) {
        return res
          .status(400)
          .json({ success: false, message: "Car not found!" });
      }

      if (car.isAvailable === false) {
        return res
          .status(400)
          .json({ success: false, message: "The car is already booked!" });
      }

      function calculateDuration(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diff = end - start;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      const calculatedDuration =
        duration || calculateDuration(bookingDate, handOverDate);

      const booking = new Booking({
        vehicleId: car._id,
        userId: currentUser._id,
        destination: destination,
        bookingDate: bookingDate,
        duration: calculatedDuration,
        handOverDate: handOverDate,
        status: "pending",
        rentalPrice: rentalPrice,
        depositAmount: depositAmount,
        specialRequests: specialRequests,
        totalPrice: totalPrice,
        driverNotes: driverNotes,
        paymentStatus: "unpaid",
      });
      await booking.save();

      car.isAvailable = false;
      car.bookings.push(booking._id);
      await car.save();

      user.bookings.push(booking._id);
      await user.save();

      const populatedBooking = await Booking.findById(booking._id)
        .populate("vehicleId", "brand model yom rentalPrice")
        .populate("userId", "name email phone");

      return res.status(201).json({
        success: true,
        status: booking.status,
        message:
          "Booking created ✅, wait 1-2 hours and check your email for further details",
        bookingData: booking,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetActiveBooking(req, res) {
    try {
      const currentUser = req.user;
      const now = new Date();

      // ✅ Find active booking for this user
      const activeBooking = await Booking.findOne({
        userId: currentUser._id,
        status: { $in: ["confirmed", "active", "upcoming"] }, // Not completed or cancelled
        handOverDate: { $gte: now }, // Not expired
      })
        .populate("vehicleId", "brand model mainImage rentalPrice yom")
        .sort({ bookingDate: 1 }) // Soonest first
        .lean();

      if (!activeBooking) {
        return res.status(200).json({
          success: true,
          data: null,
          message: "No active bookings found",
        });
      }

      return res.status(200).json({
        success: true,
        data: activeBooking,
      });
    } catch (error) {
      console.error("Error fetching active booking:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async httpRetrieveBookings(req, res) {
    try {
      const currentUser = req.user;

      const bookings = await Booking.find({ userId: currentUser._id })
        .select("-paymentIntentId")
        .populate("vehicleId")
        .sort({ createdAt: 1 });

      if (bookings.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, No bookings found!" });
      }

      return res.status(200).json({
        success: true,
        message: `You have ${bookings.length} bookings.`,
        myBookings: bookings,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpViewBooking(req, res) {
    try {
      const currentUser = req.user;
      const bookingId = req.params.bookingId;

      const booking = await Booking.findById(bookingId)
        .select("-paymentIntentId -specialRequests -driverNotes")
        .populate("vehicleId", "brand model yom rental_price images costPerKM")
        .populate("userId", "fullName email phone");

      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found!" });
      }
      console.log("currentUser", currentUser);
      console.log("booking", booking.userId);

      // if (currentUser._id.toString() !== booking.userId) {
      //   return res
      //     .status(403)
      //     .json({ success: false, message: "Unauthorized!" });
      // }

      return res.status(200).json({
        success: true,
        message: "Booking fetched ✅",
        bookingData: booking,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpCancelBooking(req, res) {
    try {
      const bookingId = req.params.bookingId;
      const userId = req.user._id;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, booking not found!" });
      }

      if (userId.toString() !== booking.userId.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized!" });
      }

      booking.status = "cancelled";
      await booking.save();

      return res
        .status(200)
        .json({ success: true, message: "Booking cancelled successfull ✅" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpRescheduleBooking(req, res) {
    try {
      const currentUser = req.user;
      const bookingId = req.params.bookingId;
      const now = new Date();
      const {
        newDate,
        duration,
        destination,
        vehicleId,
        depositAmount,
        totalPrice,
      } = req.body;

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Booking not found!" });
      }

      if (booking.userId.toString() !== currentUser._id.toString()) {
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized" });
      }

      if (new Date(booking.bookingDate) < new Date()) {
        return res
          .status(400)
          .json({ success: false, message: "Cannot reschedule past booking." });
      }

      const newDuration = duration || booking.duration;

      const newStartDate = newDate ? new Date(newDate) : booking.bookingDate;
      const newEndDate = new Date(newStartDate);
      newEndDate.setDate(newEndDate.getDate() + newDuration);

      if (newStartDate < now) {
        return res.status(400).json({
          success: false,
          message: "Cannot reschedule to a past date",
        });
      }

      const targetVehicleId = vehicleId || booking.vehicleId;

      // 6. Check if target vehicle exists
      const vehicle = await Car.findById(targetVehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: "Vehicle not found",
        });
      }

      const vehicleCheck = await Booking.findOne({
        vehicleId: vehicleId,
        status: { $in: ["active", "confirmed", "pending"] },
        handOverDate: { $gt: now },
        ...(bookingId && { _id: { $ne: bookingId } }),
      });

      if (vehicleCheck) {
        const handOverDate = new Date(vehicleCheck.handOverDate.getDate() + 1);
        const formattedDate = handOverDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const formattedTime = handOverDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return res.status(400).json({
          success: false,
          message: `This vehicle is currently booked and will be available on ${formattedDate} at ${formattedTime}`,
          data: {
            availableFrom: vehicleCheck.handOverDate,
            formattedDate: `${formattedDate} at ${formattedTime}`,
            currentBookingId: vehicleCheck._id,
          },
        });
      }

      const availability = await Booking.findOne({
        vehicleId: booking.vehicleId,
        bookingDate: newDate,
        status: { $in: ["confirmed", "pending", "active"] },
        _id: { $ne: bookingId },
        $or: [
          {
            bookingDate: {
              $gte: newStartDate,
              $lt: newEndDate,
            },
          },
          {
            handOverDate: {
              $gt: newStartDate,
              $lte: newEndDate,
            },
          },
          {
            bookingDate: { $lte: newStartDate },
            handOverDate: { $gte: newEndDate },
          },
        ],
      });

      if (availability) {
        const formattedStart = new Date(
          availability.bookingDate,
        ).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const formattedEnd = new Date(
          availability.handOverDate,
        ).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });

        return res.status(400).json({
          success: false,
          message: `This vehicle is already booked from ${formattedStart} to ${formattedEnd}`,
          data: {
            availabilityId: availability._id,
            bookedFrom: availability.bookingDate,
            bookedUntil: availability.handOverDate,
          },
        });
      }

      // 8. Check if vehicle is currently in use (handOverDate not passed)
      const activeBooking = await Booking.findOne({
        vehicleId: targetVehicleId,
        status: { $in: ["active", "confirmed", "pending"] },
        handOverDate: { $gt: now },
        _id: { $ne: bookingId },
      });

      if (activeBooking) {
        const availableFrom = new Date(activeBooking.handOverDate);
        const formattedDate = availableFrom.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
        const formattedTime = availableFrom.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return res.status(400).json({
          success: false,
          message: `This vehicle is currently in use and will be available on ${formattedDate} at ${formattedTime}`,
          data: {
            availableFrom: activeBooking.handOverDate,
            formattedDate: `${formattedDate} at ${formattedTime}`,
            currentBookingId: activeBooking._id,
          },
        });
      }

      const dailyRate = vehicle.costPerKM;
      const days = duration || booking.duration;
      const subtotal = dailyRate * days;
      const deposit = subtotal * 0.25; // 25% deposit
      const total = subtotal; // Base total

      // Get past deposit
      const pastDeposit = booking.depositAmount || 0;
      const diff = pastDeposit - deposit; // Positive = decreased, Negative = increased

      // Calculate adjusted total
      let adjustedTotal = total;
      if (diff > 0) {
        // Deposit decreased - subtract from total
        adjustedTotal = total - diff;
      } else if (diff < 0) {
        // Deposit increased - add to total
        adjustedTotal = total + Math.abs(diff);
      }

      const updatedData = {};

      if (newDate) {
        updatedData.bookingDate = newStartDate;
        updatedData.handOverDate = newEndDate;
      }

      if (duration) {
        updatedData.duration = duration;

        if (!newDate) {
          const updatedEndDate = new Date(booking.bookingDate);
          updatedEndDate.setDate(updatedEndDate.getDate() + duration);
          updatedData.handOverDate = updatedEndDate;
        }
      }

      if (vehicleId) {
        updatedData.vehicleId = vehicleId;
      }

      if (destination) {
        updatedData.destination = destination;
      }

      if (depositAmount) {
        updatedData.depositAmount = depositAmount;
      }

      if (totalPrice) {
        updatedData.totalPrice = adjustedTotal;
      }

      if (originalTotal) {
        updatedData.originalTotal = total;
      }

      if (priceAdjustment) {
        updatedData.priceAdjustment = diff;
      }

      if (adjustmentType) {
        updatedData.adjustmentType =
          diff > 0 ? "refund" : diff < 0 ? "extra" : "none";
      }

      // If no changes, return early
      if (Object.keys(updatedData).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No changes provided for rescheduling",
        });
      }

      // Apply updates
      Object.assign(booking, updatedData);

      await booking.save();

      const updatedBooking = await Booking.findById(bookingId)
        .populate("userId", "fullName email phone")
        .populate("vehicleId", "brand model yom rental_price images");

      return res.status(200).json({
        success: true,
        message: "Booking rescheduled successfull ✅",
        data: updatedBooking,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }
}

const bookingController = new BookingController();
module.exports = bookingController;
