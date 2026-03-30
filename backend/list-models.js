require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    console.log("🔑 Checking API Key starting with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "UNDEFINED");

    try {
        // Try using the SDK if available, though it's often not straightforward in all versions.
        // We will try a simple generateContent with a model we HOPE exists, but catch the error details.
        // Better yet, let's just try 'gemini-1.5-flash' again and print the EXACT error.

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        console.log("🤖 Attempting generation with gemini-1.5-flash...");
        const result = await model.generateContent("Hello");
        console.log("✅ Success! gemini-1.5-flash works.");
        console.log(result.response.text());

    } catch (error) {
        console.error("❌ Error with gemini-1.5-flash:");
        console.error("Message:", error.message);
        if (error.response) {
            console.error("Response:", JSON.stringify(error.response, null, 2));
        }

        // Try gemini-pro as fallback test
        try {
            console.log("\n🤖 Attempting generation with gemini-pro...");
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            await model.generateContent("Hello");
            console.log("✅ Success! gemini-pro works.");
        } catch (err2) {
            console.error("❌ Error with gemini-pro:", err2.message);
        }
    }
}

listModels();
