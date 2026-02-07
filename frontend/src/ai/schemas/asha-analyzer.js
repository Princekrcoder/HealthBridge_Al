/**
 * @fileOverview Zod schemas and TypeScript types for the ASHA symptom analyzer flow.
 *
 * - AshaAnalyzerInputSchema, AshaAnalyzerInput
 * - AshaAnalyzerOutputSchema, AshaAnalyzerOutput
 * - VisitHistorySchema
 * - PatientProfileSchema
 */
import { z } from 'zod';
export const VisitHistorySchema = z.object({
    date: z.string(),
    symptoms: z.array(z.string()),
    diagnosis: z.string(),
    risk: z.enum(["Low", "Medium", "High"]),
    notes: z.string(),
});
export const PatientProfileSchema = z.object({
    age: z.number(),
    gender: z.enum(["M", "F", "O"]),
    existingConditions: z.array(z.string()).optional(),
});
export const AshaAnalyzerInputSchema = z.object({
    patientProfile: PatientProfileSchema,
    history: z.array(VisitHistorySchema).optional(),
    currentSymptoms: z.string().describe("Current symptoms reported by the patient."),
});
export const AshaAnalyzerOutputSchema = z.object({
    statement: z.string().describe("A concise, one-sentence summary of the AI's assessment. Start with 'CRITICAL:' if risk is high."),
    potentialCondition: z.string().describe("The most likely potential medical condition."),
    reasoning: z.string().describe("A step-by-step explanation for the assessment, linking current symptoms to patient history and general medical knowledge."),
    risk: z.enum(["Low", "Medium", "High"]).describe("The assessed risk level for the patient."),
});
