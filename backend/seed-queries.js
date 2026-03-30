require("dotenv").config();
const pool = require("./db");

async function seedQueries() {
    try {
        // Get all citizens under asha@test.com
        const ashaRes = await pool.query("SELECT id FROM users WHERE email='asha@test.com'");
        const ashaId = ashaRes.rows[0]?.id;
        if (!ashaId) { console.log("❌ asha@test.com not found"); return; }

        const citizens = await pool.query(
            "SELECT id, name FROM users WHERE role='citizen' AND asha_id=$1 ORDER BY id LIMIT 12",
            [ashaId]
        );
        console.log(`✅ Found ${citizens.rows.length} citizens under asha@test.com`);

        // Dummy query templates
        const queryTemplates = [
            { symptoms: "Fever and persistent cough for 2 days", duration: "2 days", severity: 6, temperature: 101.5, spo2: 97, bp: "118/76", sugar: null, risk: "MEDIUM", action: "ASHA_FOLLOWUP", hoursAgo: 2 },
            { symptoms: "Mild headache and body pain", duration: "1 day", severity: 3, temperature: 98.6, spo2: 99, bp: "120/80", sugar: null, risk: "LOW", action: "HOME_CARE", hoursAgo: 26 },
            { symptoms: "Severe breathing difficulty and chest pain", duration: "3 hours", severity: 9, temperature: 99.8, spo2: 91, bp: "150/95", sugar: null, risk: "HIGH", action: "REFER_PHC", hoursAgo: 1 },
            { symptoms: "Fatigue and weakness for 3 days", duration: "3 days", severity: 5, temperature: 99.1, spo2: 96, bp: "125/82", sugar: 180, risk: "MEDIUM", action: "ASHA_FOLLOWUP", hoursAgo: 72 },
            { symptoms: "Mild dizziness, no other symptoms", duration: "Few hours", severity: 2, temperature: 98.2, spo2: 98, bp: "115/74", sugar: null, risk: "LOW", action: "HOME_CARE", hoursAgo: 5 },
            { symptoms: "High BP and frequent headaches", duration: "5 days", severity: 6, temperature: 98.9, spo2: 97, bp: "160/100", sugar: null, risk: "MEDIUM", action: "REFER_PHC", hoursAgo: 96 },
            { symptoms: "Loose motions and stomach cramps", duration: "1 day", severity: 5, temperature: 100.2, spo2: 98, bp: "110/70", sugar: null, risk: "MEDIUM", action: "ASHA_FOLLOWUP", hoursAgo: 8 },
            { symptoms: "Skin rash on arms and neck", duration: "2 days", severity: 4, temperature: 99.0, spo2: 99, bp: "118/78", sugar: null, risk: "LOW", action: "HOME_CARE", hoursAgo: 48 },
            { symptoms: "High fever and chills", duration: "2 days", severity: 8, temperature: 103.5, spo2: 95, bp: "130/85", sugar: null, risk: "HIGH", action: "REFER_PHC", hoursAgo: 3 },
            { symptoms: "Joint pain and swelling in knees", duration: "4 days", severity: 5, temperature: 98.6, spo2: 98, bp: "122/80", sugar: null, risk: "MEDIUM", action: "ASHA_FOLLOWUP", hoursAgo: 120 },
            { symptoms: "Cough with phlegm, mild fever", duration: "3 days", severity: 5, temperature: 100.4, spo2: 96, bp: "118/76", sugar: null, risk: "MEDIUM", action: "ASHA_FOLLOWUP", hoursAgo: 14 },
            { symptoms: "Vomiting and nausea after meals", duration: "1 day", severity: 6, temperature: 99.5, spo2: 97, bp: "112/72", sugar: null, risk: "MEDIUM", action: "ASHA_FOLLOWUP", hoursAgo: 18 },
        ];

        let inserted = 0;
        for (let i = 0; i < citizens.rows.length; i++) {
            const citizen = citizens.rows[i];
            const tmpl = queryTemplates[i % queryTemplates.length];

            // Check if citizen already has a recent query
            const existing = await pool.query(
                "SELECT id FROM health_queries WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1",
                [citizen.id]
            );

            if (existing.rows.length > 0) {
                console.log(`⏭️  ${citizen.name} already has queries, skipping`);
                continue;
            }

            const createdAt = new Date(Date.now() - tmpl.hoursAgo * 60 * 60 * 1000);
            const aiResponse = JSON.stringify({
                status: "success",
                analysis_type: "AI",
                risk_level: tmpl.risk,
                action: tmpl.action,
                user_message: {
                    title: tmpl.risk === "HIGH" ? "Urgent: Seek Medical Attention" :
                        tmpl.risk === "MEDIUM" ? "Follow-up Recommended" : "Rest & Home Care",
                    description: `Based on your symptoms, ${tmpl.risk === "HIGH" ? "please seek immediate medical attention." : tmpl.risk === "MEDIUM" ? "please consult your ASHA worker." : "rest and stay hydrated."}`
                },
                asha: { notified: true, priority: tmpl.risk === "HIGH" ? "URGENT" : "NORMAL" },
            });

            await pool.query(
                `INSERT INTO health_queries
          (user_id, symptoms, duration, severity, temperature, spo2, bp, sugar,
           is_diabetic, files, ai_response, analysis_type, risk_level, action,
           asha_notified, asha_priority, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
                [
                    citizen.id, tmpl.symptoms, tmpl.duration, tmpl.severity,
                    tmpl.temperature, tmpl.spo2, tmpl.bp, tmpl.sugar,
                    false, "[]", aiResponse, "AI", tmpl.risk, tmpl.action,
                    true, tmpl.risk === "HIGH" ? "URGENT" : "NORMAL", createdAt
                ]
            );
            console.log(`✅ ${citizen.name}: "${tmpl.symptoms.slice(0, 40)}..." [${tmpl.risk}]`);
            inserted++;
        }

        console.log(`\n🎉 Inserted ${inserted} health queries! Refresh ASHA portal to see them.`);
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error("❌ Error:", err.message);
        process.exit(1);
    }
}
seedQueries();
