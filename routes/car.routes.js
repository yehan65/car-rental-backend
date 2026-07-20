const express = require("express");
const carController = require("../controllers/car.controller");
const authMiddleware = require("../middleware/auth.middleware");
const roleMiddleware = require("../middleware/role.middleware");
const upload = require("../middleware/upload.middleware");

const carRouter = express.Router();

// carRouter.post(
//   "/new",
//   authMiddleware,
//   roleMiddleware("admin"),
//   upload.array("images", 10),
//   carController.httpNewCar,
// );
carRouter.get("/all", carController.httpAllCars);
carRouter.get("/available", carController.httpGetAvailableCars);
carRouter.get("/:carId", carController.httpGetCar);

module.exports = carRouter;
