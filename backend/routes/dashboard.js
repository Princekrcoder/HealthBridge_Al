const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();


/**
 * GET /api/dashboard/summary
 * Returns { name, lastCheck }
 * Accessible by any authenticated user (mostly for Citizen)
 */
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // ...

    // 1. Get User Name
    const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [
      userId,
    ]);
    const userName = userRes.rows[0]?.name || "User";

    // 2. Get Last Check Date (from symptom_queries)
    // Assuming 'created_at' is the timestamp
    const checkRes = await pool.query(
      "SELECT created_at FROM symptom_queries WHERE citizen_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );

    const lastCheck = checkRes.rows[0]?.created_at || null;

    res.json({
      name: userName,
      lastCheck: lastCheck,
    });
  } catch (err) {
    console.error("SUMMARY ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * CITIZEN DASHBOARD
 * citizen → uski ASHA + doctor info
 */
router.get(
  "/citizen",
  authMiddleware,
  roleMiddleware("citizen"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `
        SELECT
          c.name AS citizen_name,
          a.name AS asha_name,
          d.name AS doctor_name
        FROM users c
        LEFT JOIN users a ON c.asha_id = a.id
        LEFT JOIN users d ON a.doctor_id = d.id
        WHERE c.id = $1
        `,
        [userId]
      );

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Citizen dashboard error" });
    }
  }
);

/**
 * ASHA DASHBOARD
 * asha → assigned citizens list
 */
router.get(
  "/asha",
  authMiddleware,
  roleMiddleware("asha"),
  async (req, res) => {
    try {
      const ashaId = req.user.id;

      const result = await pool.query(
        `
        SELECT id, name, email
        FROM users
        WHERE asha_id = $1
        `,
        [ashaId]
      );

      res.json({ citizens: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "ASHA dashboard error" });
    }
  }
);

/**
 * DOCTOR DASHBOARD
 * doctor → ASHA list
 */
router.get(
  "/doctor",
  authMiddleware,
  roleMiddleware("doctor"),
  async (req, res) => {
    try {
      const doctorId = req.user.id;

      const result = await pool.query(
        `
        SELECT id, name, email
        FROM users
        WHERE doctor_id = $1
        `,
        [doctorId]
      );

      res.json({ ashas: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Doctor dashboard error" });
    }
  }
);

module.exports = router;
