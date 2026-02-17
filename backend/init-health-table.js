require("dotenv").config();
const pool = require("./db");

async function createHealthTable() {
    try {
        console.log("🛠️ Creating health_queries table...");

        const query = `
      CREATE TABLE IF NOT EXISTS health_queries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        symptoms TEXT NOT NULL,
        duration VARCHAR(50),
        severity INTEGER,
        temperature DECIMAL(4, 1),
        spo2 INTEGER,
        bp VARCHAR(20),
        sugar INTEGER,
        is_diabetic BOOLEAN DEFAULT FALSE,
        files JSONB DEFAULT '[]'::jsonb,
        ai_response JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        await pool.query(query);
        console.log("✅ health_queries table created successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error creating table:", error);
        process.exit(1);
    }
}

createHealthTable();
