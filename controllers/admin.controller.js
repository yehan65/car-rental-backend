const Booking = require("../models/booking.model");
const Car = require("../models/car.model");
const User = require("../models/user.model");
const cloudinary = require("../config/cloudinary");

class AdminController {
  async httpGetAllBookings(req, res) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const bookings = await Booking.find()
        .populate("userId vehicleId")
        .sort({ createdAt: 1 });
      if (bookings.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, No bookings found!" });
      }

      return res.status(200).json({
        success: true,
        message: `${bookings.length} bookings found!`,
        data: bookings,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetTodayBookings(req, res) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const now = new Date();

      // bookingDate <= now && handOverDate >= now

      const bookings = await Booking.find({
        bookingDate: { $lte: now },
        handOverDate: { $gte: now },
      }).populate(["vehicleId", "userId"]);

      if (bookings.length === 0) {
        return res
          .status(200)
          .json({ success: false, message: "No bookings found!", data: [] });
      }

      return res.status(200).json({
        success: true,
        message: `${bookings.length} bookings found!`,
        data: bookings,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetWeeklyBookings(req, res) {
    const currentUser = req.user;
    try {
      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weeklyBookings = await Booking.find({
        $or: [
          { bookingDate: { $gte: startOfWeek, $lte: endOfWeek } },
          { handOverDate: { $gte: startOfWeek, $lte: endOfWeek } },
          {
            bookingDate: { $lte: startOfWeek },
            handOverDate: { $gte: endOfWeek },
          },
        ],
      }).populate(["vehicleId", "userId"]);

      if (weeklyBookings.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No weekly bookings found!",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
        message: `${weeklyBookings.length} bookings found!`,
        data: weeklyBookings,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetMonthlyBookings(req, res) {
    const currentUser = req.user;

    try {
      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();

      const startOfMonth = new Date(currentYear, currentMonth, 1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      const monthlyBookings = await Booking.find({
        $or: [
          { bookingDate: { $gte: startOfMonth, $lte: endOfMonth } },
          { handOverDate: { $gte: startOfMonth, $lte: endOfMonth } },
          {
            bookingDate: { $lte: startOfMonth },
            handOverDate: { $gte: endOfMonth },

            // ✅ This single condition does what all 3 conditions do!
            // bookingDate: { $lte: endOfMonth },
            // handOverDate: { $gte: startOfMonth },
          },
        ],
      }).populate(["userId", "vehicleId"]);

      if (monthlyBookings.length === 0) {
        return res.status(200).json({
          success: false,
          message: "No monthly bookings found!",
          data: [],
        });
      }

      return res.status(200).json({
        success: true,
        message: `${monthlyBookings.length} bookings found!`,
        data: monthlyBookings,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpViewSingleBooking(req, res) {
    try {
      const bookingId = req.params.bookingId;
      const currentUser = req.user;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }
      const booking =
        await Booking.findById(bookingId).populate("userId vehicleId");

      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, booking not found!" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Booking fetched ✅", data: booking });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpDeleteBooking(req, res) {
    try {
      const currentUser = req.user;
      const bookingId = req.params.bookingId;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, booking not found!" });
      }

      const vehicle = await Car.findByIdAndUpdate(booking.userId, {
        $pull: { bookings: bookingId },
        isAvailable: true,
      });

      const user = await User.findByIdAndUpdate(booking.userId, {
        $pull: { bookings: bookingId },
      });

      await vehicle.save();
      await user.save();

      await Booking.findByIdAndDelete(bookingId);

      return res.status(200).json({
        success: true,
        message: "Booking deleted successfully.",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpUpdateBooking(req, res) {
    try {
      const currentUser = req.user;
      const bookingId = req.params.bookingId;
      const {
        status,
        destination,
        bookingDate,
        handOverDate,
        duration,
        rentalPrice,
        driverNotes,
      } = req.body;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, No booking found!" });
      }

      if (status) {
        booking.status = status;
      }

      if (destination) {
        booking.destination = destination;
      }

      if (bookingDate) {
        booking.bookingDate = bookingDate;
      }

      if (handOverDate) {
        booking.handOverDate = handOverDate;
      }

      if (duration) {
        booking.duration = duration;
      }

      if (rentalPrice) {
        booking.rentalPrice = rentalPrice;
      }

      if (driverNotes) {
        booking.driverNotes = driverNotes;
      }

      await booking.save();

      const updatedBooking = await Booking.findById(bookingId)
        .populate("vehicleId", "brand model yom rentalPrice")
        .populate("userId", "name email phone");

      return res.status(200).json({
        success: true,
        message: "Booking updated ✅",
        updatedData: booking,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpNewVehicle(req, res) {
    try {
      const { role } = req.user;
      const {
        vehicleType,
        brand,
        model,
        yom,
        licensePlateNo,
        mileage,
        num_of_seats,
        doors,
        transmission,
        fuelType,
        color,
        price,
        rental_price,
        costPerKM,
        isAvailable,
        features,
        description,
        location,
      } = req.body;

      if (role !== "admin") {
        return res
          .status(401)
          .json({ success: false, message: "This is a admin only feature." });
      }

      const carExist = await Car.findOne({ licensePlateNo: licensePlateNo });
      if (carExist) {
        return res.status(400).json({
          success: false,
          message: "Wrong license plate, this number is already registered!",
        });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const uploadPromises = req.files.map((file) => {
          return new Promise((resolve, reject) => {
            const result = cloudinary.uploader.upload_stream(
              { folder: "car-rentals" },

              async (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
              },
            );
            result.end(file.buffer);
          });
        });
        imageUrls = await Promise.all(uploadPromises);
      }

      const car = new Car({
        vehicleType,
        brand,
        model,
        yom,
        licensePlateNo,
        mileage,
        num_of_seats,
        doors,
        transmission,
        fuelType,
        color,
        price,
        rental_price,
        costPerKM,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        features,
        images: imageUrls,
        mainImage: imageUrls.length > 0 ? imageUrls[0] : null,
        description,
        location,
      });

      await car.save();

      return res
        .status(200)
        .json({ success: true, message: "Vehicle added ✅", data: car });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetAllVehicles(req, res) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }
      const allVehicles = await Car.find()
        .populate("bookings")
        .sort({ createdAt: 1 }); //Make click sorting
      if (allVehicles.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, No vehicles found!" });
      }

      return res.status(200).json({
        success: true,
        message: `${allVehicles.length} vehicles found!`,
        data: allVehicles,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetSingleVehicle(req, res) {
    try {
      const currentUser = req.user;
      const vehicleId = req.params.vehicleId;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }
      const vehicle = await Car.findById(vehicleId).populate("bookings");

      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, Vehicle not found!" });
      }

      return res
        .status(200)
        .json({ success: true, message: "Vehicle fetched ✅", data: vehicle });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpUpdateVehicle(req, res) {
    try {
      const currentUser = req.user;
      const vehicleId = req.params.vehicleId;
      const {
        vehicleType,
        brand,
        model,
        yom,
        // licensePlateNo,
        mileage,
        num_of_seats,
        doors,
        transmission,
        fuelType,
        color,
        price,
        rental_price,
        isAvailable,
        features,
        description,
        location,
      } = req.body;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const vehicle = await Car.findById(vehicleId);

      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, no vehicle found!" });
      }

      if (mileage !== undefined) {
        vehicle.mileage = mileage;
      }

      if (num_of_seats) {
        vehicle.num_of_seats = num_of_seats;
      }

      if (doors) {
        vehicle.doors = doors;
      }

      // if (licensePlateNo) {
      //   vehicle.licensePlateNo = licensePlateNo;
      // }

      if (transmission) {
        vehicle.transmission = transmission;
      }

      if (fuelType) {
        vehicle.fuelType = fuelType;
      }

      if (color) {
        vehicle.color = color;
      }

      if (price) {
        vehicle.price = price;
      }

      if (rental_price !== undefined) {
        vehicle.rental_price = rental_price;
      }

      if (isAvailable !== undefined) {
        vehicle.isAvailable = isAvailable;
      }

      if (features) {
        vehicle.features = features;
      }

      if (description) {
        vehicle.description = description;
      }

      if (location) {
        vehicle.location = location;
      }

      // const licensePlateExists = await Car.find({
      //   licensePlateNo: licensePlateNo,
      // });
      // if (licensePlateExists) {
      //   return res
      //     .status(400)
      //     .json({
      //       success: false,
      //       message: "The license plate already exists!",
      //     });
      // }

      await vehicle.save();

      return res.status(200).json({
        success: true,
        message: "Vehicle updated ✅",
        updatedData: vehicle,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpDeleteVehicle(req, res) {
    try {
      const currentUser = req.user;
      const vehicleId = req.params.vehicleId;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const vehicle = await Car.findById(vehicleId);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, no vehicle found!" });
      }

      const bookings = await Booking.find({
        vehicleId: vehicleId,
        status: { $in: ["confirmed", "pending"] },
        bookingDate: { $gte: new Date() },
      });
      if (bookings.length > 0) {
        await Booking.updateMany(
          { vehicleId: vehicleId, status: { $in: ["confirmed", "pending"] } },
          { status: "cancelled" },
        );
        await bookings.save();
      }

      await Car.findByIdAndDelete(vehicleId);

      return res
        .status(200)
        .json({ success: true, message: "Vehicle deleted ✅" });
    } catch (error) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden, You do not have permisson to access this resource!",
      });
    }
  }

  // CUSTOMERS

  async httpGetAllUsers(req, res) {
    try {
      const currentUser = req.user;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const allUsers = await User.find()
        .select("-password")
        .sort({ createdAt: 1 });
      if (allUsers.length === 0) {
        return res
          .status(200)
          .json({ success: true, message: "No users available", data: [] });
      }

      return res.status(200).json({
        success: true,
        message: `${allUsers.length} users found!`,
        data: allUsers,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error.message}` });
    }
  }

  async httpToggleUserStatus(req, res) {
    try {
      const currentUser = req.user;
      const targetUser = req.params.userId;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const user = await User.findById(targetUser);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      user.isActive = !user.isActive;
      await user.save();

      return res.status(200).json({
        success: true,
        message: `User ${user.isActive ? "activated" : "deactivated"}`,
        data: user,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error.message}` });
    }
  }

  async httpDeleteUser(req, res) {
    try {
      const currentUser = req.user;
      const targetUser = req.params.userId;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      const user = await User.findByIdAndDelete(targetUser);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res
        .status(200)
        .json({ success: true, message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  // STATS
  async httpGetDashboardStats(req, res) {
    try {
      const currentUser = req.user;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      // const allVehicles = await Car.find().sort("-createdAt");
      // if (allVehicles.length === 0) {
      //   res
      //     .status(200)
      //     .json({ success: true, message: "No Vehicles!", data: [] });
      // }

      // const allBookings = await Booking.find().sort("-createdAt");
      // if (allBookings.length === 0) {
      //   res
      //     .status(200)
      //     .json({ success: true, message: "No Bookings!", data: [] });
      // }

      // const allUsers = await User.find().sort("-createdAt");
      // if (allUsers.length === 0) {
      //   res.status(200).json({ success: true, message: "No Users!", data: [] });
      // }

      // const revenue = allBookings
      //   .filter((booking) => {
      //     return booking.status === "completed";
      //   })
      //   .reduce((total, booking) => {
      //     return total + booking.totalPrice;
      //   }, 0);

      // const todayBookings = await Booking.find({
      //   bookingDate: { $gte: today, $lt: tomorrow },
      // });
      // if (todayBookings.length === 0) {
      //   res
      //     .status(200)
      //     .json({ success: true, message: "No Today Bookings!", data: [] });
      // }

      // const pendingBookings = await Booking.find({ status: "pending" });
      // if (pendingBookings.length === 0) {
      //   res
      //     .status(200)
      //     .json({ success: true, message: "No Pending Bookings!", data: [] });
      // }

      const [
        todayBookings,
        pendingBookings,
        totalVehicles,
        totalUsers,
        totalBookings,
        revenueAgg,
        popularCars,
        recentBookings,
      ] = await Promise.all([
        // Today Bookings
        Booking.find({ bookingDate: { $gte: today, $lt: tomorrow } }),

        // 2. Pending bookings
        Booking.find({
          status: "pending",
        }),
        // 3. Total vehicles
        Car.countDocuments(),

        // 4. Total users
        User.countDocuments(),

        // 5. Total bookings
        Booking.countDocuments(),

        // 6. Total Revenue
        Booking.aggregate([
          { $match: { status: "completed" } },
          {
            $group: { _id: null, total: { $sum: "$totalPrice" } },
          },
        ]),

        // 7. Popular Cars (top 5)
        Booking.aggregate([
          {
            $group: {
              _id: "$vehicleId",
              count: { $sum: 1 },
              totalRevenue: { $sum: "totalPrice" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "cars",
              localField: "_id",
              foreignField: "_id",
              as: "car",
            },
          },
          { $unwind: "$car" },
          {
            $project: {
              _id: 0,
              carId: "$car._id",
              brand: "$car.brand",
              model: "$car.model",
              bookings: "$count",
            },
          },
        ]),

        // 8. Recent Bookings (latest 5)
        Booking.find()
          .populate("vehicleId", "brand model")
          .populate("userId", "fullName email")
          .sort("-createdAt")
          .limit(5),
      ]);

      // ============ CALCULATE REVENUE ============
      const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

      // ============ FORMAT POPULAR CARS ============
      const formattedPopularCars = popularCars.map((item, index) => ({
        rank: index + 1,
        id: item.carId,
        brand: item.brand,
        model: item.model,
        bookings: item.count,
      }));

      return res.status(200).json({
        success: true,
        message: "Stats ready!",
        // data: {
        //   vehiclesCount: allVehicles.length,
        //   bookingsCount: allBookings.length,
        //   usersCount: allUsers.length,
        //   totalRevenue: revenue,
        //   todayAppointments: todayBookings.length,
        //   pendingAppointments: pendingBookings.length,
        // },
        data: {
          // Summary numbers
          summary: {
            totalVehicles: totalVehicles || 0,
            totalUsers: totalUsers || 0,
            totalBookings: totalBookings || 0,
            totalRevenue: totalRevenue || 0,
          },
          // Today's appointments
          todayAppointments: {
            count: todayBookings.length || 0,
            bookings: todayBookings,
          },
          // Pending appointments
          pendingAppointments: {
            count: pendingBookings.length || 0,
            bookings: pendingBookings,
          },
          // Popular cars
          popularCars: formattedPopularCars,
          recentBookings: recentBookings || [],
        },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  // REPORTS

  async httpGetReports(req, res) {
    try {
      const currentUser = req.user;
      const { period = "week" } = req.query;
      const now = new Date();
      let startDate;
      let endDate;

      if (currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message:
            "Forbidden, You do not have permisson to access this resource!",
        });
      }

      if (period === "week") {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "month") {
        // startDate = new Date(now);
        // Start of the month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate.setHours(0, 0, 0, 0);

        // endDate = new Date(startDate);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
      } else if (period === "year") {
        // startDate = new Date(now);
        // Start of the year
        startDate = new Date(now.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);

        // endDate = new Date(startDate);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
      }

      const bookings = await Booking.find({
        createdAt: { $gte: startDate, $lte: endDate },
      });

      // Summary stats
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce(
        (sum, booking) => sum + (booking.totalPrice || 0),
        0,
      );

      const uniqueCustomers = new Set(
        bookings.map((booking) => booking.userId?.toString()),
      );
      const totalCustomers = uniqueCustomers.size;
      const averageBookingValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Revenue by day (for chart)
      const revenueByDay = await Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: "completed",
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            total: { $sum: "$totalPrice" },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      // Popular cars
      const popularCars = await Booking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: "$vehicleId",
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "cars",
            localField: "_id",
            foreignField: "_id",
            as: "car",
          },
        },
        { $unwind: "$car" },
        {
          $project: {
            _id: 0,
            brand: "$car.brand",
            model: "$car.model",
            bookings: "$count",
            revenue: 1,
          },
        },
      ]);

      // Top customers
      const topCustomers = await Booking.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: "$userId", bookings: { $sum: 1 } } },
        { $sort: { bookings: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            name: "$user.fullName",
            email: "$user.email",
            bookings: 1,
          },
        },
      ]);

      // Recent bookings
      const recentBookings = await Booking.find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
        .populate("userId", "fullName email")
        .populate("vehicleId", "brand model")
        .sort({ createdAt: -1 })
        .limit(10);

      const formattedRecentBookings = recentBookings.map((b) => ({
        _id: b._id,
        customerName: b.userId?.fullName || "Unknown",
        carBrand: b.vehicleId?.brand || "Unknown",
        carModel: b.vehicleId?.model || "Unknown",
        bookingDate: b.createdAt,
        totalPrice: b.totalPrice,
        status: b.status,
      }));

      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalBookings,
            totalRevenue,
            totalCustomers,
            averageBookingValue,
          },
          revenueByDay: revenueByDay.map((d) => ({
            date: d._id,
            total: d.total,
          })),
          popularCars: popularCars || [],
          topCustomers: topCustomers || [],
          recentBookings: formattedRecentBookings,
        },
      });
    } catch (error) {
      console.error("Reports error:", error);
      return res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
      });
    }
  }
}

const adminController = new AdminController();
module.exports = adminController;
