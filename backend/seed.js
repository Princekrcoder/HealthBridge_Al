require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function seedUsers() {
    try {
        console.log("🌱 Starting user seed...");

        // Test users with simple passwords (no phone field)
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

            // Check if user already exists
            const existing = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [user.email]
            );

            if (existing.rows.length > 0) {
                console.log(`⏭️  User ${user.email} already exists, skipping...`);
                continue;
            }

            // Insert user (WITHOUT phone column)
            await pool.query(
                `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)`,
                [user.name, user.email, hashedPassword, user.role]
            );

            console.log(`✅ Created user: ${user.email} (${user.role})`);
        }

        console.log("\n🎉 Seed completed successfully!");
        console.log("\n📝 Test Credentials:");
        console.log("   Email: citizen@test.com | Password: password");
        console.log("   Email: asha@test.com | Password: password");
        console.log("   Email: doctor@test.com | Password: password");
        console.log("   Email: subcenter@test.com | Password: password");
        console.log("   Email: clinical@test.com | Password: password");
        console.log("   Email: admin@test.com | Password: password");

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
}

seedUsers();
