import { translate } from 'google-translate-api-x';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const body = await request.json();
        const { text, targetLang } = body;

        if (!text || !targetLang) {
            return NextResponse.json({ error: 'Missing text or targetLang' }, { status: 400 });
        }

        const res = await translate(text, { to: targetLang });
        return NextResponse.json({ translatedText: res.text });
    } catch (error) {
        console.error('Translation API Error:', error);
        return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
    }
}
