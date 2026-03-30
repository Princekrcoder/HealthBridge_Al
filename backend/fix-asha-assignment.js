require("dotenv").config();
const pool = require("./db");

async function fixAshaAssignment() {
    try {
        // Get the first ASHA worker's ID
        const ashaRes = await pool.query(
            "SELECT id, name FROM users WHERE role = 'asha' ORDER BY id LIMIT 1"
        );
        if (ashaRes.rows.length === 0) {
            console.log("❌ No ASHA worker found in DB.");
            return;
        }
        const ashaId = ashaRes.rows[0].id;
        const ashaName = ashaRes.rows[0].name;
        console.log(`✅ Using ASHA: ${ashaName} (id=${ashaId})`);

        // Assign all citizens with asha_id = NULL to this ASHA
        const updateRes = await pool.query(
            `UPDATE users SET asha_id = $1
       WHERE role = 'citizen' AND asha_id IS NULL
       RETURNING id, name`,
            [ashaId]
        );

        console.log(`\n✅ Assigned ${updateRes.rowCount} unassigned citizens to ASHA ${ashaName}:`);
        updateRes.rows.forEach(u => console.log(`   - ${u.name} (id=${u.id})`));

        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}

fixAshaAssignment();
