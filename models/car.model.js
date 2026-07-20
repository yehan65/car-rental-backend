const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      required: [true, "Please enter the vehicle type"],
      enum: [
        "HATCHBACK",
        "SEDAN",
        "COUPE",
        "CONVERTIBLE",
        "WAGON",
        "SUV",
        "CROSSOVER",
        "MINIVAN",
        "PICKUP TRUCK",
        "COUPE SUV",
        "MICROCAR",
        "ROADSTER",
        "LIMOUSINE",
        "VAN",
        "GRAN TURISMO (GT)",
      ],
    },
    brand: {
      type: String,
      required: [true, "Please enter the brand of the vehicle"],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Please enter the model name"],
      trim: true,
    },
    yom: {
      type: Number,
      required: [true, "Please enter the Year of made."],
      min: [1900, "Year must be 1900 or later"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },

    // Vehicle Details
    licensePlateNo: {
      type: String,
      required: [true, "Must enter the license plate number."],
      unique: true,
    },
    mileage: {
      type: Number,
      required: [true, "Please enter the mileage"],
      min: [0, "Mileage cannot be negative"],
    },
    num_of_seats: {
      type: Number,
      required: [true, "Please enter the number of seats, vehicle have"],
      min: [1, "Vehicle must have at least 1 seat"],
      max: [15, "Vehicle cannot have more than 15 seats"],
    },
    doors: {
      type: Number,
      default: 4,
    },
    transmission: {
      type: String,
      enum: ["MANUAL", "AUTOMATIC", "CVT", "SEMI-AUTOMATIC"],
      default: "AUTOMATIC",
    },
    fuelType: {
      type: String,
      enum: ["PETROL", "DIESEL", "ELECTRIC", "HYBRID", "LPG"],
      default: "PETROL",
    },
    color: {
      type: String,
      default: "White",
    },

    // Pricing
    price: {
      type: Number,
      required: [true, "Please enter the price of the vehicle"],
    },
    costPerKM: {
      type: Number,
      required: [true, "Please enter the cost per Kilo Meter"],
    },
    rental_price: {
      type: Number,
      required: [true, "Please enter the rental price of the vehicle"],
    },
    security_deposit: {
      type: Number,
      default: 0,
    },

    // Images
    images: [
      {
        type: String,
        default: [],
      },
    ],
    mainImage: {
      type: String,
      default: null,
    },

    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
    },
    last_rental_date: {
      type: Date,
      default: null,
    },
    last_service_date: {
      type: Date,
      default: Date.now(),
    },
    next_service_date: {
      type: Date,
      default: null,
    },

    // Additional Features
    features: [
      {
        type: String,
        // enum: [
        //   "AC",
        //   "GPS",
        //   "Bluetooth",
        //   "Backup Camera",
        //   "Parking Sensors",
        //   "Cruise Control",
        //   "Heated Seats",
        //   "Sunroof",
        //   "Keyless Entry",
        //   "Apple CarPlay",
        // ],
      },
    ],
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    // Location
    location: {
      city: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
    },

    // Rental Stats
    totalRentals: {
      type: Number,
      default: 0,
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bookings",
        // required: true,
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index for faster searches
carSchema.index({ brand: 1, model: 1 });
carSchema.index({ licensePlateNo: 1 });
carSchema.index({ vehicleType: 1 });
carSchema.index({ isAvailable: 1 });
carSchema.index({ rentalPrice: 1 });
carSchema.index({ location: 1 });

// Virtual field: full name
carSchema.virtual("fullName").get(function () {
  return `${this.brand} ${this.model}`;
});

// Virtual field: age of car
carSchema.virtual("age").get(function () {
  return new Date().getFullYear() - this.year;
});

// Method: calculate total rental cost
carSchema.methods.calculateRentalCost = function (days, extras = {}) {
  let total = this.rentalPrice * days;

  if (extras.insurance) total += 20 * days;
  if (extras.gps) total += 5 * days;
  if (extras.childSeat) total += 10 * days;

  return total;
};

const Car = mongoose.model("car", carSchema);
module.exports = Car;
