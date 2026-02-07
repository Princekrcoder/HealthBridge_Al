"use client";

import { useState, useEffect } from "react";
import { getTranslation } from "@/lib/translations";

/**
 * Custom hook to manage language state and provide translation function.
 * Reads language from localStorage and provides a `t()` function for translations.
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

    const t = (keyPath) => getTranslation(language, keyPath);

    return { language, t };
}
