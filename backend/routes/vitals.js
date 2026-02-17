// backend/routes/vitals.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const { verifyToken } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/roleMiddleware");

/**
 * POST /api/vitals/save
 */
router.post("/save", verifyToken, checkRole("citizen"), async (req, res) => {
  try {
    const { temperature, spo2, bp, sugar, isDiabetic } = req.body;

    if (!temperature && !spo2 && !bp) {
      return res.status(400).json({
        error: "Please enter at least one vital (temperature, SpO2, or BP).",
      });
    }

    // Auto warnings generate karo
    const warnings = [];

    if (temperature) {
      const t = parseFloat(temperature);
      if (t > 103) warnings.push("High fever detected. Monitor closely.");
      if (t < 95 || t > 107) warnings.push("Temperature reading seems unusual.");
    }
    if (spo2) {
      const o = parseInt(spo2);
      if (o < 90) warnings.push("⚠️ SpO2 below 90% — possible emergency!");
      else if (o < 95) warnings.push("SpO2 is low. Rest and consult doctor if it persists.");
    }
    if (bp) {
      const [sys, dia] = bp.split("/").map(Number);
      if (sys > 180 || dia > 110) warnings.push("⚠️ Very high BP. Seek medical attention now.");
      else if (sys > 140 || dia > 90) warnings.push("BP is elevated. Please consult your doctor.");
    }

    const { rows } = await db.query(
      `INSERT INTO vitals (citizen_id, temperature, spo2, bp, sugar_level, is_diabetic, warnings)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.id,
        temperature ? parseFloat(temperature) : null,
        spo2 ? parseInt(spo2) : null,
        bp || null,
        sugar ? parseInt(sugar) : null,
        isDiabetic || false,
        warnings,
      ]
    );

    return res.status(201).json({
      success: true,
      vitals: rows[0],
      warnings,
      message: warnings.length > 0
        ? "Vitals saved. Please check the warnings."
        : "Vitals saved successfully!",
    });
  } catch (error) {
    console.error("❌ Save vitals error:", error);
    return res.status(500).json({ error: "Failed to save vitals" });
  }
});

/**
 * GET /api/vitals/latest
 */
router.get("/latest", verifyToken, checkRole("citizen"), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM vitals WHERE citizen_id = $1 ORDER BY recorded_at DESC LIMIT 10`,
      [req.user.id]
    );
    return res.json({ success: true, vitals: rows });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch vitals" });
  }
});

module.exports = router;