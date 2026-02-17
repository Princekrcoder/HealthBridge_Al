// backend/routes/symptoms.js
// Existing authMiddleware aur db.js use ho raha hai — Supabase nahi

const express = require("express");
const router = express.Router();
const db = require("../db");                              // ← tera existing db.js
const { verifyToken } = require("../middleware/authMiddleware");   // ← tera existing middleware
const { checkRole } = require("../middleware/roleMiddleware");
const { analyzeSymptoms } = require("../services/groqService");
const { notifyAsha } = require("../services/ashaService");

/**
 * POST /api/symptoms/analyze
 * Citizen symptoms submit karta hai → AI analysis → ASHA notify
 */
router.post(
  "/analyze",
  verifyToken,
  checkRole("citizen"),
  async (req, res) => {
    try {
      const { symptoms, patientProfile } = req.body;
      const citizenId = req.user.id;          // JWT se aata hai

      // ─── Validation ───────────────────────────────
      if (!symptoms || symptoms.trim().length < 5) {
        return res.status(400).json({
          error: "Please describe your symptoms in at least a few words.",
        });
      }
      if (symptoms.length > 2000) {
        return res.status(400).json({ error: "Description too long (max 2000 chars)." });
      }

      // ─── Step 1: Citizen ka profile fetch karo ────
      const profileResult = await db.query(
        "SELECT name, asha_id FROM users WHERE id = $1 AND role = 'citizen'",
        [citizenId]
      );
      if (profileResult.rows.length === 0) {
        return res.status(404).json({ error: "Citizen profile not found" });
      }
      const citizen = profileResult.rows[0];

      // ─── Step 2: Groq AI Analysis ─────────────────
      const aiResult = await analyzeSymptoms({
        symptoms: symptoms.trim(),
        patientProfile: {
          age: patientProfile?.age || 30,
          gender: patientProfile?.gender || "M",
        },
      });

      // ─── Step 3: Save to DB ───────────────────────
      const insertResult = await db.query(
        `INSERT INTO symptom_queries
          (citizen_id, symptoms, risk, statement, potential_condition,
           potential_condition_local, reasoning, home_care, disclaimer,
           language, urgency, asha_notified)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [
          citizenId,
          symptoms.trim(),
          aiResult.risk,
          aiResult.statement,
          aiResult.potentialCondition,
          aiResult.potentialConditionLocal,
          aiResult.reasoning,
          aiResult.homeCare,          // PostgreSQL TEXT[] array
          aiResult.disclaimer,
          aiResult.language,
          aiResult.urgency,
          false,
        ]
      );
      const queryId = insertResult.rows[0].id;

      // ─── Step 4: ASHA Notify ──────────────────────
      let ashaNotified = false;

      if (citizen.asha_id) {
        const notified = await notifyAsha({
          ashaId: citizen.asha_id,
          citizenId,
          queryId,
          citizenName: citizen.name,
          symptoms: symptoms.trim(),
          risk: aiResult.risk,
          urgency: aiResult.urgency,
          ashaMessage: aiResult.ashaMessage,
        });

        if (notified) {
          await db.query(
            "UPDATE symptom_queries SET asha_notified = TRUE WHERE id = $1",
            [queryId]
          );
          ashaNotified = true;
        }
      }

      // ─── Step 5: Response ─────────────────────────
      return res.status(200).json({
        success: true,
        queryId,
        result: {
          risk: aiResult.risk,
          statement: aiResult.statement,
          potentialCondition: aiResult.potentialCondition,
          potentialConditionLocal: aiResult.potentialConditionLocal,
          reasoning: aiResult.reasoning,
          homeCare: aiResult.homeCare,
          disclaimer: aiResult.disclaimer,
          language: aiResult.language,
          urgency: aiResult.urgency,
          ashaNotified,
        },
      });
    } catch (error) {
      console.error("❌ Symptom analysis error:", error);

      if (error.status === 429 || error.message?.includes("429")) {
        return res.status(429).json({
          error: "AI abhi busy hai. Thoda wait karke dobara try karein.",
        });
      }

      return res.status(500).json({
        error: "Analysis failed. Please try again.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

/**
 * GET /api/symptoms/history
 * Citizen ki past queries
 */
router.get("/history", verifyToken, checkRole("citizen"), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, symptoms, risk, potential_condition, asha_notified, created_at
       FROM symptom_queries
       WHERE citizen_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    return res.json({ success: true, history: rows });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch history" });
  }
});

/**
 * GET /api/symptoms/:id
 * Single query detail
 */
router.get("/:id", verifyToken, checkRole("citizen"), async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM symptom_queries WHERE id = $1 AND citizen_id = $2",
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Query not found" });
    return res.json({ success: true, query: rows[0] });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch query" });
  }
});

module.exports = router;