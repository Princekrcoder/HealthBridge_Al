const HF_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Helper to call Groq API (LLaMA-3)
 */
const callHuggingFace = async (prompt) => {
  try {
    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.gork_api;
    if (!apiKey) throw new Error("Missing Groq API Key");

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      console.error(`Groq API Error: ${response.status} ${response.statusText}`);
      throw new Error("AI Service Unavailable");
    }

    const getJson = await response.json();
    return getJson.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("Error calling Hugging Face:", error);
    throw error;
  }
};

/**
 * Language detect input text
 * Returns ISO code: "hi", "pa", "en", "ta", etc.
 */
const detectLanguage = async (text) => {
  try {
    const prompt = `You are a language detector. Reply with ONLY the ISO 639-1 language code.
Examples: Hindi→hi, Punjabi→pa, Tamil→ta, Telugu→te, Bengali→bn, Marathi→mr, English→en
Text: "${text.substring(0, 100)}"`;

    // We can use a simpler model for language detection if needed, but using main checking prompt is fine
    // Or just assume 'hi' if complex. For now, let's use the same checked prompt.
    // Actually, detectLanguage via LLM is slow. 
    // Just minimal replacement here.
    const output = await callHuggingFace(prompt);
    const lang = output.trim().toLowerCase().substring(0, 5);
    return lang && /^[a-z]{2,5}$/.test(lang) ? lang : "hi";
  } catch {
    return "hi";
  }
};

/**
 * Main symptom analysis
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

  const rawContent = await callHuggingFace(prompt);

  // JSON parse
  try {
    const cleaned = rawContent
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");

    const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonStr);

    return {
      risk: parsed.risk || "Low",
      statement: parsed.statement || "",
      potentialCondition: parsed.potentialCondition || "Unknown",
      potentialConditionLocal: parsed.potentialConditionLocal || parsed.potentialCondition || "",
      reasoning: parsed.reasoning || "",
      homeCare: parsed.homeCare || [],
      disclaimer: parsed.disclaimer || "",
      ashaMessage: parsed.ashaMessage || `Citizen reported: ${symptoms}`,
      language: parsed.language || detectedLanguage,
      urgency: parsed.urgency || "routine",
    };
  } catch (parseError) {
    console.error("❌ JSON parse failed. Raw output:\n", rawContent);
    throw new Error("AI returned invalid format. Please try again.");
  }
};

module.exports = { analyzeSymptoms, detectLanguage };