"use client";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage"; // 👈 LANGUAGE HOOK
import Link from "next/link";
import Image from "next/image";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, } from "recharts";
import { AlertCircle, Bell, Building, ChevronDown, Download, FileText, Home, LogOut, Map, Package, Send, Settings, Siren, TrendingUp, Users, User, HeartPulse, CheckCircle, Clock, BarChart2, Users2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");
const heatMapImage = PlaceHolderImages.find(img => img.id === 'admin-heatmap-india');
const navItems = [
    { name: "Overview", icon: Home, href: "#" },
    { name: "Heatmap", icon: Map, href: "#" },
    { name: "Outbreak Trends", icon: TrendingUp, href: "#" },
    { name: "Referrals", icon: Send, href: "#" },
    { name: "Inventory", icon: Package, href: "#" },
    { name: "ASHA Performance", icon: Users, href: "#" },
    { name: "PHC Performance", icon: Building, href: "#" },
    { name: "Reports", icon: FileText, href: "#" },
    { name: "Alerts", icon: Bell, href: "#" },
    { name: "Settings", icon: Settings, href: "#" },
];
const kpiData = [
    { title: "Total Users", value: "1.2M", icon: Users, change: "+5.2%", changeType: 'increase' },
    { title: "Active ASHAs", value: "4,512", icon: Users2, change: "+1.8%", changeType: 'increase' },
    { title: "Active PHCs", value: "389", icon: Building, change: "2 new", changeType: 'increase' },
    { title: "High Risk Today", value: "1,204", icon: HeartPulse, change: "+12.5%", changeType: 'increase' },
    { title: "Referrals Today", value: "891", icon: Send, change: "-2.1%", changeType: 'decrease' },
    { title: "Emergency Alerts", value: "42", icon: Siren, change: "+3", changeType: 'increase' },
    { title: "Case Closure Rate", value: "92.1%", icon: CheckCircle, change: "+0.5%", changeType: 'increase' },
    { title: "Avg. Response Time", value: "18m", icon: Clock, change: "-2m", changeType: 'decrease' },
];
const outbreakData = [
    { name: "Week 1", "Dengue-like": 120, "Viral Fever": 200, "Diarrhea": 80 },
    { name: "Week 2", "Dengue-like": 150, "Viral Fever": 220, "Diarrhea": 95 },
    { name: "Week 3", "Dengue-like": 180, "Viral Fever": 250, "Diarrhea": 110 },
    { name: "Week 4", "Dengue-like": 250, "Viral Fever": 230, "Diarrhea": 100 },
];
const referralData = [
    { id: 'R001', phc: 'PHC Rampur', case: 'Fever/Cough', status: 'Pending @ PHC', time: '2h', risk: 'Medium' },
    { id: 'R002', phc: 'SC Sitapur', case: 'Maternal Checkup', status: 'Pending @ SC', time: '5h', risk: 'Low' },
    { id: 'R003', phc: 'PHC Alipur', case: 'Acute Stomach Pain', status: 'Pending @ PHC', time: '30m', risk: 'High' },
    { id: 'R004', phc: 'PHC Rampur', case: 'Injury', status: 'Closed', time: '1d', risk: 'Low' },
];
const supplyData = [
    { name: 'Paracetamol', available: 85, transit: 15, status: 'OK' },
    { name: 'Amoxicillin', available: 40, transit: 60, status: 'Low' },
    { name: 'ORS', available: 10, transit: 90, status: 'Critical' },
    { name: 'Ibuprofen', available: 95, transit: 5, status: 'OK' },
];
export default function AdminDashboard() {
    const [activeNav, setActiveNav] = useState("Overview");
    const { t } = useLanguage(); // 👈 LANGUAGE HOOK

    return (<div className="flex min-h-screen w-full bg-secondary/30">
        {/* Sidebar Navigation */}
        <aside className="hidden w-64 flex-col border-r bg-background p-4 sm:flex">
            <div className="flex items-center gap-2 mb-8">
                <Link href="/" className="flex items-center space-x-2">
                    <svg className="h-8 w-8 text-primary" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M50 15L85 32.5V67.5L50 85L15 67.5V32.5L50 15Z" fill="currentColor" />
                        <path d="M50 40V60M40 50H60" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="inline-block font-bold text-lg">{t("appTitle")}</span>
                </Link>
            </div>
            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (<Button key={item.name} variant={activeNav === item.name ? "secondary" : "ghost"} className="justify-start gap-3" onClick={() => setActiveNav(item.name)}>
                    <item.icon className="h-5 w-5" />
                    {item.name}
                </Button>))}
            </nav>
            <div className="mt-auto">
                <Card>
                    <CardHeader className="p-4">
                        <CardTitle className="text-base">Upgrade to Pro</CardTitle>
                        <CardDescription className="text-xs">
                            Unlock predictive analytics and advanced AI reports.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <Button className="w-full">Upgrade</Button>
                    </CardContent>
                </Card>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
            {/* Top Header */}
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-lg px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold">{activeNav}</h1>
                </div>
                <div className="flex items-center gap-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <span>National</span> <ChevronDown className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>State</DropdownMenuItem>
                            <DropdownMenuItem>District</DropdownMenuItem>
                            <DropdownMenuItem>Block</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export
                    </Button>
                    <Button variant="ghost" size="icon">
                        <Bell className="h-5 w-5" />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={userAvatar?.imageUrl} alt="Admin" data-ai-hint={userAvatar?.imageHint} />
                                    <AvatarFallback>A</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem><User className="mr-2 h-4 w-4" /> Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                                import("@/lib/auth").then(({ logout }) => logout());
                            }} className="cursor-pointer text-destructive focus:text-destructive">
                                <LogOut className="mr-2 h-4 w-4" /> Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            {/* Dashboard Grid */}
            <main className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                        {kpiData.map(kpi => (<Card key={kpi.title}>
                            <CardHeader className="pb-2">
                                <CardDescription className="text-xs">{kpi.title}</CardDescription>
                                <CardTitle className="text-2xl font-bold">{kpi.value}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className={cn("text-xs", kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600')}>{kpi.change}</div>
                            </CardContent>
                        </Card>))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Heatmap */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Health Risk Heatmap</CardTitle>
                                <CardDescription>District-wise risk indicators for the last 7 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {heatMapImage && <Image src={heatMapImage.imageUrl} alt="India Heatmap" width={800} height={500} className="rounded-lg" data-ai-hint={heatMapImage.imageHint} />}
                            </CardContent>
                        </Card>

                        {/* Outbreak Trends */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Outbreak / Trend Detection</CardTitle>
                                <CardDescription>Rising symptoms and potential clusters.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="p-4 rounded-lg bg-amber-100 border border-amber-200 text-amber-900">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="font-bold">Dengue-like symptoms ↑ 32% in last 7 days in Alipur block.</p>
                                    </div>
                                </div>
                                <div className="h-64 mt-4 -ml-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={outbreakData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                            <Tooltip />
                                            <Legend iconType="circle" iconSize={10} />
                                            <Line type="monotone" dataKey="Dengue-like" stroke="hsl(var(--destructive))" strokeWidth={2} />
                                            <Line type="monotone" dataKey="Viral Fever" stroke="hsl(var(--primary))" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Referral Monitor */}
                        <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Referral & Case Management Monitor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="all">
                                    <TabsList>
                                        <TabsTrigger value="all">Total Referrals (4)</TabsTrigger>
                                        <TabsTrigger value="phc">Pending @ PHC (2)</TabsTrigger>
                                        <TabsTrigger value="sc">Pending @ SC (1)</TabsTrigger>
                                        <TabsTrigger value="closed">Closed (1)</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                                <Table className="mt-4">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Case ID</TableHead>
                                            <TableHead>Facility</TableHead>
                                            <TableHead>Condition</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Risk</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referralData.map(r => (<TableRow key={r.id}>
                                            <TableCell className="font-mono">{r.id}</TableCell>
                                            <TableCell>{r.phc}</TableCell>
                                            <TableCell>{r.case}</TableCell>
                                            <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                                            <TableCell><Badge variant={r.risk === 'High' ? 'destructive' : r.risk === 'Medium' ? 'default' : 'secondary'}>{r.risk}</Badge></TableCell>
                                        </TableRow>))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Medicine Supply Chain */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Medicine Supply Chain</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="p-3 bg-secondary rounded-lg">
                                        <p className="text-sm text-muted-foreground">Low Stock Facilities</p>
                                        <p className="text-2xl font-bold">18</p>
                                    </div>
                                    <div className="p-3 bg-secondary rounded-lg">
                                        <p className="text-sm text-muted-foreground">Out of Stock</p>
                                        <p className="text-2xl font-bold">4</p>
                                    </div>
                                </div>
                                <p className="text-sm font-medium mb-2">State Stock Availability (%)</p>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={supplyData} layout="vertical" margin={{ left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" hide />
                                        <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} />
                                        <Bar dataKey="available" name="Available" stackId="a" fill="hsl(var(--primary))" radius={[4, 0, 0, 4]} />
                                        <Bar dataKey="transit" name="In Transit" stackId="a" fill="hsl(var(--secondary-foreground))" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full">View Full Inventory</Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Placeholder cards for other sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><BarChart2 /> Facility Performance</CardTitle>
                                <CardDescription>Top and low performing PHCs based on screenings and resolution rate.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center text-muted-foreground py-10">
                                Analytics coming soon.
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users2 /> ASHA Worker Performance</CardTitle>
                                <CardDescription>Monitor ASHA activities, follow-ups, and referral accuracy.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center text-muted-foreground py-10">
                                Analytics coming soon.
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><PieChart /> User Demographics</CardTitle>
                                <CardDescription>Distribution of patients by age, gender, and conditions.</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center text-muted-foreground py-10">
                                Analytics coming soon.
                            </CardContent>
                        </Card>
                    </div>


                </div>
            </main>
        </div>
    </div>);
}
// Dummy component since PieChart is not available in recharts by default without importing
const PieChart = (props) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
    <path d="M22 12A10 10 0 0 0 12 2v10z" />
</svg>);
