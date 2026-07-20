const { UploadStream } = require("cloudinary");
const cloudinary = require("../config/cloudinary");
const Car = require("../models/car.model");

class CarController {
  async httpAllCars(req, res) {
    try {
      const { type, brand, model, seats, minPrice, maxPrice, search } =
        req.query;
      let query = {};

      if (type) {
        query.vehicleType = type;
      }

      if (brand) {
        query.brand = { $regex: brand, $options: "i" };
      }

      if (model) {
        query.model = { $regex: model, $options: "i" };
      }

      if (seats) {
        query.seats = seats;
      }

      if (minPrice || maxPrice) {
        query.costPerKM = {};
        if (minPrice) query.costPerKM.$gte = Number(minPrice);
        if (maxPrice) query.costPerKM.$lte = Number(maxPrice);
      }

      if (search) {
        query.$or = [
          { brand: { $regex: search, $options: "i" } },
          { model: { $regex: search, $options: "i" } },
        ];
      }

      const cars = await Car.find(query)
        .select("-licensePlateNo -mileage -doors -yom")
        .sort({ rental_price: 1 });
      if (cars.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "No car found." });
      }

      return res.status(200).json({
        success: true,
        message: `${cars.length} has found!`,
        vehicles: cars,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetCar(req, res) {
    try {
      const { carId } = req.params;

      const car = await Car.findById(carId).select(
        "-licensePlateNo -mileage -doors -yom",
      );

      if (!car) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, Something went wrong." });
      }

      return res.status(200).json({
        success: true,
        message: "Car details fetched ✅",
        vehicle: car,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpGetAvailableCars(req, res) {
    try {
      const cars = await Car.find({ isAvailable: true })
        .select("-licensePlateNo -mileage -doors -yom")
        .sort({ rental_price: 1 });

      if (!cars) {
        return res
          .status(404)
          .json({ success: false, message: "No cars available at the moment" });
      }

      return res.status(200).json({
        success: true,
        message: "Car details fetched ✅",
        vehicles: cars,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }
}

const carController = new CarController();
module.exports = carController;
