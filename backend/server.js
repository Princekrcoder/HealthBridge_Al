// ================================
// 1️⃣ Env load (sabse upar)
// ================================
require("dotenv").config();

// ================================
// 2️⃣ Imports
// ================================
const express = require("express");
const cors = require("cors");
const pool = require("./db");

// Middleware imports
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");

// Routes
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const healthQueryRoutes = require("./routes/health-query"); // ✅ New Route

// ================================
// 3️⃣ App initialize
// ================================
const app = express();

// ================================
// 4️⃣ Global middlewares
// ================================
app.use(cors());
app.use(express.json());

// ================================
// 5️⃣ Public routes
// ================================
app.use("/api", authRoutes);

// 🔹 Dashboard routes register
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/health-query", healthQueryRoutes); // ✅ Register new route

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
// 8️⃣ Server listen (last line)
// ================================
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
