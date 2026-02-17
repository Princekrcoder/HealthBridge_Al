require("dotenv").config();
const pool = require("./db");

async function checkTestUsers() {
    try {
        const result = await pool.query(`
      SELECT name, email, role 
      FROM users 
      WHERE email LIKE '%@test.com'
      ORDER BY role
    `);

        console.log(`\n✅ Found ${result.rowCount} test users:\n`);
        result.rows.forEach((user) => {
            console.log(`   ${user.role.padEnd(12)} | ${user.email.padEnd(25)} | ${user.name}`);
        });
        console.log();

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

checkTestUsers();
