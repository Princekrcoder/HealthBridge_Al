require("dotenv").config();
const { analyzeHealthQuery } = require("./services/ai-service");

async function testAI() {
    console.log("🤖 Testing Gemini AI Service...");
    try {
        const result = await analyzeHealthQuery("I have a severe headache and high fever.");
        console.log("✅ AI Response:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("❌ AI Test Failed Detailed:", error);
        if (error.response) {
            console.error("Error Response:", await error.response.text());
        }
    }
}

testAI();
