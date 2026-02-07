"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard"; // 👈 AUTH GUARD ADDED
import { fetchDashboardData } from "@/lib/api"; // 👈 API IMPORT ADDED
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
  BrainCircuit, FileText, Loader, UserCircle 
} from "lucide-react";

// Utils & Hooks
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ========================================
   📊 MOCK DATA (Replace with API data)
   ======================================== */
const patientData = [
  {
    id: "p001", 
    name: "Sunita Devi", 
    status: "Under Observation", 
    age: 34, 
    gender: "F", 
    village: "Rampur", 
    lastChecked: "2h ago", 
    symptoms: ["Fever", "Cough"], 
    risk: "Medium", 
    phone: "9876543210", 
    history: [
      { 
        date: "2024-07-25", 
        symptoms: ["Mild Fever"], 
        diagnosis: "Common Cold", 
        risk: "Low", 
        notes: "Advised rest and hydration." 
      },
      { 
        date: "2024-07-10", 
        symptoms: ["Headache"], 
        diagnosis: "Fatigue", 
        risk: "Low", 
        notes: "N/A" 
      }
    ], 
    aiQueryHistory: [
      {
        date: "2024-07-30",
        symptoms: "Patient has a persistent cough and feels feverish for the last 2 days.",
        analysis: {
          statement: "The current symptoms, combined with a recent history of a common cold, suggest a possible secondary infection that should be monitored.",
          potentialCondition: "Post-viral cough or early Bronchitis",
          reasoning: "The patient had a common cold recently. A persistent cough and fever following a cold can indicate that the initial viral infection has either not fully resolved or a secondary bacterial infection is developing. The risk is currently medium but requires observation.",
          risk: "Medium"
        }
      }
    ]
  },
  { 
    id: "p002", 
    name: "Amit Kumar", 
    status: "Stable", 
    age: 45, 
    gender: "M", 
    village: "Sitapur", 
    lastChecked: "1d ago", 
    symptoms: ["Headache"], 
    risk: "Low", 
    phone: "9876543211", 
    history: [],
    aiQueryHistory: []
  },
  {
    id: "p003", 
    name: "Geeta Singh", 
    status: "High Risk", 
    age: 68, 
    gender: "F", 
    village: "Rampur", 
    lastChecked: "1h ago", 
    symptoms: ["Breathing Difficulty", "Chest Pain"], 
    risk: "High", 
    phone: "9876543212", 
    history: [
      { 
        date: "2024-07-28", 
        symptoms: ["Fatigue", "Cough"], 
        diagnosis: "Possible Bronchitis", 
        risk: "Medium", 
        notes: "Referred for check-up." 
      },
      { 
        date: "2024-07-20", 
        symptoms: ["High Fever"], 
        diagnosis: "Viral Infection", 
        risk: "Medium", 
        notes: "Prescribed Paracetamol." 
      }
    ], 
    aiQueryHistory: [
      {
        date: "2024-07-29",
        symptoms: "Feeling weak and have a mild fever.",
        analysis: {
          statement: "The current symptoms suggest a minor viral infection, monitoring is advised.",
          potentialCondition: "Viral Fever",
          reasoning: "Mild fever and weakness are common indicators of a viral infection. Given the patient's history, it's unlikely to be severe but should be monitored.",
          risk: "Low"
        }
      },
      {
        date: "2024-07-30",
        symptoms: "Breathing difficulty and chest pain after walking.",
        analysis: {
          statement: "CRITICAL: The patient's new symptoms combined with their history indicate a high probability of a serious cardiac or respiratory event.",
          potentialCondition: "Acute Cardiopulmonary Distress",
          reasoning: "The patient has a history of respiratory issues and is elderly. The new symptoms of chest pain and breathing difficulty are red flags for a life-threatening event like a heart attack or pulmonary embolism. Immediate referral is necessary.",
          risk: "High"
        }
      }
    ]
  },
  { 
    id: "p004", 
    name: "Ramesh Patel", 
    status: "Follow-up Required", 
    age: 52, 
    gender: "M", 
    village: "Alipur", 
    lastChecked: "3d ago", 
    symptoms: ["Fatigue"], 
    risk: "Medium", 
    phone: "9876543213", 
    history: [],
    aiQueryHistory: []
  },
  { 
    id: "p005", 
    name: "Priya Sharma", 
    status: "Stable", 
    age: 28, 
    gender: "F", 
    village: "Sitapur", 
    lastChecked: "5h ago", 
    symptoms: ["N/A"], 
    risk: "Low", 
    phone: "9876543214", 
    history: [],
    aiQueryHistory: []
  },
  { 
    id: "p006", 
    name: "Mahesh Yadav", 
    status: "Follow-up Required", 
    age: 60, 
    gender: "M", 
    village: "Rampur", 
    lastChecked: "4d ago", 
    symptoms: ["High BP"], 
    risk: "Medium", 
    phone: "9876543215", 
    history: [],
    aiQueryHistory: []
  },
];

