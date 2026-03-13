const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const listingRoutes = require("./routes/listingRoutes");
const messagingRoutes = require("./routes/messagingRoutes");
const userRoutes = require("./routes/userRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();
const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

app.use(cors());
app.use(express.json());

const legacyUploadsDir = path.join(__dirname, "../uploads");
if (fs.existsSync(legacyUploadsDir)) {
  // Backward compatibility for previously stored local file URLs.
  app.use("/uploads", express.static(legacyUploadsDir));
}

app.get("/", (req, res) => {
  res.send("API is running");
});

app.use("/api/listings", listingRoutes);
app.use("/api/conversations", messagingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/media", mediaRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join-user", (email) => {
    const normalized = normalizeEmail(email);
    if (!normalized) return;
    socket.join(`user:${normalized}`);
  });

  socket.on("join-conversation", (conversationId) => {
    const id = String(conversationId || "").trim();
    if (!id) return;
    socket.join(`conversation:${id}`);
  });

  socket.on("leave-conversation", (conversationId) => {
    const id = String(conversationId || "").trim();
    if (!id) return;
    socket.leave(`conversation:${id}`);
  });
});

const PORT = process.env.PORT;
server.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  }
  console.error(err);
  process.exit(1);
});
