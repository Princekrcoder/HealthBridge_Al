"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { fetchDashboardData } from "@/lib/api";
import { MedicalLoader } from "@/components/ui/medical-loader";
import DashboardHeader from "@/components/dashboard-header";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Charts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

// Icons
import {
  Users, ClipboardList, HeartPulse, Bell, Truck, Search,
  Filter, MoreHorizontal, PhoneCall, Send, Plus, Edit,
  BarChart2, Pill, BookMarked, AlertTriangle, History,
  BrainCircuit, FileText, Loader, UserCircle, Volume2
} from "lucide-react";

// Utils & Hooks
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { analyzeSymptoms as analyzeSymptomsForAsha } from "@/lib/analyze-client";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useLanguage } from "@/hooks/useLanguage";
import { API_BASE_URL, DIRECT_BACKEND_URL } from "@/lib/config";

// 🔑 Authenticated fetch helper (relative URL via Next.js proxy)
async function authFetch(path) {
  const res = await fetch(path, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

/* ========================================
   📊 STATIC CHART / MEDICINE DATA
   ======================================== */

const topSymptomsData = [
  { name: "Fever", count: 18 },
  { name: "Cough", count: 12 },
  { name: "Diarrhea", count: 6 },
  { name: "Rash", count: 4 },
  { name: "Headache", count: 9 },
];

const medicineInventoryData = [
  { name: "Paracetamol", stock: 150, expiry: "12/25", status: "OK" },
  { name: "ORS", stock: 45, expiry: "06/25", status: "Low" },
  { name: "Amoxicillin", stock: 0, expiry: "01/26", status: "Out of stock" },
  { name: "Albendazole", stock: 200, expiry: "08/26", status: "OK" },
];

const medicineDistributionData = [
  { patient: "Sunita Devi", date: "2024-07-29", symptoms: "Fever", medicine: "Paracetamol", qty: 4, notes: "Advised rest." },
  { patient: "Rakesh Kumar", date: "2024-07-28", symptoms: "Diarrhea", medicine: "ORS", qty: 2, notes: "Monitor hydration." },
];

// Static placeholder for Today's Work widget (will be replaced with real visits API)
const todayVisitsData = [];


// 🎯 Map risk_level from DB to display label
const mapRisk = (risk) => {
  if (!risk) return "Low";
  const r = risk.toUpperCase();
  if (r === "HIGH" || r === "CRITICAL") return "High";
  if (r === "MEDIUM" || r === "MODERATE") return "Medium";
  return "Low";
};

// 🎯 Format timestamp to relative time
const timeAgo = (ts) => {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

/* ========================================
   🎨 STYLING CONFIGS
   ======================================== */
const statusColors = {
  "Stable": "bg-green-100 text-green-800 border-green-200",
  "Under Observation": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Follow-up Required": "bg-orange-100 text-orange-800 border-orange-200",
  "High Risk": "bg-red-100 text-red-800 border-red-200",
};

const riskColors = {
  "Low": "secondary",
  "Medium": "default",
  "High": "destructive",
};

/* ========================================
   🔹 SUMMARY CARD COMPONENT
   ======================================== */
const SummaryCard = ({ title, value, icon: Icon, subtext, onClick, isActive }) => (
  <Card
    onClick={onClick}
    className={cn(
      "cursor-pointer transition-all hover:border-primary hover:shadow-md",
      isActive && "border-primary bg-primary/5 shadow-md"
    )}
  >
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
  </Card>
);

/* ========================================
   🔹 PATIENT ACTIONS DROPDOWN
   ======================================== */
const PatientActions = ({ patient, onViewDetails, onStartScreening }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onViewDetails(patient)}>
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onStartScreening(patient)}>
        📹 Start Screening
      </DropdownMenuItem>
      <DropdownMenuItem>Refer to SC/PHC</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const AreaPatientList = ({ activeFilter, onViewDetails, onStartScreening, searchQuery, setSearchQuery, citizens }) => {
  const filteredPatients = useMemo(() => {
    let filtered = citizens || [];

    if (activeFilter) {
      switch (activeFilter) {
        case 'high-risk':
          filtered = filtered.filter(p => p.risk === "High");
          break;
        case 'follow-up':
          // Citizens with Medium risk as follow-up
          filtered = filtered.filter(p => p.risk === "Medium");
          break;
        case 'today': {
          const today = new Date().toDateString();
          filtered = filtered.filter(p =>
            p.last_query_at && new Date(p.last_query_at).toDateString() === today
          );
          break;
        }
      }
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeFilter, searchQuery, citizens]);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Area Patient List</CardTitle>
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, village..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="All Villages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rampur">Rampur</SelectItem>
                <SelectItem value="sitapur">Sitapur</SelectItem>
                <SelectItem value="alipur">Alipur</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="observation">Under Observation</SelectItem>
                <SelectItem value="follow-up">Follow-up Required</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Citizen</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Last Query</TableHead>
              <TableHead>Symptoms</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <Badge
                      variant="outline"
                      className={cn("mt-1 text-xs", statusColors[p.status] || statusColors["Stable"])}
                    >
                      {p.status || "Registered"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">{p.email}</div>
                  </TableCell>
                  <TableCell>{timeAgo(p.last_query_at)}</TableCell>
                  <TableCell>
                    {p.latest_symptoms ? (
                      <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">
                        {p.latest_symptoms}
                      </span>
                    ) : (
                      <Badge variant="outline">No queries yet</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={riskColors[p.risk]}>{p.risk || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PatientActions patient={p} onViewDetails={onViewDetails} onStartScreening={onStartScreening} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No citizens found matching your criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map(p => (
              <Card key={p.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{p.name}</div>
                    <div className="text-sm text-muted-foreground">{p.email}</div>
                  </div>
                  <PatientActions patient={p} onViewDetails={onViewDetails} onStartScreening={onStartScreening} />
                </div>
                <div className="my-2">
                  <Badge
                    variant="outline"
                    className={cn("text-xs", statusColors[p.status] || statusColors["Stable"])}
                  >
                    {p.status || "Registered"}
                  </Badge>
                  <Badge variant={riskColors[p.risk]} className="ml-2">
                    {p.risk || "Low"} Risk
                  </Badge>
                </div>
                {p.latest_symptoms && (
                  <p className="text-sm text-muted-foreground line-clamp-2 my-2">
                    {p.latest_symptoms}
                  </p>
                )}
                <div className="text-xs text-muted-foreground text-right">
                  Last query: {timeAgo(p.last_query_at)}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No citizens found matching your criteria
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ========================================
   🔹 TODAY'S WORK SUMMARY
   ======================================== */
const TodayWorkSummary = () => (
  <Card>
    <CardHeader>
      <CardTitle>Today&apos;s Work</CardTitle>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {todayVisitsData.map(v => (
            <TableRow key={v.name}>
              <TableCell className="font-medium">{v.name}</TableCell>
              <TableCell>{v.time}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusColors[v.status])}
                >
                  {v.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

/* ========================================
   🔹 TOP SYMPTOMS CHART
   ======================================== */
const TopSymptoms = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-primary" />
        Top Symptoms
      </CardTitle>
      <CardDescription>This week</CardDescription>
    </CardHeader>
    <CardContent className="h-[250px] -ml-4">
      <BarChart
        data={topSymptomsData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" />
        <YAxis
          dataKey="name"
          type="category"
          width={80}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} />
        <Bar
          dataKey="count"
          fill="hsl(var(--primary))"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </CardContent>
  </Card>
);

/* ========================================
   🔹 MEDICINE MODULE
   ======================================== */
const MedicineModule = () => (
  <Card className="lg:col-span-3">
    <CardHeader>
      <CardTitle>Medicine Inventory & Distribution</CardTitle>
    </CardHeader>
    <CardContent>
      <Tabs defaultValue="inventory">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">
            <Pill className="mr-2" /> Inventory
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BookMarked className="mr-2" /> Distribution Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" /> Add Stock
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Update Stock
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicineInventoryData.map(m => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.stock}</TableCell>
                  <TableCell>{m.expiry}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        m.status === 'OK' ? 'secondary' :
                          m.status === 'Low' ? 'default' :
                            'destructive'
                      }
                    >
                      {m.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="distribution" className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Symptoms</TableHead>
                <TableHead>Medicine Given</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {medicineDistributionData.map((d, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{d.patient}</TableCell>
                  <TableCell>{d.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.symptoms}</Badge>
                  </TableCell>
                  <TableCell>{d.medicine} (x{d.qty})</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
);

/* ========================================
   🔹 HIGH RISK ALERTS
   ======================================== */
const HighRiskAlerts = ({ citizens = [] }) => {
  const highRiskPatients = citizens.filter(p => p.risk === "High");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2">
          <AlertTriangle />
          High Risk Alerts
        </CardTitle>
        <CardDescription>Patients requiring immediate attention</CardDescription>
      </CardHeader>
      <CardContent>
        {highRiskPatients.length > 0 ? (
          <div className="space-y-4">
            {highRiskPatients.map(p => (
              <div
                key={p.id}
                className="p-3 rounded-lg bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
              >
                <div>
                  <p className="font-bold text-red-900">{p.name}</p>
                  <p className="text-sm text-red-700">{Array.isArray(p.symptoms) ? p.symptoms.join(", ") : (p.latest_symptoms || p.symptoms || "—")}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-600 hover:bg-red-100 hover:text-red-700"
                  >
                    <PhoneCall className="h-4 w-4 mr-1" /> Call PHC
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Send className="h-4 w-4 mr-1" /> Refer Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No high risk patients at the moment.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

/* ========================================
   🔹 PATIENT DETAIL MODAL
   ======================================== */
const PatientDetailModal = ({ patient, isOpen, onOpenChange, citizenQueries, isLoadingQueries }) => {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [currentSymptoms, setCurrentSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleAnalyze = async () => {
    if (!currentSymptoms || !patient) return;

    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const analysisInput = {
        patientProfile: { name: patient.name },
        currentSymptoms: currentSymptoms,
        language: language || 'en'
      };

      const result = await analyzeSymptomsForAsha(analysisInput);
      setAiResult(result);

      const speakText = `${result.statement}. Potential Condition: ${result.potentialCondition}. ${result.risk} Risk.`;
      speak(speakText);

      toast({
        title: "Analysis Complete",
        description: "AI has analyzed the symptoms successfully.",
      });
    } catch (error) {
      console.error("❌ AI Analysis failed:", error);
      let description = "Could not get a response from the AI. Please try again later.";
      if (error instanceof Error && error.message.includes("429")) {
        description = "You have exceeded the request limit. Please wait and try again.";
      }
      toast({ variant: "destructive", title: "AI Analysis Failed", description });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 🗣️ Text-to-Speech
  const { speak, stop, isSpeaking } = useTextToSpeech();

  const handleSpeakAnalysis = () => {
    if (isSpeaking) {
      stop();
    } else if (aiResult) {
      const text = `${aiResult.statement}. Potential Condition: ${aiResult.potentialCondition}. ${aiResult.risk} Risk.`;
      speak(text);
    }
  };

  // Pre-fill from latest citizen query when modal opens
  useEffect(() => {
    if (isOpen && citizenQueries?.length > 0) {
      const latest = citizenQueries[0]; // already sorted DESC
      setCurrentSymptoms(latest.symptoms || "");
      // Try to parse AI response for pre-fill
      try {
        const parsed = typeof latest.ai_response === 'string'
          ? JSON.parse(latest.ai_response)
          : latest.ai_response;
        if (parsed?.user_message) {
          setAiResult(null); // Don't pre-fill, let ASHA run fresh
        }
      } catch {/* ignore */ }
    } else if (!isOpen) {
      stop();
      const timer = setTimeout(() => {
        setCurrentSymptoms("");
        setAiResult(null);
        setIsAnalyzing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, citizenQueries]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!patient) {
    return <Dialog open={false} onOpenChange={onOpenChange} />;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl flex flex-col p-0 max-h-[90vh]">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle>Patient Details: {patient.name}</DialogTitle>
          <DialogDescription>
            A detailed view of the patient&apos;s profile, including their personal
            information, visit history, and an AI-powered symptom analysis tool.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto">
          <div className="grid md:grid-cols-5">
            {/* Left Panel - Patient Info */}
            <div className="md:col-span-2 bg-secondary/50 p-6 flex flex-col rounded-bl-lg">
              <div className="flex items-center gap-4 mb-6">
                <UserCircle className="w-16 h-16 text-primary" />
                <div>
                  <h2 className="text-2xl font-bold">{patient.name}</h2>
                  <p className="text-muted-foreground">
                    {patient.age} / {patient.gender} from {patient.village}
                  </p>
                  <p className="text-sm text-muted-foreground">{patient.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Current Status:</span>
                  <Badge
                    variant="outline"
                    className={cn(statusColors[patient.status])}
                  >
                    {patient.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-muted-foreground">Current Risk:</span>
                  <Badge variant={riskColors[patient.risk]}>{patient.risk}</Badge>
                </div>
              </div>

              <hr className="my-6" />

              <Card className="flex-grow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4" /> Visit History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm max-h-80 overflow-y-auto">
                  {patient.history && patient.history.length > 0 ? (
                    patient.history.map((visit, index) => (
                      <div key={index} className="p-3 bg-secondary rounded-md">
                        <p className="font-semibold">{visit.diagnosis}</p>
                        <p className="text-xs text-muted-foreground">{visit.date}</p>
                        <p className="mt-1">Symptoms: {Array.isArray(visit.symptoms) ? visit.symptoms.join(', ') : (visit.symptoms || "—")}</p>
                        <p>Notes: {visit.notes}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No visit history found.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - AI Analysis */}
            <div className="md:col-span-3 p-6">
              <Tabs defaultValue="new-analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="new-analysis">
                    <BrainCircuit className="mr-2 h-4 w-4" /> New Analysis
                  </TabsTrigger>
                  <TabsTrigger value="query-history">
                    <FileText className="mr-2 h-4 w-4" /> Citizen Query History
                  </TabsTrigger>
                </TabsList>

                {/* New Analysis Tab */}
                <TabsContent value="new-analysis">
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="text-primary" />
                        AI Symptom Analysis
                      </CardTitle>
                      <CardDescription>
                        Enter current symptoms to get an AI-powered analysis and recommendation.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        placeholder="e.g., 'Patient has high fever (102°F) and feels very weak...'"
                        value={currentSymptoms}
                        onChange={(e) => setCurrentSymptoms(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </CardContent>
                    <CardFooter>
                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || !currentSymptoms}
                        className="w-full"
                      >
                        {isAnalyzing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                        {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                      </Button>
                    </CardFooter>
                  </Card>

                  {/* AI Result Display */}
                  {aiResult && (
                    <Card className="mt-6 border-primary/50">
                      <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                          <span>AI Analysis Result</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleSpeakAnalysis}
                              className={cn("h-8 w-8 p-0 rounded-full", isSpeaking && "text-primary animate-pulse bg-primary/10")}
                              title={isSpeaking ? "Stop Reading" : "Read Aloud"}
                            >
                              {isSpeaking ? <Loader className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <Badge variant={riskColors[aiResult.risk]}>
                              {aiResult.risk}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-3 rounded-md bg-secondary">
                          <h4 className="font-semibold mb-1 text-primary">
                            AI Statement
                          </h4>
                          <p className="italic text-foreground">
                            &quot;{aiResult.statement}&quot;
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-1">Potential Condition</h4>
                          <p className="text-muted-foreground">
                            {aiResult.potentialCondition}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-1">Reasoning</h4>
                          <p className="text-sm text-muted-foreground">
                            {aiResult.reasoning}
                          </p>
                        </div>

                        {aiResult.risk === 'High' && (
                          <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                            <p className="font-bold flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5" />
                              Immediate Action Required
                            </p>
                            <p className="text-sm mt-1">
                              Refer patient to the nearest PHC/CHC for further evaluation.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Query History Tab — real DB data */}
                <TabsContent value="query-history">
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Citizen&apos;s Health Queries</CardTitle>
                      <CardDescription>
                        Health queries submitted by {patient.name} from their portal.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-3">
                      {isLoadingQueries ? (
                        <div className="flex justify-center py-8">
                          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : citizenQueries && citizenQueries.length > 0 ? (
                        citizenQueries.map((query, index) => {
                          const risk = mapRisk(query.risk_level);
                          let aiMsg = null;
                          try {
                            const parsed = typeof query.ai_response === 'string'
                              ? JSON.parse(query.ai_response)
                              : query.ai_response;
                            aiMsg = parsed?.user_message || null;
                          } catch {/* ignore */ }

                          return (
                            <Accordion
                              type="single"
                              collapsible
                              key={query.id || index}
                              className="w-full"
                            >
                              <AccordionItem value={`item-${index}`}>
                                <AccordionTrigger>
                                  <div className="flex justify-between w-full pr-4 items-center">
                                    <div className="flex items-center gap-2">
                                      <History className="w-4 h-4 text-muted-foreground" />
                                      <span className="font-semibold text-sm">
                                        {new Date(query.created_at).toLocaleDateString('en-IN', {
                                          day: 'numeric', month: 'short', year: 'numeric',
                                          hour: '2-digit', minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <Badge variant={riskColors[risk]}>{risk} Risk</Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="p-2 space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-sm mb-1">Symptoms Reported</h4>
                                    <p className="text-sm text-muted-foreground italic p-2 bg-secondary rounded-md">
                                      &quot;{query.symptoms}&quot;
                                    </p>
                                  </div>

                                  {/* Vitals if present */}
                                  {(query.temperature || query.spo2 || query.bp || query.sugar) && (
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      {query.temperature && <div className="p-2 bg-secondary rounded"><span className="font-medium">Temp:</span> {query.temperature}°F</div>}
                                      {query.spo2 && <div className="p-2 bg-secondary rounded"><span className="font-medium">SpO2:</span> {query.spo2}%</div>}
                                      {query.bp && <div className="p-2 bg-secondary rounded"><span className="font-medium">BP:</span> {query.bp}</div>}
                                      {query.sugar && <div className="p-2 bg-secondary rounded"><span className="font-medium">Sugar:</span> {query.sugar}</div>}
                                    </div>
                                  )}

                                  <Separator />

                                  {aiMsg ? (
                                    <div className="text-sm p-3 bg-secondary/50 rounded-md space-y-1">
                                      <p className="font-medium">{aiMsg.title}</p>
                                      <p className="text-muted-foreground">{aiMsg.description}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No AI response recorded.</p>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No health queries submitted yet by this citizen.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ========================================
   🔹 MAIN DASHBOARD PAGE
   ======================================== */
export default function AshaDashboard() {
  // 🔒 Auth Guard
  useAuthGuard("asha");
  const router = useRouter();

  // 📊 State Management
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [citizens, setCitizens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [citizenQueries, setCitizenQueries] = useState([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  const { toast } = useToast();

  // 📥 Fetch Assigned Citizens
  const loadCitizens = useCallback(async (showNotification = false) => {
    try {
      const data = await fetchDashboardData("asha");
      const mapped = (data.citizens || []).map(c => ({
        ...c,
        risk: mapRisk(c.latest_risk),
        status: c.latest_symptoms
          ? (mapRisk(c.latest_risk) === "High" ? "High Risk"
            : mapRisk(c.latest_risk) === "Medium" ? "Under Observation"
              : "Stable")
          : "Stable",
      }));
      setCitizens(mapped);
      if (showNotification) {
        toast({
          title: "🔔 New Citizen Query",
          description: "A citizen just submitted a health query.",
        });
      }
    } catch (error) {
      console.error("❌ Failed to fetch citizens:", error);
      toast({
        variant: "destructive",
        title: "Failed to load dashboard",
        description: error.message || "An unknown error occurred while fetching citizens."
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ⚡ Live SSE connection — instant push from backend when citizen submits query
  useEffect(() => {
    loadCitizens(false); // initial load

    // Open SSE stream directly to backend (bypasses Next.js proxy buffering)
    const token = localStorage.getItem("healthbridge_token");
    const sseUrl = token
      ? `${DIRECT_BACKEND_URL}/api/dashboard/asha/live?token=${token}`
      : `/api/dashboard/asha/live`;
    const evtSource = new EventSource(
      sseUrl,
      { withCredentials: true }
    );

    evtSource.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "new_query") {
          loadCitizens(true); // instant refresh + toast
        }
      } catch {/* ignore parse errors */ }
    };

    evtSource.onerror = () => {
      // SSE disconnected — fallback to 30s polling
      console.warn("SSE disconnected, falling back to polling");
    };

    // 30s backup poll (covers SSE failures & reconnects)
    const fallback = setInterval(() => loadCitizens(false), 30_000);

    return () => {
      evtSource.close();
      clearInterval(fallback);
    };
  }, [loadCitizens]);



  // 🎯 Handlers
  const handleFilterChange = (filter) => {
    setActiveFilter(prevFilter => (prevFilter === filter ? null : filter));
  };

  const handleViewDetails = useCallback(async (patient) => {
    // ⚠️ Radix UI fix: DropdownMenu returns focus to trigger on close.
    // Delay dialog open by one frame so Dropdown fully releases focus first.
    setSelectedPatient(patient);
    setCitizenQueries([]);
    setIsLoadingQueries(true);

    requestAnimationFrame(() => {
      setIsDetailModalOpen(true);
    });

    try {
      const data = await authFetch(
        `/api/dashboard/asha/citizen/${patient.id}/queries`
      );
      setCitizenQueries(data.queries || []);
    } catch (err) {
      console.error("Failed to load citizen queries:", err);
      toast({
        variant: "destructive",
        title: "Could not load queries",
        description: "Failed to fetch this citizen's health history.",
      });
    } finally {
      setIsLoadingQueries(false);
    }
  }, [toast]);

  // 📹 Start Screening
  const handleStartScreening = useCallback(async (patient) => {
    try {
      const res = await fetch("/api/screening/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const { sessionId } = await res.json();
      router.push(`/screening/${sessionId}`);
    } catch (err) {
      console.error("❌ Start screening failed:", err);
      toast({
        variant: "destructive",
        title: "Could not start screening",
        description: err.message || "Please try again.",
      });
    }
  }, [router, toast]);

  // ✅ Close handler — only hides the modal, never nulls patient (avoids race conditions)
  const handleCloseModal = useCallback(() => {
    setIsDetailModalOpen(false);
  }, []);

  // 📈 Computed Stats
  const patientCounts = useMemo(() => ({
    total: citizens.length,
    today: citizens.filter(p => {
      if (!p.last_query_at) return false;
      return new Date(p.last_query_at).toDateString() === new Date().toDateString();
    }).length,
    highRisk: citizens.filter(p => p.risk === 'High').length,
    followUp: citizens.filter(p => p.risk === 'Medium').length,
  }), [citizens]);

  // 🔄 Loading State
  if (isLoading) {
    return <MedicalLoader />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <DashboardHeader role="ASHA Worker" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-screen-2xl mx-auto space-y-6">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <SummaryCard
              title="Total Patients"
              value={patientCounts.total.toString()}
              icon={Users}
              subtext="in your area"
              onClick={() => handleFilterChange(null)}
              isActive={activeFilter === null}
            />
            <SummaryCard
              title="Today's Visits"
              value={patientCounts.today.toString()}
              icon={ClipboardList}
              onClick={() => handleFilterChange('today')}
              isActive={activeFilter === 'today'}
            />
            <SummaryCard
              title="High Risk Cases"
              value={patientCounts.highRisk.toString()}
              icon={HeartPulse}
              onClick={() => handleFilterChange('high-risk')}
              isActive={activeFilter === 'high-risk'}
            />
            <SummaryCard
              title="Pending Follow-ups"
              value={patientCounts.followUp.toString()}
              icon={Bell}
              onClick={() => handleFilterChange('follow-up')}
              isActive={activeFilter === 'follow-up'}
            />
            <SummaryCard
              title="Referrals Sent"
              value="2"
              icon={Truck}
              subtext="this week"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column - Citizen List & Medicine */}
            <div className="lg:col-span-3 space-y-6">
              <AreaPatientList
                activeFilter={activeFilter}
                onViewDetails={handleViewDetails}
                onStartScreening={handleStartScreening}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                citizens={citizens}
              />
              <MedicineModule />
            </div>

            {/* Right Column - Alerts & Summary */}
            <div className="lg:col-span-1 space-y-6">
              <HighRiskAlerts citizens={citizens} />
              <TodayWorkSummary />
              <TopSymptoms />
            </div>
          </div>
        </div>
      </main>

      {/* Patient Detail Modal — with real query history */}
      <PatientDetailModal
        patient={selectedPatient}
        isOpen={isDetailModalOpen}
        onOpenChange={(open) => { if (!open) handleCloseModal(); }}
        citizenQueries={citizenQueries}
        isLoadingQueries={isLoadingQueries}
      />
    </div>
  );
}