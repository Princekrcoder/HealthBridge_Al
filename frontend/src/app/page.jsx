"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import { INDIAN_LANGUAGES } from "@/lib/languages";

export default function LanguageSelectionPage() {
    const router = useRouter();

    const handleLanguageSelect = (lang) => {
        if (typeof window !== "undefined") {
            localStorage.setItem("app-language", lang);
        }
        router.push("/select-role");
    };

    return (
        <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-background to-secondary/20">
            {/* Header */}
            <header className="py-10 px-5 text-center">
                <div className="inline-flex items-center gap-4 mb-2.5">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg
                            className="h-8 w-8 text-primary-foreground"
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M50 15L85 32.5V67.5L50 85L15 67.5V32.5L50 15Z"
                                fill="currentColor"
                            />
                            <path
                                d="M50 40V60M40 50H60"
                                stroke="hsl(var(--background))"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div className="text-left">
                        <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-foreground to-primary/80 text-transparent bg-clip-text">
                            HealthBridge AI
                        </h1>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                            Unified Healthcare Intelligence Platform
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-5 animate-in fade-in zoom-in duration-500">
                <div className="max-w-4xl w-full text-center space-y-10">
                    <div className="space-y-4">
                        <div className="inline-flex items-center justify-center p-3 bg-secondary rounded-full mb-4">
                            <Globe className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
                            Select Your Language
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                            अपनी भाषा चुनें / اپنی زبان منتخب کریں / ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mx-auto">
                        {INDIAN_LANGUAGES.map((lang) => (
                            <Button
                                key={lang.code}
                                onClick={() => handleLanguageSelect(lang.code)}
                                variant="outline"
                                className="h-auto py-6 flex flex-col items-center gap-1 rounded-xl border-2 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 group"
                            >
                                <span className="font-bold text-lg group-hover:scale-105 transition-transform">{lang.localName}</span>
                                <span className="text-xs text-muted-foreground font-normal uppercase tracking-wider">{lang.name}</span>
                            </Button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 text-center text-sm text-muted-foreground">
                © 2026 HealthBridge AI. All rights reserved.
            </footer>
        </div>
    );
}
