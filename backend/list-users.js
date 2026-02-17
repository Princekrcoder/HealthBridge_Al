require("dotenv").config();
const pool = require("./db");

async function listUsers() {
    try {
        console.log("📋 Fetching all users from database...\n");

        const result = await pool.query(`
      SELECT id, name, email, role, phone 
      FROM users 
      ORDER BY role, name
      LIMIT 20
    `);

        if (result.rows.length === 0) {
            console.log("No users found in database.");
            process.exit(0);
        }

        console.log(`Found ${result.rows.length} users (showing first 20):\n`);

        // Group by role
        const byRole = {};
        result.rows.forEach((user) => {
            if (!byRole[user.role]) {
                byRole[user.role] = [];
            }
            byRole[user.role].push(user);
        });

        Object.keys(byRole).forEach((role) => {
            console.log(`\n🔹 ${role.toUpperCase()} (${byRole[role].length} users):`);
            byRole[role].forEach((user) => {
                console.log(`   📧 ${user.email}`);
                console.log(`      Name: ${user.name}`);
                console.log(`      Phone: ${user.phone || "N/A"}`);
            });
        });

        console.log("\n💡 To login, use any email above with its password.");
        console.log("   (Note: I cannot see passwords from the database)");

        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

listUsers();
