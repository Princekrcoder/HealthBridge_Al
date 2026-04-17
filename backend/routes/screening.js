/**
 * routes/screening.js
 * POST /api/screening/start   → create session
 * GET  /api/screening/:id     → get session info
 * POST /api/screening/:id/end → save notes + duration
 */
require("dotenv").config();
const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const { v4: uuidv4 } = require("uuid");
const { notifyCitizen } = require("../sseManager");

/* ─── Ensure table exists on first import ─── */
pool.query(`
  CREATE TABLE IF NOT EXISTS screening_sessions (
    id               SERIAL PRIMARY KEY,
    session_id       VARCHAR(64) UNIQUE NOT NULL,
    room_id          VARCHAR(64) NOT NULL,
    asha_id          INTEGER REFERENCES users(id),
    patient_id       INTEGER REFERENCES users(id),
    status           VARCHAR(20) DEFAULT 'pending',
    notes            TEXT,
    duration_seconds INTEGER,
    started_at       TIMESTAMP,
    ended_at         TIMESTAMP,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`).catch(err => console.error("⚠️  screening_sessions table error:", err.message));

/* ─── POST /api/screening/start ─── */
router.post("/start", authMiddleware, async (req, res) => {
  try {
    const ashaId   = req.user.id;
    const { patientId } = req.body;

    if (!patientId) return res.status(400).json({ message: "patientId required" });

    // Security: verify this patient is assigned to this ASHA
    const check = await pool.query(
      "SELECT id, name FROM users WHERE id = $1 AND asha_id = $2",
      [patientId, ashaId]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ message: "Citizen not assigned to you" });
    }

    const sessionId = uuidv4();
    const roomId    = uuidv4();

    await pool.query(
      `INSERT INTO screening_sessions
         (session_id, room_id, asha_id, patient_id, status, started_at)
       VALUES ($1, $2, $3, $4, 'pending', NOW())`,
      [sessionId, roomId, ashaId, patientId]
    );

    // 📡 Notify the citizen via SSE — instant popup on their dashboard
    const ashaRes = await pool.query("SELECT name FROM users WHERE id = $1", [ashaId]);
    const ashaName = ashaRes.rows[0]?.name || "Your ASHA Worker";
    notifyCitizen(Number(patientId), { sessionId, ashaName, patientName: check.rows[0].name });

    return res.status(201).json({ sessionId, roomId });
  } catch (err) {
    console.error("Screening start error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ─── GET /api/screening/:sessionId ─── */
router.get("/:sessionId", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         ss.session_id, ss.room_id, ss.status, ss.started_at,
         ss.notes, ss.duration_seconds,
         ua.name  AS asha_name,  ua.email AS asha_email,
         up.name  AS patient_name, up.email AS patient_email,
         hq.symptoms      AS latest_symptoms,
         hq.risk_level    AS latest_risk,
         hq.ai_response   AS latest_ai_response,
         hq.severity, hq.temperature, hq.spo2, hq.bp
       FROM screening_sessions ss
       JOIN users ua ON ua.id = ss.asha_id
       JOIN users up ON up.id = ss.patient_id
       LEFT JOIN LATERAL (
         SELECT symptoms, risk_level, ai_response, severity, temperature, spo2, bp
         FROM health_queries WHERE user_id = ss.patient_id
         ORDER BY created_at DESC LIMIT 1
       ) hq ON true
       WHERE ss.session_id = $1`,
      [req.params.sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const session = result.rows[0];
    const userId  = req.user.id;

    // only ASHA or the patient can access
    const fullRow = await pool.query(
      "SELECT asha_id, patient_id FROM screening_sessions WHERE session_id = $1",
      [req.params.sessionId]
    );
    const { asha_id, patient_id } = fullRow.rows[0];
    if (userId !== asha_id && userId !== patient_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.json(session);
  } catch (err) {
    console.error("Screening get error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ─── POST /api/screening/:sessionId/end ─── */
router.post("/:sessionId/end", authMiddleware, async (req, res) => {
  try {
    const { notes, durationSeconds } = req.body;

    // verify access
    const sess = await pool.query(
      "SELECT asha_id FROM screening_sessions WHERE session_id = $1",
      [req.params.sessionId]
    );
    if (sess.rows.length === 0) return res.status(404).json({ message: "Not found" });
    if (sess.rows[0].asha_id !== req.user.id) return res.status(403).json({ message: "Forbidden" });

    await pool.query(
      `UPDATE screening_sessions
         SET status = 'ended', notes = $1, duration_seconds = $2, ended_at = NOW()
       WHERE session_id = $3`,
      [notes || null, durationSeconds || 0, req.params.sessionId]
    );

    return res.json({ message: "Session ended" });
  } catch (err) {
    console.error("Screening end error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