const todayVisitsData = [
  { name: "Geeta Singh", time: "09:15 AM", status: "High Risk" },
  { name: "Sunita Devi", time: "11:30 AM", status: "Under Observation" },
  { name: "Mahesh Yadav", time: "01:00 PM", status: "Follow-up Required" },
];

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
      <Icon className="h-4 w-4 text-muted-foreground"/>
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
const PatientActions = ({ patient, onViewDetails }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4"/>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={() => onViewDetails(patient)}>
        View Details
      </DropdownMenuItem>
      <DropdownMenuItem>Start Screening</DropdownMenuItem>
      <DropdownMenuItem>Refer to SC/PHC</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

/* ========================================
   🔹 AREA PATIENT LIST COMPONENT
   ======================================== */
const AreaPatientList = ({ activeFilter, onViewDetails, searchQuery, setSearchQuery }) => {
  const filteredPatients = useMemo(() => {
    let filtered = patientData;

    // Apply active filter
    if (activeFilter) {
      switch (activeFilter) {
        case 'high-risk':
          filtered = filtered.filter(p => p.risk === "High");
          break;
        case 'follow-up':
          filtered = filtered.filter(p => p.status === "Follow-up Required");
          break;
        case 'today':
          const todayPatientNames = todayVisitsData.map(v => v.name);
          filtered = filtered.filter(p => todayPatientNames.includes(p.name));
          break;
      }
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.village.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [activeFilter, searchQuery]);

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <CardTitle>Area Patient List</CardTitle>
        <div className="mt-4 flex flex-col md:flex-row md:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
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
                <SelectValue placeholder="All Villages"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rampur">Rampur</SelectItem>
                <SelectItem value="sitapur">Sitapur</SelectItem>
                <SelectItem value="alipur">Alipur</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="All Statuses"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stable">Stable</SelectItem>
                <SelectItem value="observation">Under Observation</SelectItem>
                <SelectItem value="follow-up">Follow-up Required</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <Table className="hidden md:table">
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Last Checked</TableHead>
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
                      className={cn("mt-1 text-xs", statusColors[p.status])}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {p.age} / {p.gender}
                    </div>
                    <div className="text-sm">{p.village}</div>
                  </TableCell>
                  <TableCell>{p.lastChecked}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.symptoms.map(s => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={riskColors[p.risk]}>{p.risk}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <PatientActions patient={p} onViewDetails={onViewDetails}/>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No patients found matching your criteria
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
                    <div className="text-sm text-muted-foreground">
                      {p.age} / {p.gender} - {p.village}
                    </div>
                  </div>
                  <PatientActions patient={p} onViewDetails={onViewDetails}/>
                </div>
                <div className="my-2">
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", statusColors[p.status])}
                  >
                    {p.status}
                  </Badge>
                  <Badge variant={riskColors[p.risk]} className="ml-2">
                    {p.risk} Risk
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 my-2">
                  {p.symptoms.map(s => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  Last checked: {p.lastChecked}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              No patients found matching your criteria
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
        <BarChart2 className="w-5 h-5 text-primary"/>
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
        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
        <XAxis type="number"/>
        <YAxis 
          dataKey="name" 
          type="category" 
          width={80} 
          tickLine={false} 
          axisLine={false}
        />
        <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }}/>
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
            <Pill className="mr-2"/> Inventory
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BookMarked className="mr-2"/> Distribution Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-4">
          <div className="flex justify-end gap-2 mb-4">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4"/> Add Stock
            </Button>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4"/> Update Stock
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
const HighRiskAlerts = () => {
  const highRiskPatients = patientData.filter(p => p.risk === "High");

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
                  <p className="text-sm text-red-700">{p.symptoms.join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-red-600 text-red-600 hover:bg-red-100 hover:text-red-700"
                  >
                    <PhoneCall className="h-4 w-4 mr-1"/> Call PHC
                  </Button>
                  <Button variant="destructive" size="sm">
                    <Send className="h-4 w-4 mr-1"/> Refer Now
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
const PatientDetailModal = ({ patient, isOpen, onOpenChange }) => {
  const { toast } = useToast();
  const [currentSymptoms, setCurrentSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const handleAnalyze = async () => {
    if (!currentSymptoms || !patient) return;

    setIsAnalyzing(true);
    setAiResult(null);

    try {
      const analysisInput = {
        patientProfile: {
          age: patient.age,
          gender: patient.gender,
        },
        history: patient.history,
        currentSymptoms: currentSymptoms,
      };

      // TODO: Re-enable AI analysis when ready
      console.log("AI Analysis disabled for debugging", analysisInput);
      
      // Mock response for now
      setAiResult({ 
        statement: "AI Analysis Temporarily Disabled", 
        potentialCondition: "N/A", 
        reasoning: "Debugging in progress", 
        risk: "Low" 
      });

      toast({
        title: "Analysis Complete",
        description: "Symptom analysis has been processed.",
      });
    } catch (error) {
      console.error("❌ AI Analysis failed:", error);

      let description = "Could not get a response from the AI. Please try again later.";
      if (error instanceof Error && error.message.includes("429")) {
        description = "You have exceeded the request limit. Please wait and try again.";
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

  // Load latest AI query when modal opens
  useEffect(() => {
    if (isOpen && patient?.id) {
      const latestQuery = patient.aiQueryHistory?.slice().reverse()[0];
      if (latestQuery) {
        setCurrentSymptoms(latestQuery.symptoms);
        setAiResult(latestQuery.analysis);
      } else {
        setCurrentSymptoms("");
        setAiResult(null);
      }
    } else if (!isOpen) {
      // Reset after animation
      const timer = setTimeout(() => {
        setCurrentSymptoms("");
        setAiResult(null);
        setIsAnalyzing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, patient?.id, patient?.aiQueryHistory]);

  if (!patient) return null;

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
                <UserCircle className="w-16 h-16 text-primary"/>
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

              <hr className="my-6"/>

              <Card className="flex-grow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="w-4 h-4"/> Visit History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm max-h-80 overflow-y-auto">
                  {patient.history && patient.history.length > 0 ? (
                    patient.history.map((visit, index) => (
                      <div key={index} className="p-3 bg-secondary rounded-md">
                        <p className="font-semibold">{visit.diagnosis}</p>
                        <p className="text-xs text-muted-foreground">{visit.date}</p>
                        <p className="mt-1">Symptoms: {visit.symptoms.join(', ')}</p>
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
                    <BrainCircuit className="mr-2 h-4 w-4"/> New Analysis
                  </TabsTrigger>
                  <TabsTrigger value="query-history">
                    <FileText className="mr-2 h-4 w-4"/> Citizen Query History
                  </TabsTrigger>
                </TabsList>

                {/* New Analysis Tab */}
                <TabsContent value="new-analysis">
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BrainCircuit className="text-primary"/> 
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
                        {isAnalyzing && <Loader className="mr-2 h-4 w-4 animate-spin"/>}
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
                          <Badge variant={riskColors[aiResult.risk]}>
                            {aiResult.risk}
                          </Badge>
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
                              <AlertTriangle className="w-5 h-5"/>
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

                {/* Query History Tab */}
                <TabsContent value="query-history">
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>Citizen's Health Queries</CardTitle>
                      <CardDescription>
                        History of AI health queries made by the citizen from their portal.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-3">
                      {patient.aiQueryHistory && patient.aiQueryHistory.length > 0 ? (
                        patient.aiQueryHistory.slice().reverse().map((query, index) => (
                          <Accordion 
                            type="single" 
                            collapsible 
                            key={index} 
                            className="w-full"
                          >
                            <AccordionItem value={`item-${index}`}>
                              <AccordionTrigger>
                                <div className="flex justify-between w-full pr-4 items-center">
                                  <div className="flex items-center gap-2">
                                    <History className="w-4 h-4 text-muted-foreground"/>
                                    <span className="font-semibold text-sm">
                                      {query.date}
                                    </span>
                                  </div>
                                  <Badge variant={riskColors[query.analysis.risk]}>
                                    {query.analysis.risk}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="p-2 space-y-3">
                                <div>
                                  <h4 className="font-semibold text-sm mb-1">
                                    Symptoms Reported by Citizen
                                  </h4>
                                  <p className="text-sm text-muted-foreground italic p-2 bg-secondary rounded-md">
                                    &quot;{query.symptoms}&quot;
                                  </p>
                                </div>

                                <Separator />

                                <h4 className="font-semibold text-sm">
                                  AI Analysis Result
                                </h4>
                                <div className="text-sm p-3 bg-secondary/50 rounded-md space-y-2">
                                  <p>
                                    <span className="font-medium">Statement:</span>{' '}
                                    {query.analysis.statement}
                                  </p>
                                  <p>
                                    <span className="font-medium">Potential Condition:</span>{' '}
                                    {query.analysis.potentialCondition}
                                  </p>
                                  <p>
                                    <span className="font-medium">Reasoning:</span>{' '}
                                    {query.analysis.reasoning}
                                  </p>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">
                          No past AI queries found for this patient.
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
export default function DoctorDashboard() {
  // 🔒 Auth Guard
  useAuthGuard("doctor"); // 👈 AUTH GUARD ADDED

  // 📊 State Management
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // 📥 Fetch Dashboard Data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await fetchDashboardData("doctor");
        setDashboardData(data);
        // TODO: Replace mock data with API data
        // setAshas(data.ashas);
        // setPatients(data.patients);
      } catch (error) {
        console.error("❌ Failed to fetch dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Data Load Failed",
          description: "Could not load dashboard data. Please refresh.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [toast]);

  // 🎯 Handlers
  const handleFilterChange = (filter) => {
    setActiveFilter(prevFilter => (prevFilter === filter ? null : filter));
  };

  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setIsDetailModalOpen(true);
  };

  // 📈 Computed Stats
  const patientCounts = useMemo(() => ({
    total: patientData.length,
    today: todayVisitsData.length,
    highRisk: patientData.filter(p => p.risk === 'High').length,
    followUp: patientData.filter(p => p.status === 'Follow-up Required').length,
  }), []);

  // 🔄 Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin text-primary"/>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-secondary/50">
      <DashboardHeader role="Doctor"/>

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
            {/* Left Column - Patient List & Medicine */}
            <div className="lg:col-span-3 space-y-6">
              <AreaPatientList 
                activeFilter={activeFilter} 
                onViewDetails={handleViewDetails}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
              <MedicineModule />
            </div>

            {/* Right Column - Alerts & Summary */}
            <div className="lg:col-span-1 space-y-6">
              <HighRiskAlerts />
              <TodayWorkSummary />
              <TopSymptoms />
            </div>
          </div>
        </div>
      </main>

      {/* Patient Detail Modal */}
      <PatientDetailModal 
        patient={selectedPatient} 
        isOpen={isDetailModalOpen} 
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
}