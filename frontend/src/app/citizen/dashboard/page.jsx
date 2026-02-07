"use client";

import { useState, useEffect } from "react";
import {
  Bell, LogOut, Languages, Mic, Camera, FileAudio, Video,
  Stethoscope, Upload, UserCircle, MapPin, AlertTriangle,
  HeartPulse, ChevronRight, Download, Siren, Loader
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// Utils & Hooks
import Link from "next/link";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLanguage } from "@/hooks/useLanguage";

// AI & API
import { analyzeSymptomsForAsha } from "@/ai/flows/asha-symptom-analyzer";
import { fetchDashboardData } from "@/lib/api";

/* ========================================
   🔹 HEADER COMPONENT
   ======================================== */
const CitizenDashboardHeader = ({ userName = "Prince", t }) => {
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        {/* Logo Section */}
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <svg className="h-7 w-7 text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 15L85 32.5V67.5L50 85L15 67.5V32.5L50 15Z" fill="currentColor" />
              <path d="M50 40V60M40 50H60" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="inline-block font-bold text-lg">{t("appTitle")}</span>
          </Link>
        </div>

        {/* Actions Section */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-1">
            {/* Language Switcher */}
            <Button variant="ghost" size="icon" aria-label="Switch Language">
              <Languages className="h-5 w-5" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" aria-label={t("dashboard.notifications")}>
              <Bell className="h-5 w-5" />
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-2 ml-2">
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={userAvatar?.imageUrl}
                  alt="User avatar"
                  data-ai-hint={userAvatar?.imageHint}
                />
                <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="hidden font-medium sm:inline-block">{userName}</span>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("dashboard.logout")}
              onClick={() => {
                import("@/lib/auth").then(({ logout }) => logout());
              }}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

/* ========================================
   🔹 WELCOME CARD COMPONENT
   ======================================== */
const WelcomeCard = ({ userName = "Prince", lastCheckIn = null, t }) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("dashboard.goodMorning");
    if (hour < 17) return t("dashboard.goodAfternoon");
    return t("dashboard.goodEvening");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">
              {getGreeting()} {userName} 👋
            </CardTitle>
            <CardDescription>{t("dashboard.howAreYouFeeling")}</CardDescription>
          </div>
          {lastCheckIn && (
            <p className="text-xs text-muted-foreground pt-1 whitespace-nowrap">
              {t("dashboard.lastCheck")}: {lastCheckIn}
            </p>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};

/* ========================================
   🔹 AI HEALTH QUERY COMPONENT
   ======================================== */
const symptomTags = [
  "Fever", "Cough", "Headache", "Vomiting",
  "Diarrhea", "Body Pain", "Chest Pain", "Breathing Difficulty"
];

const AIHealthQuery = ({ setResult, onVoiceClick, userAge = 35, userGender = 'M', t }) => {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState([5]);
  const [duration, setDuration] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!symptoms.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please describe your symptoms before analyzing.",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const result = await analyzeSymptomsForAsha({
        patientProfile: {
          age: userAge,
          gender: userGender,
        },
        currentSymptoms: symptoms,
      });

      setResult(result);

      toast({
        title: "Analysis Complete",
        description: "Your symptoms have been analyzed successfully.",
      });
    } catch (error) {
      console.error("❌ AI Analysis failed:", error);

      let description = "Could not get a response from the AI. Please try again later.";

      if (error instanceof Error) {
        if (error.message.includes("429")) {
          description = "You have exceeded the request limit. Please wait and try again.";
        } else if (error.message.includes("network")) {
          description = "Network error. Please check your connection.";
        }
      }

      toast({
        variant: "destructive",
        title: "AI Analysis Failed",
        description,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addSymptomTag = (tag) => {
    if (isAnalyzing) return;
    setSymptoms(prev => prev ? `${prev}, ${tag}` : tag);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>{t("dashboard.aiHealthQuery")}</CardTitle>
          <CardDescription>
            {t("dashboard.aiHealthQueryDesc")}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Symptom Description */}
          <Textarea
            placeholder={t("dashboard.writeYourProblem")}
            className="min-h-[120px] text-base"
            aria-label="Describe your health problem"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            disabled={isAnalyzing}
          />

          {/* Media Upload Buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Record Voice"
              onClick={onVoiceClick}
              disabled={isAnalyzing}
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Upload Photo"
              disabled={isAnalyzing}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Upload Audio"
              disabled={isAnalyzing}
            >
              <FileAudio className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Upload Video"
              disabled={isAnalyzing}
            >
              <Video className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col items-start gap-4">
          {/* Quick Symptom Tags */}
          <div className="w-full">
            <Label className="text-sm font-medium mb-2 block">{t("dashboard.quickSymptoms")}</Label>
            <div className="flex flex-wrap gap-2">
              {symptomTags.map(tag => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => addSymptomTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Duration & Severity Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Duration Selector */}
            <div>
              <Label htmlFor="duration" className="text-sm font-medium mb-2 block">
                {t("dashboard.duration")}
              </Label>
              <Select
                value={duration}
                onValueChange={setDuration}
                disabled={isAnalyzing}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder={t("dashboard.selectDuration")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t("dashboard.day1")}</SelectItem>
                  <SelectItem value="3">{t("dashboard.day3")}</SelectItem>
                  <SelectItem value="7">{t("dashboard.week1")}</SelectItem>
                  <SelectItem value="gt7">{t("dashboard.weekMore")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity Slider */}
            <div>
              <Label htmlFor="severity" className="text-sm font-medium mb-2 block">
                {t("dashboard.severity")}: {severity[0]}/10
              </Label>
              <Slider
                id="severity"
                min={1}
                max={10}
                step={1}
                value={severity}
                onValueChange={setSeverity}
                disabled={isAnalyzing}
                className="mt-2"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isAnalyzing || !symptoms.trim()}
          >
            {isAnalyzing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
            {isAnalyzing ? t("dashboard.analyzing") : t("dashboard.askHealthBridgeAI")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

/* ========================================
   🔹 QUICK ACTIONS COMPONENT
   ======================================== */
const QuickActions = ({ t }) => {
  const actions = [
    {
      icon: Stethoscope,
      labelKey: "dashboard.symptomCheck",
      colorClass: "text-primary",
      isEmergency: false,
      href: "#ai-query"
    },
    {
      icon: Upload,
      labelKey: "dashboard.uploadReport",
      colorClass: "text-secondary-foreground",
      isEmergency: false,
      href: "/citizen/reports"
    },
    {
      icon: UserCircle,
      labelKey: "dashboard.myProfile",
      colorClass: "text-accent-foreground",
      isEmergency: false,
      href: "/citizen/profile"
    },
    {
      icon: MapPin,
      labelKey: "dashboard.nearbyPHC",
      colorClass: "text-muted-foreground",
      isEmergency: false,
      href: "/citizen/facilities"
    },
    {
      icon: Siren,
      labelKey: "dashboard.emergencyHelp",
      colorClass: "text-destructive",
      isEmergency: true,
      href: "/citizen/emergency"
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.quickActions")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2 text-center">
        {actions.map(action => (
          <Button
            key={action.labelKey}
            variant="ghost"
            asChild
            className={cn(
              "flex flex-col h-auto items-center justify-center gap-1 p-2 text-center",
              action.isEmergency && 'bg-destructive/10 hover:bg-destructive/20'
            )}
          >
            <Link href={action.href}>
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-full bg-secondary",
                action.isEmergency && 'bg-destructive/20'
              )}>
                <action.icon className={cn("w-6 h-6", action.colorClass)} />
              </div>
              <span className="text-xs font-medium text-foreground text-wrap">
                {t(action.labelKey)}
              </span>
            </Link>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

/* ========================================
   🔹 VITALS INPUT COMPONENT
   ======================================== */
const VitalsCard = ({ t }) => {
  const [vitals, setVitals] = useState({
    temperature: "",
    spo2: "",
    bp: "",
    sugar: "",
  });
  const [isDiabetic, setIsDiabetic] = useState(false);
  const { toast } = useToast();

  const handleVitalsSubmit = () => {
    // Validation
    if (!vitals.temperature && !vitals.spo2 && !vitals.bp) {
      toast({
        variant: "destructive",
        title: "Missing Data",
        description: "Please enter at least one vital sign.",
      });
      return;
    }

    // TODO: API call to save vitals
    toast({
      title: "Vitals Saved",
      description: "Your vital signs have been recorded successfully.",
    });

    // Reset form
    setVitals({ temperature: "", spo2: "", bp: "", sugar: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-primary" />
          {t("dashboard.vitalsQuickInput")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Temperature & SpO2 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="temp">{t("dashboard.temperature")} (°F)</Label>
            <Input
              id="temp"
              placeholder="98.6"
              value={vitals.temperature}
              onChange={(e) => setVitals(prev => ({ ...prev, temperature: e.target.value }))}
              type="number"
              step="0.1"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="spo2">SpO2 (%)</Label>
            <Input
              id="spo2"
              placeholder="99"
              value={vitals.spo2}
              onChange={(e) => setVitals(prev => ({ ...prev, spo2: e.target.value }))}
              type="number"
              max="100"
            />
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="space-y-1">
          <Label htmlFor="bp">BP (SYS/DIA)</Label>
          <Input
            id="bp"
            placeholder="120/80"
            value={vitals.bp}
            onChange={(e) => setVitals(prev => ({ ...prev, bp: e.target.value }))}
          />
        </div>

        {/* Diabetic Toggle */}
        <div className="flex items-center justify-between mt-2">
          <Label htmlFor="is-diabetic" className="cursor-pointer">
            <span>{t("dashboard.areYouDiabetic")}</span>
          </Label>
          <Switch
            id="is-diabetic"
            checked={isDiabetic}
            onCheckedChange={setIsDiabetic}
          />
        </div>

        {/* Sugar Level (conditional) */}
        {isDiabetic && (
          <div className="space-y-1 pt-2">
            <Label htmlFor="sugar">{t("dashboard.sugarLevel")}</Label>
            <Input
              id="sugar"
              placeholder="100"
              value={vitals.sugar}
              onChange={(e) => setVitals(prev => ({ ...prev, sugar: e.target.value }))}
              type="number"
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleVitalsSubmit}>
          {t("dashboard.addVitals")}
        </Button>
      </CardFooter>
    </Card>
  );
};

/* ========================================
   🔹 AI RESULT DISPLAY COMPONENT
   ======================================== */
const AIResult = ({ result }) => {
  if (!result) return null;

  const riskVariant = {
    Low: "secondary",
    Medium: "default",
    High: "destructive",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span>AI Analysis Result</span>
          <Badge variant={riskVariant[result.risk] || 'default'}>
            Risk Level: {result.risk}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Statement */}
        <div className="p-4 rounded-lg bg-primary/5 border-l-4 border-primary">
          <h4 className="font-semibold mb-2 text-primary">AI Statement</h4>
          <p className="italic text-foreground">&quot;{result.statement}&quot;</p>
        </div>

        {/* Potential Condition */}
        <div>
          <h4 className="font-semibold mb-2">Potential Condition</h4>
          <p className="text-muted-foreground">{result.potentialCondition}</p>
        </div>

        <Separator />

        {/* Reasoning */}
        <div>
          <h4 className="font-semibold mb-2">Reasoning</h4>
          <p className="text-sm text-muted-foreground">{result.reasoning}</p>
        </div>

        {/* High Risk Warning */}
        {result.risk === 'High' && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-destructive">
                  Emergency Action Recommended
                </h4>
                <p className="text-sm text-destructive/90">
                  Your symptoms indicate a high-risk situation. Please contact your
                  local ASHA worker or visit the nearest PHC immediately.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Emergency Actions */}
      {result.risk === 'High' && (
        <CardFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button
            variant="destructive"
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <Siren /> Request ASHA Help
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            Send Summary to PHC
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

/* ========================================
   🔹 VISIT HISTORY COMPONENT
   ======================================== */
const VisitHistory = ({ t }) => {
  const history = [
    {
      date: "2024-07-20 10:30 AM",
      symptoms: "Fever, Cough",
      risk: "Low",
      diagnosis: "Common Cold"
    },
    {
      date: "2024-06-15 03:00 PM",
      symptoms: "Headache, Fatigue",
      risk: "Low",
      diagnosis: "Stress-related"
    },
    {
      date: "2024-05-28 09:00 AM",
      symptoms: "Stomach Pain",
      risk: "Medium",
      diagnosis: "Gastritis"
    },
  ];

  const riskVariant = {
    Low: "secondary",
    Medium: "default",
    High: "destructive"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.visitHistory")}</CardTitle>
        <CardDescription>{t("dashboard.yourLast5Consultations")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-secondary/50 hover:bg-secondary/70 transition-colors"
          >
            <div className="flex-1 mb-2 sm:mb-0">
              <p className="font-semibold">{item.symptoms}</p>
              <p className="text-xs text-muted-foreground">{item.date}</p>
              {item.diagnosis && (
                <p className="text-xs text-muted-foreground mt-1">
                  Diagnosis: {item.diagnosis}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant={riskVariant[item.risk] || 'default'}>
                {item.risk} Risk
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 h-auto"
              >
                View <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download Summary"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

/* ========================================
   🔹 HEALTH TIPS COMPONENT
   ======================================== */
const HealthTips = ({ t }) => {
  const tips = [
    {
      title: "Winter Care Tips",
      content: "Stay warm and hydrated. Use a humidifier to ease your throat.",
      category: "Seasonal"
    },
    {
      title: "Dengue Prevention",
      content: "Don't let water stagnate near your house. Use mosquito nets.",
      category: "Disease Prevention"
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.healthTips")}</CardTitle>
        <CardDescription>{t("dashboard.importantHealthInfo")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="p-3 rounded-lg border bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <p className="font-semibold">{tip.title}</p>
              <Badge variant="outline" className="text-xs">
                {tip.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{tip.content}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

/* ========================================
   🔹 MAIN DASHBOARD PAGE
   ======================================== */
export default function CitizenDashboard() {
  // 🔒 Authentication Guard
  useAuthGuard("citizen");

  // 🌐 Language Hook
  const { t } = useLanguage();

  // State Management
  const [aiResult, setAiResult] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // 📥 Fetch Dashboard Data on Mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData("citizen");
        setDashboardData(data);
      } catch (error) {
        console.error("❌ Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Data Load Failed",
          description: "Could not load your dashboard data. Please refresh.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // 🎤 Voice Query Handler
  const handleVoiceQueryClick = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Voice query recording will be enabled shortly.",
    });
  };

  // 🔄 Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      {/* Header */}
      <CitizenDashboardHeader userName={dashboardData?.name || "Prince"} t={t} />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column - Primary Features */}
            <div className="lg:col-span-3 space-y-6">
              <WelcomeCard
                userName={dashboardData?.name || "Prince"}
                lastCheckIn={dashboardData?.lastCheckIn}
                t={t}
              />

              <div id="ai-query">
                <AIHealthQuery
                  setResult={setAiResult}
                  onVoiceClick={handleVoiceQueryClick}
                  userAge={dashboardData?.age || 35}
                  userGender={dashboardData?.gender || 'M'}
                  t={t}
                />
              </div>

              {aiResult && <AIResult result={aiResult} />}

              <VisitHistory t={t} />
            </div>

            {/* Right Column - Quick Access */}
            <div className="lg:col-span-2 space-y-6">
              <QuickActions t={t} />
              <VitalsCard t={t} />
              <HealthTips t={t} />
            </div>
          </div>
        </div>
      </main>

      {/* Floating Voice Button */}
      <Button
        size="icon"
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-primary shadow-lg hover:bg-primary/90 hover:scale-110 transition-transform z-50"
        aria-label="Start Voice Query"
        onClick={handleVoiceQueryClick}
      >
        <Mic className="w-8 h-8" strokeWidth={2.5} />
      </Button>
    </div>
  );
}