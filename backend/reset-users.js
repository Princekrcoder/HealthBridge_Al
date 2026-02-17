require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function resetTestUsers() {
    try {
        console.log("🗑️  Deleting old test users...");

        // Delete all users with @test.com emails
        const deleteResult = await pool.query(
            "DELETE FROM users WHERE email LIKE '%@test.com'"
        );

        console.log(`✅ Deleted ${deleteResult.rowCount} old test users\n`);

        console.log("🌱 Creating new test users...");

        // Test users with simple passwords
        const users = [
            {
                name: "Test Citizen",
                email: "citizen@test.com",
                password: "password",
                role: "citizen",
            },
            {
                name: "Test ASHA Worker",
                email: "asha@test.com",
                password: "password",
                role: "asha",
            },
            {
                name: "Test Doctor",
                email: "doctor@test.com",
                password: "password",
                role: "doctor",
            },
            {
                name: "Test Sub-Center",
                email: "subcenter@test.com",
                password: "password",
                role: "sub-center",
            },
            {
                name: "Test Clinical",
                email: "clinical@test.com",
                password: "password",
                role: "clinical",
            },
            {
                name: "Test Admin",
                email: "admin@test.com",
                password: "password",
                role: "admin",
            },
        ];

        for (const user of users) {
            // Hash password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // Insert user
            await pool.query(
                `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)`,
                [user.name, user.email, hashedPassword, user.role]
            );

            console.log(`✅ Created: ${user.email} (${user.role})`);
        }

        console.log("\n🎉 Reset completed successfully!");
        console.log("\n📝 Test Credentials (All roles):");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("   citizen@test.com    | password");
        console.log("   asha@test.com       | password");
        console.log("   doctor@test.com     | password");
        console.log("   subcenter@test.com  | password");
        console.log("   clinical@test.com   | password");
        console.log("   admin@test.com      | password");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset failed:", error.message);
        process.exit(1);
    }
}

resetTestUsers();
