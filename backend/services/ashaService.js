// backend/services/ashaService.js
// Supabase nahi — tera existing db.js use ho raha hai

const db = require("../db");

/**
 * Citizen query submit karne pe ASHA ko notify karo
 * asha_notifications table mein entry create hogi
 * ASHA dashboard wahan se padhega
 */
const notifyAsha = async ({ ashaId, citizenId, queryId, citizenName, symptoms, risk, urgency, ashaMessage }) => {
  try {
    if (!ashaId) {
      console.warn(`⚠️ No ASHA assigned to citizen ${citizenId}`);
      return false;
    }

    await db.query(
      `INSERT INTO asha_notifications
        (asha_id, citizen_id, query_id, citizen_name, symptoms_summary,
         risk_level, urgency, message, status, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', FALSE)`,
      [
        ashaId,
        citizenId,
        queryId,
        citizenName,
        symptoms.substring(0, 200),
        risk,
        urgency,
        ashaMessage,
      ]
    );

    console.log(`✅ ASHA ${ashaId} notified for citizen ${citizenId} | Risk: ${risk}`);
    return true;
  } catch (err) {
    console.error("❌ notifyAsha error:", err);
    return false;
  }
};

/**
 * ASHA worker ke saare pending notifications fetch karo
 * ASHA dashboard mein use hoga
 */
const getAshaNotifications = async (ashaId) => {
  const { rows } = await db.query(
    `SELECT
       n.*,
       sq.symptoms        AS full_symptoms,
       sq.potential_condition,
       sq.created_at      AS query_time
     FROM asha_notifications n
     LEFT JOIN symptom_queries sq ON n.query_id = sq.id
     WHERE n.asha_id = $1
     ORDER BY n.created_at DESC
     LIMIT 50`,
    [ashaId]
  );
  return rows;
};

/**
 * ASHA ne notification read kar li — mark as read
 */
const markNotificationRead = async (notificationId, ashaId) => {
  const { rows } = await db.query(
    `UPDATE asha_notifications
     SET is_read = TRUE, status = 'acknowledged', read_at = NOW()
     WHERE id = $1 AND asha_id = $2
     RETURNING *`,
    [notificationId, ashaId]
  );
  if (rows.length === 0) throw new Error("Notification not found");
  return rows[0];
};

module.exports = { notifyAsha, getAshaNotifications, markNotificationRead };