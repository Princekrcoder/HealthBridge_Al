require("dotenv").config();
const pool = require("./db");

async function fixAllTestAssignment() {
    try {
        // Get asha@test.com id
        const ashaRes = await pool.query("SELECT id, name FROM users WHERE email = 'asha@test.com'");
        const ashaId = ashaRes.rows[0].id;
        console.log(`✅ Target ASHA: ${ashaRes.rows[0].name} (id=${ashaId})`);

        // Reassign ALL named test citizens (133-147 range) + citizen@test.com to asha@test.com
        const update = await pool.query(
            `UPDATE users SET asha_id = $1
       WHERE role = 'citizen'
         AND (
           id IN (129, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147)
           OR email = 'citizen@test.com'
         )
       RETURNING id, name, email`,
            [ashaId]
        );

        console.log(`\n✅ Reassigned ${update.rowCount} citizens to asha@test.com:`);
        update.rows.forEach(c => console.log(`   - ${c.name} (${c.email})`));

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}
fixAllTestAssignment();
