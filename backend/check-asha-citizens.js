require("dotenv").config();
const pool = require("./db");

async function checkAshaAssignments() {
    try {
        // Show all ASHA workers with their citizen counts
        const asha = await pool.query(`
      SELECT u.id, u.name, u.email, COUNT(c.id) AS citizen_count
      FROM users u
      LEFT JOIN users c ON c.asha_id = u.id AND c.role = 'citizen'
      WHERE u.role = 'asha'
      GROUP BY u.id
      ORDER BY citizen_count DESC
    `);
        console.log("🔑 ASHA Workers & their citizen counts:");
        asha.rows.forEach(a =>
            console.log(`  id=${a.id} | ${a.email} | citizens=${a.citizen_count}`)
        );

        // Show all citizens without asha_id
        const orphans = await pool.query(
            "SELECT id, name, email FROM users WHERE role='citizen' AND asha_id IS NULL"
        );
        if (orphans.rows.length > 0) {
            console.log(`\n⚠️  Citizens with NO asha_id (${orphans.rows.length}):`);
            orphans.rows.forEach(c => console.log(`  id=${c.id} | ${c.name} | ${c.email}`));
        } else {
            console.log("\n✅ All citizens have an asha_id assigned.");
        }

        // Show health_queries submitted (latest 5)
        const hq = await pool.query(`
      SELECT hq.id, hq.user_id, u.name, hq.symptoms, hq.risk_level, hq.created_at
      FROM health_queries hq
      JOIN users u ON u.id = hq.user_id
      ORDER BY hq.created_at DESC
      LIMIT 5
    `);
        console.log(`\n📋 Latest ${hq.rows.length} health queries:`);
        if (hq.rows.length === 0) {
            console.log("  (none submitted yet)");
        }
        hq.rows.forEach(q =>
            console.log(`  hq_id=${q.id} | citizen=${q.name}(id=${q.user_id}) | risk=${q.risk_level} | ${q.created_at}`)
        );

        await pool.end();
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}
checkAshaAssignments();
