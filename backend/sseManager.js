/**
 * sseManager.js
 * Keeps track of connected ASHA SSE clients.
 * When a citizen submits a health query, the health-query route
 * calls `notifyAsha(ashaId)` to push an instant update.
 */

// Map: ashaId (number) → Set of response objects
const ashaClients = new Map();

/**
 * Register a new SSE client for a given ASHA worker.
 * Returns a cleanup function to call when the client disconnects.
 */
function addClient(ashaId, res) {
    if (!ashaClients.has(ashaId)) {
        ashaClients.set(ashaId, new Set());
    }
    ashaClients.get(ashaId).add(res);
    console.log(`📡 SSE: ASHA ${ashaId} connected (${ashaClients.get(ashaId).size} clients)`);

    return () => {
        ashaClients.get(ashaId)?.delete(res);
        console.log(`📡 SSE: ASHA ${ashaId} disconnected`);
    };
}

/**
 * Push a "refresh" event to all connected clients of a given ASHA worker.
 */
function notifyAsha(ashaId, payload = {}) {
    const clients = ashaClients.get(ashaId);
    if (!clients || clients.size === 0) return;
    const data = JSON.stringify({ type: "new_query", ...payload });
    for (const res of clients) {
        try {
            res.write(`data: ${data}\n\n`);
        } catch (e) {
            // client disconnected mid-write; will be cleaned up on 'close'
        }
    }
    console.log(`📡 SSE: Notified ASHA ${ashaId} (${clients.size} clients)`);
}

module.exports = { addClient, notifyAsha };
