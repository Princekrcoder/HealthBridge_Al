"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Globe, HeartPulse, Code2, User, Target, Sparkles, MoveRight } from "lucide-react";
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
        <div className="flex flex-col w-full min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-100 via-white to-cyan-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 selection:bg-primary/20">

            <main className="flex flex-col items-center justify-center flex-1 p-4 md:p-8 animate-in fade-in zoom-in duration-700">
                <div className="w-full max-w-3xl flex flex-col items-center gap-12 md:gap-16">

                    {/* Branding Section (Centered) */}
                    {/* Branding Section */}
                    <div className="flex flex-col items-center gap-4">

                        {/* Logo + Title Row */}
                        <div className="flex items-center gap-4 md:gap-6">

                            {/* Logo with Glow */}
                            <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                                <Image
                                    src="/icon.png"
                                    alt="HealthBridge_Al Logo"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </div>

                            {/* Brand Name */}
                            <h1 className="text-3xl md:text-6xl font-black tracking-tighter text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text drop-shadow-sm">
                                HealthBridge_Al
                            </h1>
                        </div>

                        {/* Tagline */}
                        <div className="flex items-center justify-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-xs md:text-sm font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                                Unified Healthcare Intelligence
                            </p>
                        </div>

                    </div>


                    {/* Language Selection (Centered) */}
                    <div className="w-full flex flex-col items-center gap-8">
                        <div className="space-y-4 text-center">
                            <div className="inline-flex items-center justify-center p-3 mb-2 rounded-full bg-white shadow-lg shadow-primary/10 ring-1 ring-black/5 mx-auto">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Select Your Language
                            </h2>
                            <p className="text-lg md:text-xl font-medium text-slate-500 dark:text-slate-400">
                                अपनी भाषा चुनें / अपनी زبان منتخب کریں / ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                            {INDIAN_LANGUAGES.map((lang) => (
                                <Button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code)}
                                    variant="outline"
                                    className="relative h-auto p-6 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/50 hover:bg-primary/5 hover:ring-2 hover:ring-primary/20 transition-all duration-300 group overflow-hidden shadow-sm hover:shadow-xl text-center"
                                >
                                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 group-hover:-translate-y-1 transition-all duration-300 text-primary">
                                        <MoveRight className="w-4 h-4" />
                                    </div>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{lang.localName}</span>
                                    <span className="text-xs font-bold tracking-wider uppercase text-slate-400 group-hover:text-primary/70 transition-colors">{lang.name}</span>
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Info Card (Centered) */}
                    <div className="w-full relative overflow-hidden p-8 rounded-[2.5rem] bg-white/60 dark:bg-slate-900/50 backdrop-blur-2xl border border-white/50 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 group">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                            <Sparkles className="w-32 h-32 rotate-12" />
                        </div>

                        <div className="relative flex flex-col gap-8 text-center md:text-left">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* About */}
                                <div>
                                    <h3 className="flex items-center justify-center md:justify-start gap-3 mb-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                            <HeartPulse className="w-5 h-5" />
                                        </div>
                                        About Us
                                    </h3>
                                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                                        HealthBridge_Al provides <span className="font-semibold text-primary">free doctor consultations</span>, medicine delivery, and AI symptom analysis for rural communities.
                                    </p>
                                </div>

                                {/* Goal */}
                                <div>
                                    <h3 className="flex items-center justify-center md:justify-start gap-3 mb-3 text-xl font-bold text-slate-800 dark:text-slate-100">
                                        <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                                            <Target className="w-5 h-5" />
                                        </div>
                                        Our Mission
                                    </h3>
                                    <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                                        To make quality healthcare affordable, accessible, and intelligent for everyone, everywhere.
                                    </p>
                                </div>
                            </div>

                            {/* Credits */}
                            <div className="pt-6 mt-2 flex flex-wrap justify-center md:justify-start gap-3 border-t border-slate-200/60 dark:border-slate-700/60">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Code2 className="w-3.5 h-3.5" />
                                    <span>Built with <span className="text-slate-900 dark:text-white">Code_Nexus</span></span>
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <User className="w-3.5 h-3.5" />
                                    <span>Lead by <span className="text-slate-900 dark:text-white">Prince Kumar</span></span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            <footer className="py-6 text-center text-sm font-medium text-slate-400">
                © 2026 HealthBridge_Al. All rights reserved.
            </footer>
        </div>
    );
}