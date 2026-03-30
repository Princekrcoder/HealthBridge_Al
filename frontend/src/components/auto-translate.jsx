"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";

export default function AutoTranslate({ text, className }) {
    const { language, translateDynamic } = useLanguage();
    const [translatedText, setTranslatedText] = useState(text);

    useEffect(() => {
        if (!text) return;
        if (language === "en") {
            setTranslatedText(text);
            return;
        }

        let isMounted = true;
        translateDynamic(text).then((res) => {
            if (isMounted) setTranslatedText(res);
        });

        return () => { isMounted = false; };
    }, [text, language, translateDynamic]);

    return <span className={className}>{translatedText}</span>;
}
