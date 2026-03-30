const HF_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `
You are a preliminary health assessment assistant.
Analyze the user's symptoms and return a JSON response.

Input: User's health query (text).
Output: JSON object with the following fields:

{
  "status": "success",
  "analysis_type": "AI",
  "risk_level": "LOW" | "MEDIUM" | "HIGH",
  "action": "REASSURE" | "ASHA_FOLLOWUP" | "VISIT_ASHA_IMMEDIATELY",
  "user_message": {
    "title": "Short reassuring title",
    "description": "Clear, simple explanation in the requested language."
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
// Language code to name mapping
const LANGUAGE_NAMES = {
  en: "English", hi: "Hindi", bn: "Bengali", mr: "Marathi",
  te: "Telugu", ta: "Tamil", gu: "Gujarati", kn: "Kannada",
  ml: "Malayalam", pa: "Punjabi", or: "Odia", as: "Assamese"
};

async function analyzeHealthQuery(text, historyContext = "", language = "en") {
  const langName = LANGUAGE_NAMES[language] || language || "English";
  try {
    console.log("📜 AI Context - History:", historyContext ? "Present" : "Empty"); // Debug log

    const promptContent = `
Patient Medical History (Last 5 Visits - Chronological):
${historyContext || "No previous history available."}

Current User Query: "${text}"

INSTRUCTIONS:
1. Analyze the 'Current User Query' in the context of the 'Patient Medical History'.
2. Check for RECURRING symptoms or patterns (e.g., did they have fever last week too? Is this a relapse?).
3. If related to past history, mention it in the 'user_message.description'.
4. Provide the 'user_message.title' and 'user_message.description' in ${langName} language.
5. CRITICAL: The output MUST be in ${langName} (ISO: ${language}). Do NOT use English unless the requested language is English.

Respond ONLY with valid JSON.`;

    // Using Groq API Key (Reusing the variable name user provided: gork_api / GROK_API_KEY)
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.gork_api;
    if (!apiKey) throw new Error("Missing Groq API Key (gork_api)");

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: promptContent }
        ],
        temperature: 0.1,
        stream: false
      })
    });

    if (!response.ok) {
      console.error(`Groq API Error: ${response.status} ${response.statusText}`);
      const errText = await response.text();
      console.error("Error details:", errText);
      throw new Error("AI Service Unavailable");
    }

    const jsonResponse = await response.json();
    const generatedText = jsonResponse.choices?.[0]?.message?.content || "";

    // Parse JSON
    const firstBrace = generatedText.indexOf('{');
    const lastBrace = generatedText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found in response");

    const jsonStr = generatedText.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("AI API Error Details:", JSON.stringify(error, null, 2));
    throw error;
  }
}

module.exports = { analyzeHealthQuery };
