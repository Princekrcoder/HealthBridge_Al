/**
 * Client-safe wrapper to call the AI symptom analyzer via API route.
 * This avoids importing server-only packages (genkit, gtoken, jsonwebtoken)
 * in client components, which would crash the bundler.
 */
export async function analyzeSymptoms(input) {
    const res = await fetch("/api/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "AI analysis failed");
    }

    return res.json();
}
