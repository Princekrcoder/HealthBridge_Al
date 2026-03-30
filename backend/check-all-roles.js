require("dotenv").config();
const pool = require("./db");

async function checkAll() {
    const result = await pool.query(
        "SELECT role, email FROM users WHERE email LIKE '%@test.com' ORDER BY role, email"
    );
    console.log(`\n✅ Found ${result.rowCount} test users:\n`);
    result.rows.forEach(u => console.log(`   ${u.role.padEnd(12)} | ${u.email}`));

    const expected = ["asha@test.com", "admin@test.com", "clinical@test.com", "citizen@test.com", "doctor@test.com", "subcenter@test.com"];
    const found = result.rows.map(u => u.email);
    console.log("\n🔍 Missing users:");
    expected.forEach(e => {
        if (!found.includes(e)) console.log(`   ❌ ${e}`);
    });
    if (expected.every(e => found.includes(e))) console.log("   None! All present ✅");

    await pool.end();
}

checkAll().catch(e => { console.error(e.message); process.exit(1); });
