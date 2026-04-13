"use client";

import { useState, useEffect } from "react";
import {
  Bell, LogOut, Languages, Mic, Camera, FileAudio, Video,
  Stethoscope, Upload, UserCircle, MapPin, AlertTriangle,
  HeartPulse, ChevronRight, Download, Siren, Loader, Send, Loader2, AlertCircle, ImagePlus
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToastAction } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useLanguage } from "@/hooks/useLanguage";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

// AI & API
// AI & API
import { fetchDashboardData, fetchDashboardSummary } from "@/lib/api";
import { MedicalLoader } from "@/components/ui/medical-loader";

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
          <Link href="/" className="flex items-center gap-3 group/brand">
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src="/icon.png"
                alt="HealthBridge_Al Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tighter text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text">
                HealthBridge_Al
              </span>
            </div>
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

const AIHealthQuery = ({ setResult, onVoiceClick, userAge = 35, userGender = 'M', t, vitals, isDiabetic, onSuccess }) => {
  const [symptoms, setSymptoms] = useState("");
  const [severity, setSeverity] = useState([5]);
  const [duration, setDuration] = useState("");
  const [files, setFiles] = useState([]); // 📂 File State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  // 🗣️ Auto-TTS
  const { speak } = useTextToSpeech();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)]);
      toast({ title: "File Added", description: `${e.target.files.length} file(s) selected.` });
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

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
      // 1️⃣  Prepare For Submission (Unified)
      const formData = new FormData();
      formData.append("symptoms", symptoms);
      formData.append("duration", duration);
      formData.append("severity", severity[0].toString());

      // Append Vitals
      if (vitals.temperature) formData.append("temperature", vitals.temperature);
      if (vitals.spo2) formData.append("spo2", vitals.spo2);
      if (vitals.bp) formData.append("bp", vitals.bp);
      if (vitals.sugar) formData.append("sugar", vitals.sugar);
      formData.append("is_diabetic", isDiabetic.toString());

      // Append Files
      files.forEach(file => {
        formData.append("files", file);
      });

      // 2️⃣  Submit to Backend (AI Logic is now here)
      const saveResponse = await fetch("http://localhost:5000/api/health-query", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      if (!saveResponse.ok) throw new Error("Failed to submit query");

      const responseData = await saveResponse.json();

      // 3️⃣  Update UI with Backend Response
      if (responseData.status === "success") {
        setResult(responseData); // Set the full structured response

        // 🔊 Auto-speak
        if (responseData.user_message?.description) {
          speak(responseData.user_message.description);
        }

        toast({
          title: responseData.user_message?.title || "Query Submitted",
          description: responseData.user_message?.description || "Your health query has been processed.",
        });

        // Clear inputs on success
        setFiles([]);
        setSymptoms("");
        if (onSuccess) onSuccess(); // Refresh History
      } else {
        throw new Error(responseData.message || "Submission failed");
      }

    } catch (error) {
      console.error("❌ Process failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while processing your request. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const [isListening, setIsListening] = useState(false);

  // 🎤 Speech to Text Logic
  const startVoiceTyping = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Voice typing is not supported in this browser. Please use Chrome or Edge.",
      });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US'; // Default to English, can be dynamic
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      // Start listening
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Please speak your symptoms clearly.",
      });

      recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        if (speechResult) {
          setSymptoms((prev) => (prev ? `${prev} ${speechResult}` : speechResult));
          toast({
            title: "Heard!",
            description: `Added: "${speechResult}"`,
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        // Log to console but avoid alert-like errors for known issues
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition error:", event.error);
        }

        setIsListening(false);

        let errorMessage = `Voice error: ${event.error}`;
        let errorTitle = "Voice Recognition Error";

        switch (event.error) {
          case 'network':
            errorMessage = "Voice typing unavailable. Please check your network connection.";
            errorTitle = "Network Error";
            break;
          case 'not-allowed':
          case 'service-not-allowed':
            errorMessage = "Microphone access denied. Please click the lock icon in your address bar to allow microphone access.";
            errorTitle = "Permission Denied";
            break;
          case 'no-speech':
            // Don't show toast for no-speech, just stop listening smoothly
            return;
          case 'audio-capture':
            errorMessage = "No microphone was found. Ensure that a microphone is installed and that microphone settings are configured correctly.";
            errorTitle = "Microphone Not Found";
            break;
        }

        toast({
          variant: "destructive",
          title: errorTitle,
          description: errorMessage,
        });
      };

      recognition.start();
    } catch (error) {
      console.error("Speech recognition start error", error);
      setIsListening(false);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not start voice recognition.",
      });
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
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">

              {/* Audio Input - Voice Typing ONLY */}
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                disabled={isAnalyzing}
                onClick={startVoiceTyping}
                className={isListening ? "animate-pulse" : ""}
                title="Voice Typing"
              >
                {isListening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
              </Button>

              {/* Camera/Image Input */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" disabled={isAnalyzing} title="Image">
                    <Camera className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => document.getElementById('image-capture').click()}>
                    <Camera className="mr-2 h-4 w-4" /> Take Photo
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.getElementById('image-upload').click()}>
                    <ImagePlus className="mr-2 h-4 w-4" /> Upload Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                type="file"
                id="image-capture"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Video Input */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="icon" disabled={isAnalyzing} title="Video">
                    <Video className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => document.getElementById('video-capture').click()}>
                    <Video className="mr-2 h-4 w-4" /> Record Video
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => document.getElementById('video-upload').click()}>
                    <Upload className="mr-2 h-4 w-4" /> Upload Video
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <input
                type="file"
                id="video-capture"
                accept="video/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                type="file"
                id="video-upload"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* General File Upload (PDF/Docs) */}
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={isAnalyzing}
                onClick={() => document.getElementById('general-upload').click()}
                title="Attach Report/PDF"
              >
                <Upload className="h-4 w-4" />
              </Button>
              <input
                type="file"
                id="general-upload"
                accept=".pdf,.doc,.docx,.jpg,.png,.jpeg"
                className="hidden"
                onChange={handleFileChange}
                multiple
              />
            </div>

            {/* 📂 Selected Files List */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1 hover:bg-destructive/20 rounded-full"
                      onClick={() => removeFile(index)}
                    >
                      <LogOut className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
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
const VitalsCard = ({ t, vitals, setVitals, isDiabetic, setIsDiabetic }) => {
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
    </Card>
  );
};

