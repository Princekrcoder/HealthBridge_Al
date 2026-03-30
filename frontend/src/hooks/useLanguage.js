"use client";

import { useState, useEffect } from "react";
import { getTranslation } from "@/lib/translations";

/**
 * Custom hook to manage language state and provide translation function.
 * Reads language from localStorage and provides a `t()` function for translations.
 * Also provides `changeLanguage()` to switch language dynamically.
 */
export function useLanguage() {
    const [language, setLanguage] = useState("en");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedLang = localStorage.getItem("app-language");
            if (storedLang) {
                setLanguage(storedLang);
            }
        }
    }, []);

    const changeLanguage = (langCode) => {
        setLanguage(langCode);
        if (typeof window !== "undefined") {
            localStorage.setItem("app-language", langCode);
        }
    };

    const t = (keyPath) => getTranslation(language, keyPath);

    const translateDynamic = async (text) => {
        if (!text || language === "en") return text;
        try {
            const { translateText } = await import("@/lib/google-translate-service");
            return await translateText(text, language);
        } catch (error) {
            console.error("Translation error:", error);
            return text;
        }
    };

    return { language, t, changeLanguage, translateDynamic };
}
