require("dotenv").config();
const pool = require("./db");

async function testConnection() {
    try {
        console.log("Testing database connection...");
        console.log("Host:", process.env.DB_HOST);
        console.log("Port:", process.env.DB_PORT);
        console.log("Database:", process.env.DB_NAME);
        console.log("User:", process.env.DB_USER);
        console.log("Password:", process.env.DB_PASSWORD ? "****" : "NOT SET");

        const result = await pool.query("SELECT NOW()");
        console.log("\n✅ Database connected successfully!");
        console.log("Server time:", result.rows[0].now);

        // Check if users table exists
        const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

        if (tableCheck.rows[0].exists) {
            console.log("✅ 'users' table exists");

            // Count users
            const count = await pool.query("SELECT COUNT(*) FROM users");
            console.log(`📊 Total users in database: ${count.rows[0].count}`);
        } else {
            console.log("❌ 'users' table does NOT exist - you need to create it first!");
        }

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Database connection failed!");
        console.error("Error:", error.message);
        console.error("\nPossible issues:");
        console.error("1. PostgreSQL is not running");
        console.error("2. Database credentials are wrong");
        console.error("3. Database does not exist");
        process.exit(1);
    }
}

testConnection();
