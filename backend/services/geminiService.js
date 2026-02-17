// backend/services/geminiService.js
// Groq ki jagah Google Gemini 2.0 Flash use ho raha hai

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Language detect karo input text se
 * Returns ISO code: "hi", "pa", "en", "ta", etc.
 */
const detectLanguage = async (text) => {
  try {
    const result = await model.generateContent(
      `You are a language detector. Reply with ONLY the ISO 639-1 language code.
Examples: Hindi→hi, Punjabi→pa, Tamil→ta, Telugu→te, Bengali→bn, Marathi→mr, English→en
Text: "${text.substring(0, 100)}"`
    );
    const lang = result.response.text().trim().toLowerCase().substring(0, 5);
    return lang && /^[a-z]{2,5}$/.test(lang) ? lang : "hi";
  } catch {
    return "hi";
  }
};

/**
 * Main symptom analysis
 * - Citizen ki language detect karo
 * - Usi language mein empathetic response do
 * - ASHA notify hogi — ye bhi message mein batao
 */
const analyzeSymptoms = async ({ symptoms, patientProfile }) => {
  const { age = 30, gender = "M" } = patientProfile || {};

  // Step 1: Language detect
  const detectedLanguage = await detectLanguage(symptoms);

  // Step 2: Analysis prompt
  const prompt = `
You are a compassionate health assistant for rural citizens in India.
Patient Age: ${age}, Gender: ${gender === "M" ? "Male" : "Female"}
Citizen's complaint: "${symptoms}"
Detected language: ${detectedLanguage}

YOUR TASKS:
1. Respond in the SAME LANGUAGE the citizen wrote in.
2. Be warm and caring — jaise koi buzurg samjha raha ho.
3. Give your best guess of what MIGHT be the issue — clearly say it is NOT verified.
4. Tell them their query has been sent to their ASHA worker (say this naturally in their language).
5. Give 2-3 safe home care tips.

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "risk": "Low" or "Medium" or "High",
  "statement": "Warm message to citizen in their language — what might be happening + ASHA notified + reassurance",
  "potentialCondition": "Condition name in English",
  "potentialConditionLocal": "Condition name in citizen's language",
  "reasoning": "Brief reasoning in citizen's language",
  "homeCare": ["tip 1 in citizen's language", "tip 2", "tip 3"],
  "disclaimer": "Short disclaimer in citizen's language — not a verified diagnosis",
  "ashaMessage": "Short English summary for ASHA dashboard about this case",
  "language": "${detectedLanguage}",
  "urgency": "immediate" or "within_24hrs" or "routine"
}

RISK GUIDELINES:
- Low: Common cold, mild fever, headache, minor stomach ache
- Medium: Fever >3 days, vomiting, weakness, moderate pain
- High: Chest pain, breathing difficulty, unconsciousness, severe bleeding, high fever with rash
`.trim();

  const result = await model.generateContent(prompt);
  const rawContent = result.response.text().trim();

  // JSON parse karo
  try {
    const cleaned = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return {
      risk:                   parsed.risk                   || "Low",
      statement:              parsed.statement              || "",
      potentialCondition:     parsed.potentialCondition     || "Unknown",
      potentialConditionLocal:parsed.potentialConditionLocal|| parsed.potentialCondition || "",
      reasoning:              parsed.reasoning              || "",
      homeCare:               parsed.homeCare               || [],
      disclaimer:             parsed.disclaimer             || "",
      ashaMessage:            parsed.ashaMessage            || `Citizen reported: ${symptoms}`,
      language:               parsed.language               || detectedLanguage,
      urgency:                parsed.urgency                || "routine",
    };
  } catch (parseError) {
    console.error("❌ Gemini JSON parse failed. Raw output:\n", rawContent);
    throw new Error("AI returned invalid format. Please try again.");
  }
};

module.exports = { analyzeSymptoms, detectLanguage };