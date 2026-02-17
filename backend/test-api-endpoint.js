const fetch = require('node-fetch'); // Ensure node-fetch is available or use native fetch in newer node

async function testApi() {
    console.log("🚀 Testing POST /api/health-query...");

    try {
        const response = await fetch('http://localhost:5000/api/health-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': 'Bearer ...' // If auth is required, we need a token. 
                // NOTE: The route might be protected. I need to check if authMiddleware is used.
            },
            body: JSON.stringify({
                symptoms: "I have a fever and headache.",
                files: []
            })
        });

        const data = await response.json();
        console.log("Response Status:", response.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("❌ Request Failed:", error);
    }
}

// Check if node version supports fetch or if we need to mock it if node-fetch isn't installed.
// standard node 18+ has fetch.
testApi();
