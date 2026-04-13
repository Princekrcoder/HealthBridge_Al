const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");

const router = express.Router();

/**
 * POST /api/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ user find karo
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = result.rows[0];

    // 2️⃣ password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Session me user snapshot save karo
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      asha_id: user.asha_id,
      doctor_id: user.doctor_id,
      sc_id: user.sc_id,
    };

    // 4️⃣ Session persist hone ke baad response bhejo
    req.session.save((saveError) => {
      if (saveError) {
        console.error("SESSION SAVE ERROR:", saveError);
        return res.status(500).json({ message: "Session creation failed" });
      }

      return res.json({ user: req.session.user });
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/me", (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  return res.json({ user: req.session.user });
});

router.post("/logout", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("LOGOUT ERROR:", error);
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie(process.env.SESSION_COOKIE_NAME || "healthbridge.sid");
    return res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
