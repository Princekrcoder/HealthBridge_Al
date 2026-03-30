/**
 * Google Translate Service
 * Calls the internal API route to translate text using google-translate-api-x
 */

/**
 * Translate text to target language via API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'hi', 'bn')
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, targetLang) {
    if (!text || !targetLang || targetLang === 'en') {
        return text;
    }

    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text, targetLang }),
        });

        if (!response.ok) {
            throw new Error('Translation API request failed');
        }

        const data = await response.json();
        return data.translatedText || text;
    } catch (error) {
        console.error("❌ Google Translate Service Error:", error);
        return text; // Fallback to original text on error
    }
}
