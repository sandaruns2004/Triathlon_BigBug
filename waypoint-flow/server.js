const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = process.env.PORT || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a room based on depot
    socket.on("join:depot", (depot) => {
      socket.join(`depot:${depot}`);
      console.log(`[Socket] ${socket.id} joined depot:${depot}`);
    });

    // Join a room based on vehicle
    socket.on("join:vehicle", (vehicleId) => {
      socket.join(`vehicle:${vehicleId}`);
      console.log(`[Socket] ${socket.id} joined vehicle:${vehicleId}`);
    });

    // Driver app sends a location update
    socket.on("driver:location", (data) => {
      const { vehicleId, lat, lng, depot } = data;
      // Broadcast to anyone listening to this vehicle
      io.to(`vehicle:${vehicleId}`).emit("vehicle:location_update", data);
      // Also broadcast to the depot room for the dispatcher's map
      if (depot) {
        io.to(`depot:${depot}`).emit("vehicle:location_update", data);
      }
    });

    // Store manager places an order
    socket.on("store:new_order", (data) => {
      const { depot, orderId } = data;
      // Alert the dispatcher
      if (depot) {
        io.to(`depot:${depot}`).emit("dispatcher:order_placed", data);
      }
    });

    // Loader reports a shortfall
    socket.on("loader:shortfall", (data) => {
      const { depot } = data;
      if (depot) {
        io.to(`depot:${depot}`).emit("dispatcher:shortfall_alert", data);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
