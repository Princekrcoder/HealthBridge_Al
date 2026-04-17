/**
 * sseManager.js
 * Keeps track of connected ASHA and Citizen SSE clients.
 * - ASHA channel: notified when a citizen submits a health query.
 * - Citizen channel: notified when ASHA starts a screening session.
 */

// Map: ashaId → Set of response objects
const ashaClients = new Map();

// Map: citizenId → Set of response objects
const citizenClients = new Map();

/* ─── ASHA helpers ─────────────────────────────────────────── */

function addClient(ashaId, res) {
    if (!ashaClients.has(ashaId)) ashaClients.set(ashaId, new Set());
    ashaClients.get(ashaId).add(res);
    console.log(`📡 SSE: ASHA ${ashaId} connected (${ashaClients.get(ashaId).size} clients)`);
    return () => {
        ashaClients.get(ashaId)?.delete(res);
        console.log(`📡 SSE: ASHA ${ashaId} disconnected`);
    };
}

function notifyAsha(ashaId, payload = {}) {
    const clients = ashaClients.get(ashaId);
    if (!clients || clients.size === 0) return;
    const data = JSON.stringify({ type: "new_query", ...payload });
    for (const res of clients) {
        try { res.write(`data: ${data}\n\n`); } catch {}
    }
    console.log(`📡 SSE: Notified ASHA ${ashaId} (${clients.size} clients)`);
}

/* ─── Citizen helpers ──────────────────────────────────────── */

function addCitizenClient(citizenId, res) {
    if (!citizenClients.has(citizenId)) citizenClients.set(citizenId, new Set());
    citizenClients.get(citizenId).add(res);
    console.log(`📡 SSE: Citizen ${citizenId} connected (${citizenClients.get(citizenId).size} clients)`);
    return () => {
        citizenClients.get(citizenId)?.delete(res);
        console.log(`📡 SSE: Citizen ${citizenId} disconnected`);
    };
}

/**
 * Push a screening_invite event to the target citizen.
 * payload: { sessionId, ashaName }
 */
function notifyCitizen(citizenId, payload = {}) {
    const clients = citizenClients.get(citizenId);
    if (!clients || clients.size === 0) return;
    const data = JSON.stringify({ type: "screening_invite", ...payload });
    for (const res of clients) {
        try { res.write(`data: ${data}\n\n`); } catch {}
    }
    console.log(`📡 SSE: Screening invite sent to Citizen ${citizenId}`);
}

module.exports = { addClient, notifyAsha, addCitizenClient, notifyCitizen };
