require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("./db");

async function createCitizens() {
    try {
        console.log("🌱 Creating 15 citizen users...\n");

        const indianNames = [
            "Ramesh Kumar",
            "Sunita Devi",
            "Amit Patel",
            "Priya Sharma",
            "Rajesh Singh",
            "Geeta Yadav",
            "Suresh Gupta",
            "Anita Verma",
            "Vijay Reddy",
            "Sita Kumari",
            "Mahesh Joshi",
            "Rekha Nair",
            "Deepak Shah",
            "Kavita Desai",
            "Arun Pillai"
        ];

        let created = 0;
        let skipped = 0;

        for (let i = 0; i < 15; i++) {
            const email = `citizen${i + 1}@test.com`;
            const name = indianNames[i];
            const password = "password";
            const role = "citizen";

            // Check if user already exists
            const existing = await pool.query(
                "SELECT * FROM users WHERE email = $1",
                [email]
            );

            if (existing.rows.length > 0) {
                console.log(`⏭️  ${email} already exists, skipping...`);
                skipped++;
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            await pool.query(
                `INSERT INTO users (name, email, password, role) 
         VALUES ($1, $2, $3, $4)`,
                [name, email, hashedPassword, role]
            );

            console.log(`✅ Created: ${email} | ${name}`);
            created++;
        }

        console.log("\n" + "=".repeat(50));
        console.log(`🎉 Done! Created ${created} new citizens, skipped ${skipped}`);
        console.log("=".repeat(50));
        console.log("\n📝 Login Credentials:");
        console.log("   Email: citizen1@test.com  | Password: password");
        console.log("   Email: citizen2@test.com  | Password: password");
        console.log("   Email: citizen3@test.com  | Password: password");
        console.log("   ...");
        console.log("   Email: citizen15@test.com | Password: password");
        console.log("\n💡 All passwords: password");

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

createCitizens();
