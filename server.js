const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const app = require("./main/app");

const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL;

const server = http.createServer(app);

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("URL Validated"))
  .catch((error) => console.error(error));

mongoose.connection.once("open", () =>
  console.log("DB connected successfully"),
);

mongoose.connection.on("error", (error) => console.error(`Error: ${error}`));

// Add a simple health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Also handle root
app.get("/", (req, res) => {
  res.json({
    message: "🚗 Car Rental API is running!",
    docs: "/api/v1/docs",
  });
});

server.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}...`);
});

// mongodb acc pass: fpGCKOdhzBH5LWwJ
