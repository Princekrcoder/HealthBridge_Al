const express = require("express");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { addClient } = require("../sseManager");

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
 * asha → assigned citizens list with latest health query info
 */
router.get(
  "/asha",
  authMiddleware,
  roleMiddleware("asha"),
  async (req, res) => {
    try {
      const ashaId = req.user.id;

      // Fetch all citizens assigned to this ASHA, plus their latest health query
      const result = await pool.query(
        `
        SELECT
          u.id,
          u.name,
          u.email,
          hq.symptoms       AS latest_symptoms,
          hq.risk_level     AS latest_risk,
          hq.created_at     AS last_query_at,
          hq.severity,
          hq.duration
        FROM users u
        LEFT JOIN LATERAL (
          SELECT symptoms, risk_level, created_at, severity, duration
          FROM health_queries
          WHERE user_id = u.id
          ORDER BY created_at DESC
          LIMIT 1
        ) hq ON true
        WHERE u.asha_id = $1
        ORDER BY hq.created_at DESC NULLS LAST
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
 * GET /api/dashboard/asha/citizen/:id/queries
 * All health queries submitted by a specific citizen (for ASHA to view)
 */
router.get(
  "/asha/citizen/:id/queries",
  authMiddleware,
  roleMiddleware("asha"),
  async (req, res) => {
    try {
      const ashaId = req.user.id;
      const citizenId = req.params.id;

      // Security: ensure this citizen is assigned to this ASHA
      const ownerCheck = await pool.query(
        "SELECT id FROM users WHERE id = $1 AND asha_id = $2",
        [citizenId, ashaId]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ message: "Access denied" });
      }

      const result = await pool.query(
        `SELECT id, symptoms, duration, severity, temperature, spo2, bp, sugar,
                is_diabetic, risk_level, action, analysis_type, ai_response, created_at
         FROM health_queries
         WHERE user_id = $1
         ORDER BY created_at DESC`,
        [citizenId]
      );

      res.json({ queries: result.rows });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching citizen queries" });
    }
  }
);

/**
 * GET /api/dashboard/asha/live
 * Server-Sent Events stream — ASHA worker subscribes here.
 * Fires instantly when a citizen submits a health query.
 */
router.get(
  "/asha/live",
  authMiddleware,
  roleMiddleware("asha"),
  (req, res) => {
    const ashaId = req.user.id;

    // SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering if any
    res.flushHeaders();

    // Send initial heartbeat so client knows connection is alive
    res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

    // Register this response as an SSE client
    const cleanup = addClient(ashaId, res);

    // Heartbeat every 30 s to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try { res.write(`: heartbeat\n\n`); } catch { clearInterval(heartbeat); }
    }, 30_000);

    req.on("close", () => {
      clearInterval(heartbeat);
      cleanup();
    });
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
