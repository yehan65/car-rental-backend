const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const adminController = require("../controllers/admin.controller");
const upload = require("../middleware/upload.middleware");

const adminRouter = express.Router();

// BOOKINGS
adminRouter.get(
  "/bookings/all",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetAllBookings,
);
adminRouter.get(
  "/bookings/today",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetTodayBookings,
);
adminRouter.get(
  "/bookings/weekly",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetWeeklyBookings,
);
adminRouter.get(
  "/bookings/monthly",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetMonthlyBookings,
);
adminRouter.get(
  "/bookings/:bookingId",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpViewSingleBooking,
);
adminRouter.put(
  "/bookings/update/:bookingId",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpUpdateBooking,
);
adminRouter.delete(
  "/bookings/delete/:bookingId",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpDeleteBooking,
);

// VEHICLES
adminRouter.get(
  "/vehicles/all",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetAllVehicles,
);
adminRouter.post(
  "/vehicles/new",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 10),
  adminController.httpNewVehicle,
);
adminRouter.get(
  "/vehicles/:vehicleId",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetSingleVehicle,
);
adminRouter.put(
  "/vehicles/update/:vehicleId",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpUpdateVehicle,
);

adminRouter.delete(
  "/vehicles/delete/:vehicleId",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpDeleteVehicle,
);

// USERS
adminRouter.get(
  "/users/all",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetAllUsers,
);
adminRouter.patch(
  "/users/:userId/toggle",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpToggleUserStatus,
);
adminRouter.delete(
  "/users/:userId/delete",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpDeleteUser,
);

// DASHBOARD
adminRouter.get(
  "/dashboard/stats",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetDashboardStats,
);

adminRouter.get(
  "/reports",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.httpGetReports,
);

module.exports = adminRouter;