/* ========================================
   🔹 AI RESULT DISPLAY COMPONENT
   ======================================== */
/* ========================================
   🔹 AI RESULT DISPLAY COMPONENT
   ======================================== */
const AIResult = ({ result }) => {
  // 🗣️ Text-to-Speech Hook
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const getReadableText = (res) => {
    if (!res) return "";
    let text = "";
    // Read title and description only (NOT risk level)
    if (res.user_message?.title) text += res.user_message.title + ". ";
    if (res.user_message?.description) text += res.user_message.description + ". ";
    if (res.risk_level === 'HIGH') {
      text += "Immediate Medical Attention Required.";
    }
    return text;
  };

  useEffect(() => {
    const text = getReadableText(result);
    if (text) {
      const timer = setTimeout(() => speak(text), 500);
      return () => clearTimeout(timer);
    }
    return () => stop();
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSpeech = () => {
    if (isSpeaking) {
      stop();
    } else {
      const text = getReadableText(result);
      if (text) speak(text);
    }
  };

  if (!result) return null;

  // Don't show AI details for Manual analysis
  if (result.analysis_type === 'MANUAL') {
    return (
      <Card className="border-l-4 border-blue-500 bg-blue-50/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-lg text-blue-700 mb-2">{result.user_message?.title}</h4>
          <p className="text-muted-foreground">{result.user_message?.description}</p>
        </CardContent>
      </Card>
    );
  }

  const riskVariant = {
    LOW: "secondary",
    MEDIUM: "default",
    HIGH: "destructive",
    UNKNOWN: "outline"
  };

  const isEmergency = result.action === 'VISIT_ASHA_IMMEDIATELY';

  return (
    <Card className={cn(isEmergency && "border-destructive/50 shadow-destructive/20")}>
      <CardHeader>
        <CardTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <span>Health Analysis</span>
          <Badge variant={riskVariant[result.risk_level] || 'outline'}>
            Risk: {result.risk_level}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* User Message */}
        <div className={cn(
          "p-4 rounded-lg border-l-4",
          isEmergency ? "bg-destructive/10 border-destructive text-destructive-foreground" : "bg-primary/5 border-primary"
        )}>
          <h4 className={cn("font-semibold mb-2", isEmergency ? "text-destructive" : "text-primary")}>
            {result.user_message?.title}
          </h4>
          <p className="text-foreground">{result.user_message?.description}</p>
        </div>

        {/* Action Callout */}
        {isEmergency && (
          <div className="flex items-center gap-3 p-3 text-destructive font-medium bg-destructive/10 rounded-md">
            <Siren className="w-5 h-5 animate-pulse" />
            <span>Immediate Medical Attention Required</span>
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2">
          Case API ID: {result.case_id}
        </div>

        {/* 🗣️ Read Aloud Button */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={toggleSpeech} className="gap-2">
            {isSpeaking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
            {isSpeaking ? "Stop" : "Read Aloud"}
          </Button>
        </div>

      </CardContent>

      {/* High Risk Footer Actions */}
      {result.risk_level === 'HIGH' && (
        <CardFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="destructive" className="w-full sm:w-auto flex items-center gap-2">
            <Siren className="w-4 h-4" /> Request ASHA Help
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
/* ========================================
   🔹 HISTORY DETAILS MODAL
   ======================================== */


const HistoryDetailsModal = ({ isOpen, onClose, data }) => {
  if (!data) return null;

  const { symptoms, ai_response, files, created_at, analysis_type } = data;
  const aiData = ai_response || {};
  const isManual = analysis_type === 'MANUAL';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Health Query Details
            <Badge variant="outline" className="ml-2">
              {new Date(created_at).toLocaleDateString()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Reference ID: {aiData.case_id || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 1. Symptoms Section */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-primary" /> Symptoms & Observation
            </h4>
            <div className="p-3 bg-secondary/30 rounded-md text-sm">
              {symptoms || "No symptoms described."}
            </div>
          </div>

          {/* 2. Analysis Section */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-primary" /> Analysis Result
            </h4>
            {isManual ? (
              <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-md">
                <p className="font-medium text-blue-700">Manual Review Required</p>
                <p className="text-sm text-blue-600 mt-1">
                  This query contains only media files. A medical professional will review it shortly.
                </p>
              </div>
            ) : (
              <div className={cn(
                "p-4 border-l-4 rounded-r-md",
                aiData.risk_level === 'HIGH' ? "border-destructive bg-destructive/10" : "border-primary bg-primary/5"
              )}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">{aiData.user_message?.title}</span>
                  <Badge variant={aiData.risk_level === 'HIGH' ? "destructive" : "secondary"}>
                    {aiData.risk_level} RISK
                  </Badge>
                </div>
                <p className="text-sm mb-2">{aiData.user_message?.description}</p>

                {aiData.action === 'VISIT_ASHA_IMMEDIATELY' && (
                  <div className="flex items-center gap-2 text-destructive font-bold text-sm mt-3">
                    <Siren className="w-4 h-4 animate-pulse" />
                    PLEASE VISIT ASHA WORKER IMMEDIATELY
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Attachments Section */}
          {files && files.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Attachments ({files.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((file, idx) => (
                  <Card key={idx} className="overflow-hidden border group">
                    <div className="aspect-video relative bg-black/5 flex items-center justify-center">
                      {/* Image Preview */}
                      {file.type.startsWith('image/') ? (
                        <div className="relative w-full h-full">
                          <Image
                            src={file.url}
                            alt={`Attachment ${idx + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : file.type.startsWith('video/') ? (
                        <video
                          src={file.url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground p-4">
                          <FileAudio className="w-10 h-10 mb-2" />
                          <span className="text-xs uppercase">{file.type.split('/')[1] || 'FILE'}</span>
                        </div>
                      )}
                    </div>
                    <CardFooter className="p-2 bg-secondary/20 flex justify-between items-center">
                      <span className="text-xs truncate max-w-[150px]">{file.name}</span>
                      <Button variant="ghost" size="icon" asChild title="Download">
                        <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="w-4 h-4" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

/* ========================================
   🔹 VISIT HISTORY COMPONENT
   ======================================== */
const VisitHistory = ({ t, refreshKey }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null); // For Modal

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/health-query/history", {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [refreshKey]);

  const riskVariant = {
    LOW: "secondary",
    MEDIUM: "default",
    HIGH: "destructive",
    UNKNOWN: "outline"
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.visitHistory")}</CardTitle>
          <CardDescription>{t("dashboard.yourLast5Consultations")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No history records found.</p>
          ) : (
            history.map((item, index) => {
              const aiResponse = item.ai_response || {};
              const risk = aiResponse.risk_level || "UNKNOWN"; // Updated field name

              return (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="flex-1 mb-2 sm:mb-0">
                    <p className="font-semibold line-clamp-1">{item.symptoms || "Media Attachment Only"}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4">
                    <Badge variant={riskVariant[risk] || 'default'}>
                      {risk}
                    </Badge>

                    {/* View Details Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 h-auto"
                      onClick={() => setSelectedItem(item)}
                    >
                      View <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <HistoryDetailsModal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        data={selectedItem}
      />
    </>
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

  // 🏥 Vitals State (Lifted for unified submission)
  const [vitals, setVitals] = useState({
    temperature: "",
    spo2: "",
    bp: "",
    sugar: "",
  });
  const [isDiabetic, setIsDiabetic] = useState(false);

  // 🔄 History Refresh Trigger
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const refreshHistory = () => setHistoryRefreshKey(prev => prev + 1);

  // 📥 Fetch Dashboard Data on Mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Parallel fetch for efficiency
        const [data, summary] = await Promise.all([
          fetchDashboardData("citizen"),
          fetchDashboardSummary()
        ]);

        // Merge data: summary has { name, lastCheck }, data has { citizen_name, ... }
        setDashboardData({ ...data, ...summary });
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
    return <MedicalLoader />;
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
                lastCheckIn={
                  dashboardData?.lastCheck
                    ? new Date(dashboardData.lastCheck).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    : null
                }
                t={t}
              />

              <div id="ai-query">
                <AIHealthQuery
                  setResult={setAiResult}
                  onVoiceClick={handleVoiceQueryClick}
                  userAge={dashboardData?.age || 35}
                  userGender={dashboardData?.gender || 'M'}
                  t={t}
                  vitals={vitals}
                  isDiabetic={isDiabetic}
                  onSuccess={refreshHistory}
                />
              </div>

              {aiResult && <AIResult result={aiResult} />}

              <VisitHistory t={t} refreshKey={historyRefreshKey} />
            </div>

            {/* Right Column - Quick Access */}
            <div className="lg:col-span-2 space-y-6">
              <QuickActions t={t} />
              <VitalsCard
                t={t}
                vitals={vitals}
                setVitals={setVitals}
                isDiabetic={isDiabetic}
                setIsDiabetic={setIsDiabetic}
              />
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