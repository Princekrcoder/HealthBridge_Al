require("dotenv").config();
const pool = require("./db");

async function showUsersByRole() {
    try {
        const result = await pool.query(`
      SELECT role, email 
      FROM users 
      WHERE role IN ('citizen', 'asha', 'doctor', 'sub-center', 'clinical', 'admin')
      ORDER BY role, email
      LIMIT 30
    `);

        console.log("\n========================================");
        console.log("  AVAILABLE TEST USERS BY ROLE");
        console.log("========================================\n");

        const byRole = {};
        result.rows.forEach((user) => {
            if (!byRole[user.role]) byRole[user.role] = [];
            byRole[user.role].push(user.email);
        });

        const roleDisplayNames = {
            citizen: "CITIZEN",
            asha: "ASHA WORKER",
            doctor: "DOCTOR",
            "sub-center": "SUB-CENTER",
            clinical: "CLINICAL",
            admin: "ADMIN",
        };

        Object.keys(byRole).forEach((role) => {
            console.log(`\n🔹 ${roleDisplayNames[role] || role.toUpperCase()}`);
            byRole[role].forEach((email) => {
                console.log(`   📧 ${email}`);
            });
        });

        console.log("\n========================================");
        console.log("💡 TIP: Try logging in with any email above");
        console.log("   Password: unknown (check with your team)");
        console.log("========================================\n");

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

showUsersByRole();
