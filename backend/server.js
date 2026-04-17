// ================================
// 1️⃣ Env load (sabse upar)
// ================================
require("dotenv").config();

// ================================
// 2️⃣ Imports
// ================================
const http    = require("http");
const express = require("express");
const cors    = require("cors");
const session = require("express-session");
const connectPgSimple = require("connect-pg-simple");
const { Server: SocketIOServer } = require("socket.io");
const pool = require("./db");

// Middleware imports
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

// Routes
const authRoutes        = require("./routes/auth");
const dashboardRoutes   = require("./routes/dashboard");
const healthQueryRoutes = require("./routes/health-query");
const screeningRoutes   = require("./routes/screening");

// ================================
// 3️⃣ App initialize
// ================================
const app    = express();
let server = http.createServer(app);

const PgSession = connectPgSimple(session);
const isProduction = process.env.NODE_ENV === "production";
const frontendOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// ================================
// 4️⃣ Global middlewares
// ================================
app.set("trust proxy", 1);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || frontendOrigins.length === 0 || frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked for this origin"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    name: process.env.SESSION_COOKIE_NAME || "healthbridge.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// ================================
// 5️⃣ Public routes
// ================================
app.use("/api", authRoutes);

// 🔹 Dashboard routes register
app.use("/api/dashboard",   dashboardRoutes);
app.use("/api/health-query", healthQueryRoutes);
app.use("/api/screening",   screeningRoutes);

// ================================
// 6️⃣ Test route (DB check)
// ================================
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "success",
      time: result.rows[0],
    });
  } catch (err) {
    console.error("DB ERROR:", err);
    res.status(500).json({ error: "DB connection failed" });
  }
});

// ================================
// 7️⃣ Protected routes (JWT required)
// ================================

// 🔒 Any logged-in user
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "Protected route accessed successfully",
    user: req.user,
  });
});

// 🔒 Only DOCTOR role
app.get(
  "/api/doctor-only",
  authMiddleware,
  roleMiddleware("doctor"),
  (req, res) => {
    res.json({ message: "Doctor dashboard access granted" });
  }
);

//  Only ASHA role
app.get(
  "/api/asha-only",
  authMiddleware,
  roleMiddleware("asha"),
  (req, res) => {
    res.json({ message: "ASHA dashboard access granted" });
  }
);

// 🔒 Only CITIZEN role
app.get(
  "/api/citizen-only",
  authMiddleware,
  roleMiddleware("citizen"),
  (req, res) => {
    res.json({ message: "Citizen dashboard access granted" });
  }
);

// ================================
// 8️⃣ Socket.IO — WebRTC Signaling
// ================================
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
    methods: ["GET", "POST"],
  },
  path: "/socket.io",
});

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join a screening room
  socket.on("join-room", ({ roomId, role }) => {
    socket.join(roomId);
    socket.to(roomId).emit("peer-joined", { role, socketId: socket.id });
    console.log(`📡 ${role} joined room ${roomId}`);
  });

  // WebRTC offer (caller → callee)
  socket.on("offer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("offer", { sdp, from: socket.id });
  });

  // WebRTC answer (callee → caller)
  socket.on("answer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("answer", { sdp, from: socket.id });
  });

  // ICE candidate exchange
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Call ended by ASHA
  socket.on("call-ended", ({ roomId }) => {
    socket.to(roomId).emit("call-ended");
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ================================
// 9️⃣ Server listen (last line)
// ================================
server.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
