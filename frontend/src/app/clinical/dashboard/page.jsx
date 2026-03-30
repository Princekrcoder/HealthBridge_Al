"use client";
import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard"; // 👈 IMPORT ADDED
import { useLanguage } from "@/hooks/useLanguage"; // 👈 LANGUAGE HOOK
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import Link from "next/link";
import { Bell, LogOut, User, Power, ChevronDown, Phone, Siren, FilePlus, CircleAlert, ArrowRight, Filter, Search, Pill, Inbox, Users, CheckCircle, Hourglass, Box, Truck, CalendarClock, PackageX, History, Building, UserCircle, BrainCircuit, FileText, Loader, AlertTriangle, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter, } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { analyzeSymptoms as analyzeSymptomsForAsha } from "@/lib/analyze-client";

const referralsData = [
    {
        id: 'ref001',
        patientName: 'Geeta Singh',
        age: 68,
        gender: 'F',
        village: 'Rampur',
        ashaName: 'Sunita Devi',
        referralReason: "Patient reported acute chest pain and breathing difficulty. High risk due to age and prior respiratory issues. Immediate PHC evaluation required.",
        symptoms: ['Breathing Difficulty', 'Chest Pain'],
        vitals: { temp: '99.1°F', spo2: 93, bp: '150/95' },
        risk: 'Critical',
        receivedTime: '15m ago',
        status: 'New',
        phone: "9876543212",
        history: [
            { date: "2024-07-28", symptoms: ["Fatigue", "Cough"], diagnosis: "Possible Bronchitis", risk: "Medium", notes: "Referred for check-up." },
            { date: "2024-07-20", symptoms: ["High Fever"], diagnosis: "Viral Infection", risk: "Medium", notes: "Prescribed Paracetamol." }
        ],
        aiQueryHistory: [
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
    { id: 'ref002', patientName: 'Sunita Devi', age: 34, gender: 'F', village: 'Rampur', ashaName: 'Sunita Devi', referralReason: "High grade fever (102.4°F) not responding to initial medication. Needs doctor consultation.", symptoms: ['Fever', 'Cough'], vitals: { temp: '102.4°F', spo2: 97, bp: '120/80' }, risk: 'Medium', receivedTime: '2h ago', status: 'New' },
    { id: 'ref003', patientName: 'Ramesh Patel', age: 52, gender: 'M', village: 'Alipur', ashaName: 'Priya Sharma', referralReason: "Consistently high blood pressure readings during home visits. Requires medical management.", symptoms: ['High BP', 'Headache'], vitals: { temp: '98.6°F', spo2: 98, bp: '160/100' }, risk: 'High', receivedTime: '1d ago', status: 'High Priority' },
    { id: 'ref004', patientName: 'Kavita Kumari', age: 28, gender: 'F', village: 'Sitapur', ashaName: 'Anjali Verma', referralReason: "Persistent vomiting and signs of dehydration. Closed after initial consultation and IV fluids.", symptoms: ['Stomach Pain', 'Vomiting'], vitals: { temp: '99.0°F', spo2: 99, bp: '110/70' }, risk: 'Medium', receivedTime: '2d ago', status: 'Closed' },
];

const opdQueueData = [
    { token: 'A01', name: 'Ravi Kumar', status: 'In Consult' },
    { token: 'A02', name: 'Anita Desai', status: 'Waiting' },
    { token: 'A03', name: 'Suresh Gupta', status: 'Waiting' },
    { token: 'A04', name: 'Pooja Mehta', status: 'Done' },
];

const criticalAlertsData = [
    { id: 'crit01', patientName: 'Geeta Singh', alert: 'SpO2 < 94%', time: '16m ago' },
    { id: 'crit02', patientName: 'Mahesh Yadav', alert: 'Severe Chest Pain', time: '1h ago' },
    { id: 'crit03', patientName: 'Rekha Devi', alert: 'Pregnancy Bleeding', time: '3h ago' },
];

const medicineStockData = [
    { name: 'Paracetamol 500mg', type: 'Tablet', stock: 1500, unit: 'tabs', expiry: '12/25', status: 'OK' },
    { name: 'Amoxicillin 250mg', type: 'Tablet', stock: 450, unit: 'tabs', expiry: '06/25', status: 'Low' },
    { name: 'ORS Powder', type: 'Syrup', stock: 80, unit: 'bottles', expiry: '01/26', status: 'OK' },
    { name: 'Dexamethasone', type: 'Injection', stock: 0, unit: 'vials', expiry: '08/26', status: 'Out of Stock' },
    { name: 'Ibuprofen Syrup', type: 'Syrup', stock: 50, unit: 'bottles', expiry: '04/25', status: 'Expiring Soon' },
];

// SECTION: HELPER & CHILD COMPONENTS
const ClinicalDashboardHeader = ({ t }) => {
    const userAvatar = PlaceHolderImages.find((img) => img.id === 'user-avatar');
    return (<header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-lg px-4 md:px-6">
        <Link href="/" className="text-2xl font-bold text-primary flex items-center gap-2">
            <svg className="h-6 w-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 15L85 32.5V67.5L50 85L15 67.5V32.5L50 15Z" fill="currentColor" /><path d="M50 40V60M40 50H60" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t("appTitle")}
        </Link>
        <div className="ml-4 flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:flex items-center gap-2"><Building className="w-3.5 h-3.5" />PHC Rampur</Badge>
            <Badge variant="secondary">{t("roles.Clinical")}</Badge>
        </div>
        <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Switch id="availability-mode" />
                <label htmlFor="availability-mode" className="text-sm font-medium hidden md:block">On Duty</label>
            </div>
            <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">3</span>
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={userAvatar?.imageUrl} alt="Dr. Sharma" data-ai-hint={userAvatar?.imageHint} />
                            <AvatarFallback>DS</AvatarFallback>
                        </Avatar>
                        <div className="hidden md:flex flex-col items-start">
                            <span className="font-semibold text-sm">Dr. Sharma</span>
                            <span className="text-xs text-muted-foreground">Medical Officer</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>{t("dashboard.profile")}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem><User className="mr-2 h-4 w-4" /> {t("dashboard.profile")}</DropdownMenuItem>
                    <DropdownMenuItem><Power className="mr-2 h-4 w-4" /> Availability</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => {
                        import("@/lib/auth").then(({ logout }) => logout());
                    }} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" /> {t("dashboard.logout")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </header>);
};

const StatCard = ({ title, value, icon: Icon, subtext, colorClass }) => (<Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", colorClass)} />
    </CardHeader>
    <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
    </CardContent>
</Card>);

const riskColors = {
    Low: { text: "text-green-800", bg: "bg-green-100", border: "border-green-300" },
    Medium: { text: "text-yellow-800", bg: "bg-yellow-100", border: "border-yellow-300" },
    High: { text: "text-orange-800", bg: "bg-orange-100", border: "border-orange-300" },
    Critical: { text: "text-red-800", bg: "bg-red-100", border: "border-red-300" },
};

const ReferralCard = ({ referral, onOpenCase }) => {
    const riskColor = riskColors[referral.risk];
    return (<Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-lg">{referral.patientName}</CardTitle>
                    <CardDescription>{referral.age} / {referral.gender} &bull; {referral.village} (ASHA: {referral.ashaName})</CardDescription>
                </div>
                <Badge variant="outline" className={cn("text-xs whitespace-nowrap", riskColor.bg, riskColor.text, riskColor.border)}>{referral.risk} Risk</Badge>
            </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-1">
                {referral.symptoms.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
            <div className="flex items-center justify-between text-muted-foreground text-xs p-2 bg-secondary/50 rounded-md">
                <span>Temp: <strong>{referral.vitals.temp}</strong></span>
                <span>SpO2: <strong>{referral.vitals.spo2}%</strong></span>
                <span>BP: <strong>{referral.vitals.bp}</strong></span>
            </div>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2 justify-between items-center text-xs">
            <p className="text-muted-foreground">Received: {referral.receivedTime}</p>
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => onOpenCase(referral)}>Open Case</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
            </div>
        </CardFooter>
    </Card>);
};

const CriticalAlertsPanel = () => (<Card className="border-red-500/50 bg-red-50/50">
    <CardHeader>
        <CardTitle className="text-red-600 flex items-center gap-2"><Siren /> Critical Alerts</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
        {criticalAlertsData.map(alert => (<div key={alert.id} className="p-3 rounded-lg bg-red-100/70 border border-red-200 flex justify-between items-center">
            <div>
                <p className="font-bold text-red-900">{alert.patientName}</p>
                <p className="text-sm text-red-700">{alert.alert}</p>
                <p className="text-xs text-red-500">{alert.time}</p>
            </div>
            <Button variant="destructive" size="sm">Emergency Admit <ArrowRight className="h-4 w-4 ml-2" /></Button>
        </div>))}
    </CardContent>
</Card>);

const OpdQueuePanel = () => (<Card>
    <CardHeader><CardTitle>OPD Patient Queue</CardTitle></CardHeader>
    <CardContent>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {opdQueueData.map(p => (<TableRow key={p.token}>
                    <TableCell className="font-mono font-bold">{p.token}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell><Badge variant={p.status === 'Waiting' ? 'default' : p.status === 'In Consult' ? 'outline' : 'secondary'}>{p.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" disabled={p.status !== 'Waiting'}>Start</Button></TableCell>
                </TableRow>))}
            </TableBody>
        </Table>
    </CardContent>
</Card>);

const MedicineStockModule = () => {
    const stockStatusColors = {
        'OK': "bg-green-100 text-green-800",
        'Low': "bg-yellow-100 text-yellow-800",
        'Out of Stock': "bg-red-100 text-red-800",
        'Expiring Soon': "bg-orange-100 text-orange-800",
    };
    return (<Card className="w-full">
        <CardHeader>
            <CardTitle>PHC Medicine Stock</CardTitle>
            <CardDescription>Overview of medicine inventory and stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Medicines" value="128" icon={Box} />
                <StatCard title="Low Stock" value="12" icon={History} colorClass="text-yellow-500" />
                <StatCard title="Out of Stock" value="4" icon={PackageX} colorClass="text-red-500" />
                <StatCard title="Expiring Soon" value="8" icon={CalendarClock} colorClass="text-orange-500" />
            </div>
            <div className="flex flex-col md:flex-row gap-2 md:items-center mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search medicine..." className="pl-8" />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Filter Status</Button>
                    <Button variant="outline">Sort by Expiry</Button>
                    <Button><Truck className="mr-2 h-4 w-4" /> Request Order</Button>
                </div>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {medicineStockData.map((med) => (<TableRow key={med.name}>
                        <TableCell className="font-medium">{med.name}</TableCell>
                        <TableCell>{med.type}</TableCell>
                        <TableCell>{med.stock} {med.unit}</TableCell>
                        <TableCell>{med.expiry}</TableCell>
                        <TableCell>
                            <Badge variant="outline" className={cn("text-xs", stockStatusColors[med.status])}>{med.status}</Badge>
                        </TableCell>
                    </TableRow>))}
                </TableBody>
            </Table>
        </CardContent>
    </Card>);
};

const statusColors = {
    "New": "bg-blue-100 text-blue-800 border-blue-200",
    "High Priority": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Closed": "bg-gray-100 text-gray-800 border-gray-200",
    "All": "", // Not a real status to display
};

const modalRiskColors = {
    "Low": "secondary",
    "Medium": "default",
    "High": "destructive",
};

const PatientDetailModal = ({ patient, isOpen, onOpenChange }) => {
    const { toast } = useToast();
    const [currentSymptoms, setCurrentSymptoms] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiResult, setAiResult] = useState(null);

    const handleAnalyze = async () => {
        if (!currentSymptoms || !patient)
            return;
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
            const result = await analyzeSymptomsForAsha(analysisInput);
            setAiResult(result);
        }
        catch (error) {
            console.error("AI Analysis failed:", error);
            let description = "Could not get a response from the AI. Please try again later.";
            if (error instanceof Error && error.message.includes("429")) {
                description = "You have exceeded the request limit for the AI service. Please wait a moment and try again.";
            }
            toast({
                variant: "destructive",
                title: "AI Analysis Failed",
                description,
            });
        }
        finally {
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

    useEffect(() => {
        if (isOpen && patient?.id) {
            const latestQuery = patient.aiQueryHistory?.slice().reverse()[0];
            if (latestQuery) {
                setCurrentSymptoms(latestQuery.symptoms);
                setAiResult(latestQuery.analysis);
            }
            else {
                setCurrentSymptoms("");
                setAiResult(null);
            }
        }
        else if (!isOpen) {
            stop(); // Stop speaking when modal closes
            const timer = setTimeout(() => {
                setCurrentSymptoms("");
                setAiResult(null);
                setIsAnalyzing(false);
            }, 300); // Animation delay
            return () => clearTimeout(timer);
        }
    }, [isOpen, patient?.id, patient?.aiQueryHistory]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!patient)
        return null;

    return (<Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl flex flex-col p-0 max-h-[90vh]">
            <DialogHeader className="p-6 pb-0 shrink-0">
                <DialogTitle className="sr-only">Patient Details: {patient.patientName}</DialogTitle>
                <DialogDescription className="sr-only">
                    A detailed view of the patient's profile, including their personal information, visit history, and an AI-powered symptom analysis tool.
                </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto">
                <div className="grid md:grid-cols-5">
                    <div className="md:col-span-2 bg-secondary/50 p-6 flex flex-col rounded-bl-lg">
                        <div className="flex items-center gap-4 mb-6">
                            <UserCircle className="w-16 h-16 text-primary" />
                            <div>
                                <h2 className="text-2xl font-bold">{patient.patientName}</h2>
                                <p className="text-muted-foreground">{patient.age} / {patient.gender} from {patient.village}</p>
                                <p className="text-sm text-muted-foreground">{patient.phone}</p>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="font-medium text-muted-foreground">Referral Status:</span>
                                <Badge variant="outline" className={cn(statusColors[patient.status])}>{patient.status}</Badge>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-medium text-muted-foreground">Assessed Risk:</span>
                                <Badge variant={patient.risk === "Critical" ? 'destructive' : 'default'} className={cn(riskColors[patient.risk]?.bg, riskColors[patient.risk]?.text)}>{patient.risk}</Badge>
                            </div>
                        </div>

                        <div className="mt-4 text-sm p-3 bg-primary/10 border border-primary/20 rounded-lg">
                            <h4 className="font-semibold mb-1 text-primary flex items-center gap-2"><FileText className="w-4 h-4" /> ASHA's Referral Note</h4>
                            <p className="text-muted-foreground italic mt-2">&quot;{patient.referralReason}&quot;</p>
                        </div>

                        <hr className="my-6" />
                        <Card className="flex-grow">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2"><History className="w-4 h-4" /> Visit History</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm max-h-80 overflow-y-auto">
                                {patient.history && patient.history.length > 0 ? (patient.history.map((visit, index) => (<div key={index} className="p-3 bg-secondary rounded-md">
                                    <p className="font-semibold">{visit.diagnosis}</p>
                                    <p className="text-xs text-muted-foreground">{visit.date}</p>
                                    <p className="mt-1">Symptoms: {visit.symptoms.join(', ')}</p>
                                    <p>Notes: {visit.notes}</p>
                                </div>))) : (<p className="text-muted-foreground text-center py-4">No visit history found.</p>)}
                            </CardContent>
                        </Card>
                    </div>
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
                            <TabsContent value="new-analysis">
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><BrainCircuit className="text-primary" /> AI Symptom Analysis</CardTitle>
                                        <CardDescription>Enter current symptoms to get an AI-powered analysis and recommendation.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Textarea placeholder="e.g., 'Patient has high fever (102°F) and feels very weak...'" value={currentSymptoms} onChange={(e) => setCurrentSymptoms(e.target.value)} className="min-h-[100px]" />
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={handleAnalyze} disabled={isAnalyzing || !currentSymptoms} className="w-full">
                                            {isAnalyzing && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                            {isAnalyzing ? "Analyzing..." : "Analyze with AI"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                                {aiResult && (<Card className="mt-6 border-primary/50">
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
                                                <Badge variant={modalRiskColors[aiResult.risk]}>{aiResult.risk}</Badge>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="p-3 rounded-md bg-secondary">
                                            <h4 className="font-semibold mb-1 text-primary">AI Statement</h4>
                                            <p className="italic text-foreground">&quot;{aiResult.statement}&quot;</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Potential Condition</h4>
                                            <p className="text-muted-foreground">{aiResult.potentialCondition}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-1">Reasoning</h4>
                                            <p className="text-sm text-muted-foreground">{aiResult.reasoning}</p>
                                        </div>
                                        {aiResult.risk === 'High' && (<div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
                                            <p className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Immediate Action Required</p>
                                            <p className="text-sm mt-1">Refer patient to the nearest PHC/CHC for further evaluation.</p>
                                        </div>)}
                                    </CardContent>
                                </Card>)}
                            </TabsContent>
                            <TabsContent value="query-history">
                                <Card className="mt-4">
                                    <CardHeader>
                                        <CardTitle>Citizen's Health Queries</CardTitle>
                                        <CardDescription>History of AI health queries made by the citizen from their portal.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-3">
                                        {patient.aiQueryHistory && patient.aiQueryHistory.length > 0 ? (patient.aiQueryHistory.slice().reverse().map((query, index) => (<Accordion type="single" collapsible key={index} className="w-full">
                                            <AccordionItem value={`item-${index}`}>
                                                <AccordionTrigger>
                                                    <div className="flex justify-between w-full pr-4 items-center">
                                                        <div className="flex items-center gap-2">
                                                            <History className="w-4 h-4 text-muted-foreground" />
                                                            <span className="font-semibold text-sm">{query.date}</span>
                                                        </div>
                                                        <Badge variant={modalRiskColors[query.analysis.risk]}>{query.analysis.risk}</Badge>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="p-2 space-y-3">
                                                    <div>
                                                        <h4 className="font-semibold text-sm mb-1">Symptoms Reported by Citizen</h4>
                                                        <p className="text-sm text-muted-foreground italic p-2 bg-secondary rounded-md">&quot;{query.symptoms}&quot;</p>
                                                    </div>
                                                    <Separator />
                                                    <h4 className="font-semibold text-sm">AI Analysis Result</h4>
                                                    <div className="text-sm p-3 bg-secondary/50 rounded-md space-y-2">
                                                        <p><span className="font-medium">Statement:</span> {query.analysis.statement}</p>
                                                        <p><span className="font-medium">Potential Condition:</span> {query.analysis.potentialCondition}</p>
                                                        <p><span className="font-medium">Reasoning:</span> {query.analysis.reasoning}</p>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>))) : (<p className="text-muted-foreground text-center py-8">No past AI queries found for this patient.</p>)}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </DialogContent>
    </Dialog>);
};

// SECTION: MAIN PAGE COMPONENT
export default function ClinicalDashboard() {
    useAuthGuard("clinical"); // 👈 AUTH GUARD ADDED

    const { t } = useLanguage(); // 👈 LANGUAGE HOOK

    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    const handleViewDetails = (patient) => {
        setSelectedPatient(patient);
        setIsDetailModalOpen(true);
    };

    return (<div className="flex flex-col min-h-screen bg-secondary/50">
        <ClinicalDashboardHeader t={t} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto space-y-6">

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <StatCard title="New Referrals" value="5" icon={FilePlus} subtext="Today" colorClass="text-primary" />
                    <StatCard title="Critical Cases" value="3" icon={CircleAlert} subtext="Active" colorClass="text-red-500" />
                    <StatCard title="Waiting Patients" value="8" icon={Hourglass} />
                    <StatCard title="In Consultation" value="2" icon={Users} />
                    <StatCard title="Closed Cases" value="12" icon={CheckCircle} subtext="Today" />
                    <StatCard title="Follow-ups Due" value="6" icon={History} />
                </div>

                <Tabs defaultValue="referrals">
                    <TabsList className="grid w-full grid-cols-2 max-w-md">
                        <TabsTrigger value="referrals"><Inbox className="mr-2" /> Referral Inbox</TabsTrigger>
                        <TabsTrigger value="inventory"><Pill className="mr-2" /> PHC Medicine Stock</TabsTrigger>
                    </TabsList>

                    <TabsContent value="referrals" className="mt-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            <div className="lg:col-span-3">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Referral Inbox</CardTitle>
                                        <Tabs defaultValue="new" className="mt-4">
                                            <TabsList>
                                                <TabsTrigger value="new">New</TabsTrigger>
                                                <TabsTrigger value="high-priority">High Priority</TabsTrigger>
                                                <TabsTrigger value="all">All</TabsTrigger>
                                                <TabsTrigger value="closed">Closed</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {referralsData.map(r => <ReferralCard key={r.id} referral={r} onOpenCase={handleViewDetails} />)}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-1 space-y-6">
                                <CriticalAlertsPanel />
                                <OpdQueuePanel />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="inventory" className="mt-4">
                        <MedicineStockModule />
                    </TabsContent>
                </Tabs>
            </div>
        </main>
        <PatientDetailModal patient={selectedPatient} isOpen={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} />
    </div>);
}