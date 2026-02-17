import { analyzeSymptomsForAsha } from "@/ai/flows/asha-symptom-analyzer";

export async function POST(request) {
    try {
        const input = await request.json();
        const result = await analyzeSymptomsForAsha(input);
        return Response.json(result);
    } catch (error) {
        console.error("❌ AI Analysis API error:", error);
        return Response.json(
            { error: error.message || "AI analysis failed" },
            { status: 500 }
        );
    }
}
