import React from "react";
import { Activity, Stethoscope } from "lucide-react";

export function MedicalLoader() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background">
            <div className="relative flex items-center justify-center w-32 h-32 mb-8">
                {/* Outer Ring Pulse */}
                <div className="absolute w-full h-full rounded-full border-4 border-primary/20 animate-ping opacity-75"></div>
                <div className="absolute w-full h-full rounded-full border-4 border-primary/10 animate-pulse"></div>

                {/* Center Icons */}
                <div className="relative z-10 bg-background rounded-full p-6 shadow-xl border border-primary/10">
                    <Stethoscope className="w-16 h-16 text-primary" strokeWidth={1.5} />
                    <Activity className="absolute bottom-6 right-6 w-8 h-8 text-destructive fill-destructive/10 animate-bounce" />
                </div>
            </div>

            {/* Brand Text */}
            <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">
                HealthBridge_Al
            </h2>

            {/* Loading Text */}
            <div className="flex items-center space-x-2 text-muted-foreground animate-pulse">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium uppercase tracking-widest">
                    Establishing Secure Connection...
                </span>
            </div>
        </div>
    );
}
