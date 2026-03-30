require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function seedUsers() {
    try {
        console.log("🌱 Starting user seed...");

        // Step 1: create non-citizen users first (so we have ASHA id available)
        const baseUsers = [
            { name: "Test ASHA Worker", email: "asha@test.com", password: "password", role: "asha" },
            { name: "Test Doctor", email: "doctor@test.com", password: "password", role: "doctor" },
            { name: "Test Sub-Center", email: "subcenter@test.com", password: "password", role: "sub-center" },
            { name: "Test Clinical", email: "clinical@test.com", password: "password", role: "clinical" },
            { name: "Test Admin", email: "admin@test.com", password: "password", role: "admin" },
        ];

        for (const user of baseUsers) {
            const existing = await pool.query("SELECT id FROM users WHERE email = $1", [user.email]);
            if (existing.rows.length > 0) {
                console.log(`⏭️  ${user.email} already exists, skipping...`);
                continue;
            }
            const hash = await bcrypt.hash(user.password, 10);
            await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
                [user.name, user.email, hash, user.role]
            );
            console.log(`✅ Created: ${user.email} (${user.role})`);
        }

        // Step 2: look up the test ASHA id
        const ashaRow = await pool.query("SELECT id FROM users WHERE email = 'asha@test.com'");
        const testAshaId = ashaRow.rows[0]?.id || null;
        console.log(`\n🔑 Test ASHA id = ${testAshaId}`);

        // Step 3: create citizen linked to that ASHA
        const citizenEmail = "citizen@test.com";
        const existingCitizen = await pool.query("SELECT id FROM users WHERE email = $1", [citizenEmail]);
        if (existingCitizen.rows.length > 0) {
            // Update asha_id if already exists but not linked
            await pool.query(
                "UPDATE users SET asha_id = $1 WHERE email = $2 AND asha_id IS DISTINCT FROM $1",
                [testAshaId, citizenEmail]
            );
            console.log(`⏭️  citizen@test.com already exists — asha_id updated to ${testAshaId}`);
        } else {
            const hash = await bcrypt.hash("password", 10);
            await pool.query(
                "INSERT INTO users (name, email, password, role, asha_id) VALUES ($1, $2, $3, $4, $5)",
                ["Test Citizen", citizenEmail, hash, "citizen", testAshaId]
            );
            console.log(`✅ Created: citizen@test.com (citizen) → asha_id=${testAshaId}`);
        }

        console.log("\n🎉 Seed completed!");
        console.log("\n📝 Test Credentials (all passwords: 'password'):");
        console.log("   citizen@test.com  → Citizen portal");
        console.log("   asha@test.com     → ASHA portal  (sees citizen@test.com's queries)");
        console.log("   doctor@test.com   → Doctor portal");

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
}

seedUsers();
