require("dotenv").config();
const pool = require("./db");

async function checkUsers() {
    try {
        // First check table structure
        const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

        console.log("📊 Users table structure:");
        columns.rows.forEach((col) => {
            console.log(`   - ${col.column_name} (${col.data_type})`);
        });

        // Get users
        const users = await pool.query("SELECT * FROM users LIMIT 10");

        console.log(`\n👥 Found ${users.rows.length} users (showing first 10):\n`);

        users.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${JSON.stringify(user, null, 2)}`);
        });

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkUsers();
