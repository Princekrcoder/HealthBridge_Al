// backend/routes/visits.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

/**
 * GET /api/visits/history
 * Citizen dashboard ka Visit History card
 */
router.get("/history", verifyToken, checkRole("citizen"), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const { rows } = await db.query(
      `SELECT id, symptoms, risk, potential_condition,
              potential_condition_local, urgency, asha_notified, created_at
       FROM symptom_queries
       WHERE citizen_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit]
    );

    // Frontend ke format mein format karo
    const formatted = rows.map((item) => ({
      id: item.id,
      date: new Date(item.created_at).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }),
      symptoms: item.symptoms.length > 60
        ? item.symptoms.substring(0, 60) + "..."
        : item.symptoms,
      risk: item.risk,
      diagnosis: item.potential_condition || "Under review",
      diagnosisLocal: item.potential_condition_local,
      urgency: item.urgency,
      ashaNotified: item.asha_notified,
    }));

    return res.json({ success: true, history: formatted });
  } catch (error) {
    console.error("❌ Visit history error:", error);
    return res.status(500).json({ error: "Failed to fetch visit history" });
  }
});

/**
 * GET /api/visits/:id/summary
 * Single visit ka full detail — "View" button ke liye
 */
router.get("/:id/summary", verifyToken, checkRole("citizen"), async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM symptom_queries WHERE id = $1 AND citizen_id = $2",
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Visit record not found" });
    }

    return res.json({ success: true, visit: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch visit summary" });
  }
});

module.exports = router;