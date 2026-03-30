"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const { language } = useLanguage();
    const synthRef = useRef(null);
    const utteranceRef = useRef(null);

    useEffect(() => {
        if (typeof window !== "undefined" && window.speechSynthesis) {
            setIsSupported(true);
            synthRef.current = window.speechSynthesis;
        }
    }, []);

    const getVoice = (langCode) => {
        if (!synthRef.current) return null;
        const voices = synthRef.current.getVoices();

        // 1. Try exact match (e.g., 'hi-IN')
        let selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.toLowerCase()));

        // 2. Fallback for Hindi/Indian languages if exact match fails
        if (!selectedVoice && langCode === 'hi') {
            selectedVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('Hindi'));
        }

        // 3. Fallback to English
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Microsoft Zira"));
        }

        return selectedVoice;
    };

    const speak = (text) => {
        if (!isSupported || !text) return;

        // Cancel any ongoing speech
        stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance;

        // Voice Selection
        const voice = getVoice(language);
        if (voice) {
            utterance.voice = voice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            // "interrupted" fires when speech is cancelled programmatically — not a real error
            if (e.error === "interrupted" || e.error === "canceled") {
                setIsSpeaking(false);
                return;
            }
            console.error("TTS Error:", e.error);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    };

    const stop = () => {
        if (synthRef.current) {
            synthRef.current.cancel();
            setIsSpeaking(false);
        }
    };

    return { speak, stop, isSpeaking, isSupported };
}
