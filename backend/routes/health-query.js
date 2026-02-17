const express = require("express");
const router = express.Router();
const pool = require("../db");
const { upload, uploadToS3 } = require("../services/upload-service");
const authenticateToken = require("../middleware/authMiddleware");

const fs = require('fs');

// POST /api/health-query
router.post("/", authenticateToken, upload.array("files", 5), async (req, res) => {
    try {
        const {
            symptoms, duration, severity,
            temperature, spo2, bp, sugar, is_diabetic
        } = req.body;

        const userId = req.user.id; // From auth middleware

        // 1. Upload files to S3
        const fileUrls = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                try {
                    const url = await uploadToS3(file);
                    fileUrls.push({
                        name: file.originalname,
                        type: file.mimetype,
                        url: url
                    });
                } catch (uploadError) {
                    console.error(`⚠️ S3 Upload Failed for file ${file.originalname}:`, uploadError.message);
                    // Optionally push a placeholder or null for failed uploads, or just skip
                    fileUrls.push({
                        name: file.originalname,
                        type: file.mimetype,
                        url: null, // Indicate upload failed
                        error: uploadError.message
                    });
                }
            }
        }

        // 2. Logic: AI vs Manual
        let aiResponse = null;
        let finalResponse = {};

        if (symptoms && symptoms.trim().length > 0) {
            // ✅ Text Exists -> AI Analysis
            try {
                // 1. Fetch History Context (Last 5 queries)
                const historyResult = await pool.query(
                    `SELECT symptoms, ai_response, created_at 
                     FROM health_queries 
                     WHERE user_id = $1 
                     ORDER BY created_at DESC 
                     LIMIT 5`,
                    [userId]
                );

                const historyContext = historyResult.rows.map(row => {
                    const date = new Date(row.created_at).toLocaleDateString();
                    let response = {};
                    try {
                        response = typeof row.ai_response === 'string' ? JSON.parse(row.ai_response) : row.ai_response;
                    } catch (e) {
                        response = { risk_level: "UNKNOWN", action: "UNKNOWN" };
                    }
                    return `Date: ${date}, Symptoms: ${row.symptoms}, Risk: ${response.risk_level || 'N/A'}, Action: ${response.action || 'N/A'}`;
                }).join('\n');

                const { analyzeHealthQuery } = require("../services/ai-service");
                aiResponse = await analyzeHealthQuery(symptoms, historyContext);

                // Ensure structure matches
                finalResponse = {
                    status: "success",
                    analysis_type: "AI",
                    risk_level: aiResponse.risk_level || "UNKNOWN",
                    action: aiResponse.action || "ASHA_FOLLOWUP",
                    user_message: aiResponse.user_message || {
                        title: "Analysis Complete",
                        description: "We have analyzed your symptoms."
                    },
                    asha: aiResponse.asha || { notified: true, priority: "NORMAL" },
                    case_id: `HBQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`
                };

            } catch (error) {
                console.error("AI Service Failed:", error);

                // 🔍 DEBUG LOGGING 🔍
                try {
                    const logData = `Date: ${new Date().toISOString()}\nError: ${error.message}\nStack: ${error.stack}\nDetails: ${JSON.stringify(error, null, 2)}\n---\n`;
                    fs.writeFileSync('ai-error.log', logData, { flag: 'a' });
                } catch (fsErr) {
                    console.error("Failed to write to log file:", fsErr);
                }

                // Fallback if AI fails but text exists
                finalResponse = {
                    status: "success",
                    analysis_type: "MANUAL", // Fallback to manual
                    risk_level: "UNKNOWN",
                    action: "ASHA_FOLLOWUP",
                    user_message: {
                        title: "Query Received",
                        description: "We have received your details. The AI service is currently unavailable, but we have forwarded your query to the ASHA worker."
                    },
                    asha: { notified: true, priority: "NORMAL" },
                    case_id: `HBQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`
                };
            }
        } else {
            // ✅ CASE 1: NO TEXT (MEDIA ONLY) -> MANUAL
            finalResponse = {
                status: "success",
                analysis_type: "MANUAL",
                risk_level: "UNKNOWN",
                action: "ASHA_FOLLOWUP",
                user_message: {
                    title: "Query received",
                    description: "Thank you for sharing your details. We have forwarded your query to the ASHA worker. She will contact you soon. Please do not worry."
                },
                asha: { notified: true, priority: "NORMAL" },
                case_id: `HBQ-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-4)}`
            };
        }

        // 3. Save to Database
        const query = `
      INSERT INTO health_queries 
      (user_id, symptoms, duration, severity, temperature, spo2, bp, sugar, is_diabetic, files, ai_response, analysis_type, risk_level, action, asha_notified, asha_priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *;
    `;

        const values = [
            userId,
            symptoms || "", // Ensure not null
            duration,
            parseInt(severity) || 0,
            temperature ? parseFloat(temperature) : null,
            spo2 ? parseInt(spo2) : null,
            bp,
            sugar ? parseInt(sugar) : null,
            is_diabetic === 'true',
            JSON.stringify(fileUrls),
            JSON.stringify(finalResponse), // Store full response as ai_response for now
            finalResponse.analysis_type,
            finalResponse.risk_level,
            finalResponse.action,
            finalResponse.asha.notified,
            finalResponse.asha.priority
        ];

        const result = await pool.query(query, values);

        // 4. Return Final Response
        res.status(201).json(finalResponse);

    } catch (error) {
        console.error("Submit Query Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// GET /api/health-query/history
router.get("/history", authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            "SELECT * FROM health_queries WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;
