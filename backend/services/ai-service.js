const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-flash-latest",
  generationConfig: {
    responseMimeType: "application/json",
  },
});

const SYSTEM_PROMPT = `
You are a preliminary health assessment assistant for rural India.
Analyze the user's symptoms and provide a structured JSON response.

Input: User's health query (text).
Output: JSON object with the following fields:

{
  "status": "success",
  "analysis_type": "AI",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "action": "REASSURE" | "ASHA_FOLLOWUP" | "VISIT_ASHA_IMMEDIATELY",
  "user_message": {
    "title": "Short reassuring title",
    "description": "Clear, simple explanation in English (or Hinglish if appropriate)."
  },
  "asha": {
    "notified": true,
    "priority": "NORMAL" | "HIGH"
  },
  "case_id": "HBQ-[YYYYMMDD]-XXX" (Placeholder, backend will generate actual)
}

Rules:
1. **LOW RISK**: Mild symptoms (cold, cough, slight fever). Action: "ASHA_FOLLOWUP". Message: Reassure user, ASHA will contact.
2. **MEDIUM RISK**: Moderate symptoms (high fever > 3 days, persistent pain). Action: "ASHA_FOLLOWUP". Message: No panic, but ASHA will visit.
3. **HIGH RISK**: Severe symptoms (chest pain, breathing difficulty, severe injury, unconsciousness). Action: "VISIT_ASHA_IMMEDIATELY". Message: Urgent medical attention required.
4. **UNKNOWN**: If symptoms are unclear. Action: "ASHA_FOLLOWUP".
`;

async function analyzeHealthQuery(text, historyContext = "") {
  try {
    const prompt = `${SYSTEM_PROMPT}

Patient Medical History (Last 5 Visits):
${historyContext || "No previous history available."}

Current User Query: "${text}"
Based on the history and current symptoms, provide a comprehensive analysis.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log("Gemini AI response received");
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Gemini API Error Details:", JSON.stringify(error, null, 2));
    console.error("Gemini API Error Message:", error.message);
    throw error;
  }
}

module.exports = { analyzeHealthQuery };
