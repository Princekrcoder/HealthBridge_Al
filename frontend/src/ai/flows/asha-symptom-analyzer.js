'use server';
/**
 * @fileOverview An AI flow for analyzing patient symptoms for ASHA workers.
 *
 * - analyzeSymptomsForAsha - A function that handles the symptom analysis.
 */
// Replace Genkit with direct LLaMA-3 (via Groq) API interface
const HF_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function analyzeSymptomsForAsha(input) {
    const { patientProfile, history, currentSymptoms, language = 'en' } = input;

    // Language Map
    const langMap = {
        'en': 'English', 'hi': 'Hindi', 'bn': 'Bengali', 'mr': 'Marathi',
        'te': 'Telugu', 'ta': 'Tamil', 'gu': 'Gujarati', 'kn': 'Kannada',
        'ml': 'Malayalam', 'pa': 'Punjabi', 'or': 'Odia', 'as': 'Assamese'
    };
    const targetLang = langMap[language] || 'English';

    // Construct the history text
    let historyText = "No past visit history available.";
    if (history && history.length > 0) {
        historyText = history.map(h =>
            `- Date: ${h.date}, Diagnosis: ${h.diagnosis}, Symptoms: ${h.symptoms.join(', ')}, Risk: ${h.risk}, Notes: ${h.notes}`
        ).join('\n');
    }

    const systemPromptText = `You are a medical AI assistant for an ASHA (Accredited Social Health Activist) worker in rural India. 
Your goal is to analyze patient information and provide a preliminary assessment.

Patient Profile: Age: ${patientProfile.age}, Gender: ${patientProfile.gender}
Past Visit History:
${historyText}

Current Symptoms: ${currentSymptoms}

Based on this information, provide a structured JSON response with the following fields:
1. "risk": "Low", "Medium", or "High"
2. "potentialCondition": The most likely condition.
3. "reasoning": Explanation linking symptoms to history/medical knowledge.
4. "statement": A concise summary in ${targetLang}. Start with "CRITICAL:" if risk is High.

IMPORTANT: The 'statement', 'reasoning', and 'potentialCondition' MUST be in ${targetLang} language.
Output MUST be a valid JSON object ONLY. Do not include any text outside the JSON.`;

    try {
        const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.gork_api;
        if (!apiKey) throw new Error("Missing Groq API Key (GROK_API_KEY)");

        const response = await fetch(HF_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are a helpful medical AI assistant that outputs only JSON." },
                    { role: "user", content: systemPromptText }
                ],
                temperature: 0.1,
                stream: false
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API Error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        const generatedText = result.choices?.[0]?.message?.content || "";

        // Attempt to parse JSON from the text
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        } else {
            throw new Error("Could not parse JSON from AI response");
        }

    } catch (error) {
        console.error("AI Analysis failed:", error);
        throw new Error("Failed to analyze symptoms. Please try again.");
    }
}
