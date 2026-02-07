'use server';
/**
 * @fileOverview An AI flow for analyzing patient symptoms for ASHA workers.
 *
 * - analyzeSymptomsForAsha - A function that handles the symptom analysis.
 */
import { ai } from '@/ai/genkit';
import { AshaAnalyzerInputSchema, AshaAnalyzerOutputSchema } from '@/ai/schemas/asha-analyzer';
export async function analyzeSymptomsForAsha(input) {
    return ashaSymptomAnalyzerFlow(input);
}
const prompt = ai.definePrompt({
    name: 'ashaSymptomAnalyzerPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: AshaAnalyzerInputSchema },
    output: { schema: AshaAnalyzerOutputSchema },
    prompt: `You are a medical AI assistant for an ASHA (Accredited Social Health Activist) worker in rural India. Your goal is to analyze patient information and provide a preliminary assessment to help the ASHA worker decide on next steps.

You will be given the patient's profile, their past visit history, and their current symptoms.

- Patient Profile: Age: {{{patientProfile.age}}}, Gender: {{{patientProfile.gender}}}
- Past Visit History:
{{#if history}}
  {{#each history}}
  - Date: {{this.date}}, Diagnosis: {{this.diagnosis}}, Symptoms: {{#each this.symptoms}}{{this}}, {{/each}}, Risk: {{this.risk}}, Notes: {{this.notes}}
  {{/each}}
{{else}}
  No past visit history available.
{{/if}}
- Current Symptoms: {{{currentSymptoms}}}

Based on this information, perform the following tasks and provide the output in the specified JSON format:
1.  **Analyze Risk**: Assess the risk level as "Low", "Medium", or "High". High risk is for symptoms like chest pain, breathing difficulty, severe bleeding, unconsciousness, or a combination of moderate symptoms with a high-risk patient profile (e.g., elderly with co-morbidities).
2.  **Identify Potential Condition**: State the most likely potential condition. Be cautious; use terms like "Possible", "Likely", "Suspected".
3.  **Provide Reasoning**: Explain your reasoning. Connect the current symptoms to the patient's history and known medical patterns. Why did you assign that risk level and potential condition?
4.  **Create AI Statement**: Write a single, clear summary statement. If the risk is "High", it MUST begin with "CRITICAL:".

Example for High Risk: A 68-year-old patient with past 'Possible Bronchitis' reports 'Breathing Difficulty' and 'Chest Pain'.
- Risk: High
- Potential Condition: Acute Cardiopulmonary Distress
- Reasoning: The patient has a history of respiratory issues and is elderly. The new symptoms of chest pain and breathing difficulty are red flags for a life-threatening event like a heart attack or pulmonary embolism. Immediate referral is necessary.
- Statement: CRITICAL: The patient's new symptoms combined with their history indicate a high probability of a serious cardiac or respiratory event.

Example for Medium Risk: A 34-year-old patient with a history of a common cold reports 'high fever (102°F) and feels very weak'.
- Risk: Medium
- Potential Condition: Viral Fever or Influenza
- Reasoning: High fever and weakness are indicative of a systemic infection, likely viral. While not immediately critical, the patient needs monitoring to ensure it doesn't progress to something more severe.
- Statement: The current symptoms suggest a significant viral infection that requires monitoring.

Now, analyze the provided patient data.`,
});
const ashaSymptomAnalyzerFlow = ai.defineFlow({
    name: 'ashaSymptomAnalyzerFlow',
    inputSchema: AshaAnalyzerInputSchema,
    outputSchema: AshaAnalyzerOutputSchema,
}, async (input) => {
    const { output } = await prompt(input);
    if (!output) {
        throw new Error("The AI model did not return a valid analysis.");
    }
    return output;
});
