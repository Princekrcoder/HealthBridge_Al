require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        // There isn't a direct listModels method on GoogleGenerativeAI instance in the node SDK easily available in all versions
        // But we can try a simple generation with a known model like 'gemini-pro' to see if it works, or catch the error which lists models.

        // Actually, newer SDKs might support it. Let's try to infer from the error of a bad model.
        const model = genAI.getGenerativeModel({ model: "invalid-model-name" });
        await model.generateContent("test");
    } catch (error) {
        console.log("Error received (expecting list of models):");
        console.log(error.message);
        if (error.response) {
            console.log("Response:", JSON.stringify(error.response, null, 2));
        }
    }
}

listModels();
