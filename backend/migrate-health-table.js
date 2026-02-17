require("dotenv").config();
const pool = require("./db");

async function migrate() {
    try {
        console.log("🛠️ Migrating health_queries table...");

        const queries = [
            "ALTER TABLE health_queries ADD COLUMN IF NOT EXISTS analysis_type VARCHAR(20);",
            "ALTER TABLE health_queries ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20);",
            "ALTER TABLE health_queries ADD COLUMN IF NOT EXISTS action VARCHAR(50);",
            "ALTER TABLE health_queries ADD COLUMN IF NOT EXISTS asha_notified BOOLEAN DEFAULT FALSE;",
            "ALTER TABLE health_queries ADD COLUMN IF NOT EXISTS asha_priority VARCHAR(20);"
        ];

        for (const q of queries) {
            await pool.query(q);
        }

        console.log("✅ Migration successful!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
