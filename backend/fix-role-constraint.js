require("dotenv").config();
const pool = require("./db");

async function fixRoleConstraint() {
    try {
        console.log("🔍 Checking current role constraint...");

        // Check existing constraint
        const constraintResult = await pool.query(`
            SELECT pg_get_constraintdef(c.oid) as def, c.conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'users' AND c.contype = 'c'
        `);

        console.log("\n📋 Existing constraints:");
        constraintResult.rows.forEach(row => {
            console.log(`   ${row.conname}: ${row.def}`);
        });

        // Drop old constraint and add updated one with all roles
        console.log("\n🔧 Updating role constraint to include all roles...");

        // Drop existing role check constraint if it exists
        for (const row of constraintResult.rows) {
            if (row.conname.includes('role')) {
                await pool.query(`ALTER TABLE users DROP CONSTRAINT "${row.conname}"`);
                console.log(`   ✅ Dropped constraint: ${row.conname}`);
            }
        }

        // Add updated constraint with all needed roles
        await pool.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_role_check 
            CHECK (role IN ('citizen', 'asha', 'doctor', 'sub-center', 'clinical', 'admin'))
        `);
        console.log("   ✅ Added new constraint with all roles");

        // Now seed the missing users
        const bcrypt = require("bcryptjs");

        const missingUsers = [
            { name: "Test Sub-Center", email: "subcenter@test.com", password: "password", role: "sub-center" },
            { name: "Test Clinical", email: "clinical@test.com", password: "password", role: "clinical" },
            { name: "Test Admin", email: "admin@test.com", password: "password", role: "admin" },
        ];

        console.log("\n🌱 Seeding missing users...");
        for (const user of missingUsers) {
            const existing = await pool.query("SELECT id FROM users WHERE email = $1", [user.email]);
            if (existing.rows.length > 0) {
                console.log(`   ⏭️  ${user.email} already exists`);
                continue;
            }
            const hashedPassword = await bcrypt.hash(user.password, 10);
            await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)",
                [user.name, user.email, hashedPassword, user.role]
            );
            console.log(`   ✅ Created: ${user.email} (${user.role})`);
        }

        console.log("\n🎉 Done! All missing users created.");
        console.log("\n📝 Login credentials:");
        console.log("   subcenter@test.com  | password");
        console.log("   clinical@test.com   | password");
        console.log("   admin@test.com      | password");

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        await pool.end();
        process.exit(1);
    }
}

fixRoleConstraint();
