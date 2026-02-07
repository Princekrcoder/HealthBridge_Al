"use client";
import { useState, useEffect } from "react";
import { User, Users, Stethoscope, Shield, Building2, UserPlus } from "lucide-react";
import { LoginModal } from "./login-modal";
import { Button } from "./ui/button";
import { getTranslation } from "@/lib/translations";

export default function LandingPageClient() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Citizen");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedLang = localStorage.getItem("app-language");
      if (storedLang) {
        setLanguage(storedLang);
      }
    }
  }, []);

  const t = (key) => getTranslation(language, key);

  const roleCards = [
    {
      role: "Citizen",
      description: t("descriptions.Citizen"),
      icon: <User className="w-7 h-7" />,
    },
    {
      role: "ASHA Worker",
      description: t("descriptions.ASHA Worker"),
      icon: <Users className="w-7 h-7" />,
    },
    {
      role: "Sub-Center",
      description: t("descriptions.Sub-Center"),
      icon: <Building2 className="w-7 h-7" />,
    },
    {
      role: "Doctor",
      description: t("descriptions.Doctor"),
      icon: <UserPlus className="w-7 h-7" />,
    },
    {
      role: "Clinical",
      description: t("descriptions.Clinical"),
      icon: <Stethoscope className="w-7 h-7" />,
    },
    {
      role: "Admin",
      description: t("descriptions.Admin"),
      icon: <Shield className="w-7 h-7" />,
    },
  ];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setIsModalOpen(true);
  };

  return (<>
    <div className="flex flex-col min-h-screen w-full">
      <header className="py-10 px-5 text-center">
        <div className="inline-flex items-center gap-4 mb-2.5">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="h-8 w-8 text-primary-foreground" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 15L85 32.5V67.5L50 85L15 67.5V32.5L50 15Z" fill="currentColor" />
              <path d="M50 40V60M40 50H60" stroke="hsl(var(--background))" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-extrabold tracking-tighter bg-gradient-to-r from-foreground to-primary/80 text-transparent bg-clip-text">
              {t("appTitle")}
            </h1>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
              {t("tagline")}
            </p>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-5 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {roleCards.map((card) => (<div key={card.role} className="group bg-card/80 backdrop-blur-lg border border-white/70 rounded-3xl p-8 flex flex-col shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary">
            <div className="w-14 h-14 bg-background rounded-xl flex items-center justify-center mb-5 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              {card.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">
              {t(`roles.${card.role}`)}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              {card.description}
            </p>
            <Button onClick={() => handleRoleSelect(card.role)} variant="outline" className="mt-auto w-fit rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" aria-label={`Access Portal for ${card.role}`}>
              {t("actions.access")}
            </Button>
          </div>))}
        </div>
      </main>
    </div>
    <LoginModal open={isModalOpen} onOpenChange={setIsModalOpen} role={selectedRole} />
  </>);
}
