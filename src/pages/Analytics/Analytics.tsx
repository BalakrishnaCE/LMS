import React, { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Target,
  Activity,
  Award,
  PieChart as IconPieChart,
  BarChart2,
  LineChart as IconLineChart,
  Filter,
  FileDown,
  HelpCircle, // For Q&A
  ListChecks,
  Eye,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Share2,
  Timer,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Grid,
  RepeatIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  LineChart,
  Line,
  PieChart,
  Pie,
  CartesianGrid
} from "recharts";
import { useFrappeGetCall } from 'frappe-react-sdk';

// Custom hook for pagination
const usePagination = (data: any[], itemsPerPage: number = 5) => {
  const [currentPage, setCurrentPage] = useState(1);
  const maxPage = Math.ceil(data.length / itemsPerPage);
  const currentData = useMemo(() => {
    if(!data) return [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return data.slice(start, end);
  }, [data, currentPage, itemsPerPage]);

  const next = () => setCurrentPage((current) => Math.min(current + 1, maxPage));
  const prev = () => setCurrentPage((current) => Math.max(current - 1, 1));
  const jump = (page: number) => {
      const pageNumber = Math.max(1, Math.min(page, maxPage));
      setCurrentPage(pageNumber);
  };
  const reset = () => setCurrentPage(1);


  return { currentData, currentPage, maxPage, next, prev, jump, reset };
};

// Generic DataTable component for reuse
interface DataTableProps {
    data: any[];
    columns: string[]; // Column keys from data objects
    onRowClick?: (row: any) => void;
    itemsPerPage?: number; // Optional for internal pagination if needed, but main pagination is external
}
const DataTable: React.FC<DataTableProps> = ({ data, columns, onRowClick }) => {
    if (!data || data.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No data available for the current selection.</p>;
    }
    // Ensure columns are derived if not explicitly provided, or use provided ones
    const tableHeaders = columns && columns.length > 0 ? columns : Object.keys(data[0] || {});

    const formatHeader = (header: string) => {
        return header
            .replace(/_/g, ' ') // Replace underscores with spaces
            .replace(/([A-Z])/g, ' $1') // Add space before capital letters for camelCase/PascalCase
            .replace(/\b\w/g, char => char.toUpperCase()); // Capitalize first letter of each word
    };

    return (
        <div className="overflow-x-auto">
            <Table className="min-w-full">
                <TableHeader>
                    <TableRow>
                        {tableHeaders.map(header => (
                            <TableHead key={header} className="whitespace-nowrap">{formatHeader(header)}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow 
                            key={rowIndex} 
                            onClick={() => onRowClick && onRowClick(row)} 
                            className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
                        >
                            {tableHeaders.map(header => (
                                <TableCell key={`${header}-${rowIndex}`} className="whitespace-nowrap text-sm">
                                    {typeof row[header] === 'boolean' ? (row[header] ? 'Yes' : 'No') : (row[header]?.toString() ?? 'N/A')}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};

function getCssVarValue(varName: string) {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
}

// Helper: format JS Date to Frappe's required string format 'YYYY-MM-DD HH:mm:ss'
function toFrappeDateString(date: Date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// User type for user/learner info (no department field)
type UserItem = { name: string; email: string; full_name: string; creation: string; };

// --- STATIC DATA (replace API calls) ---
const staticUsers = [
  { name: "user1", email: "user1@email.com", full_name: "Alice Smith", creation: "2024-05-01" },
  { name: "user2", email: "user2@email.com", full_name: "Bob Jones", creation: "2024-05-02" },
  { name: "user3", email: "user3@email.com", full_name: "Charlie Brown", creation: "2024-05-03" },
];
const staticModules = [
  { name: "mod1", creation: "2024-05-01" },
  { name: "mod2", creation: "2024-05-02" },
  { name: "mod3", creation: "2024-05-03" },
];
const staticProgress = [
  { name: "prog1", lms_module: "mod1", learner: "user1", status: "Completed", score: 90, module_duration: 120, completed_on: "2024-05-10", modified: "2024-05-10" },
  { name: "prog2", lms_module: "mod2", learner: "user2", status: "Started", score: 60, module_duration: 80, completed_on: "", modified: "2024-05-12" },
  { name: "prog3", lms_module: "mod3", learner: "user3", status: "Started", score: 40, module_duration: 60, completed_on: "", modified: "2024-05-13" },
];
const staticQuizProgress = [
  { name: "quizprog1", user: "user1", quiz: "quiz1", score: 85, started_on: "2024-05-10", ended_on: "2024-05-10", time_spent: 30 },
  { name: "quizprog2", user: "user2", quiz: "quiz2", score: 70, started_on: "2024-05-12", ended_on: "2024-05-12", time_spent: 25 },
];
const staticQaProgress = [
  { name: "qaprog1", question_answer: "qa1", user: "user1", score: 80 },
  { name: "qaprog2", question_answer: "qa2", user: "user2", score: 60 },
];
const staticDepartments = [
  { name: "dept1", department: "Engineering" },
  { name: "dept2", department: "Sales" },
];
const staticQuizzes = [
  { name: "quiz1", title: "Quiz 1" },
  { name: "quiz2", title: "Quiz 2" },
];
// --- END STATIC DATA ---
// TODO: Restore API integration after UI improvements

// 1. Heatmap color grading utility
function getHeatmapColor(value: number) {
  // 0% = #f3f4f6 (gray-100), 100% = #16a34a (green-600)
  if (value === 0) return '#f3f4f6';
  // Interpolate between gray and green
  const green = [22, 163, 74]; // #16a34a
  const gray = [243, 244, 246]; // #f3f4f6
  const r = Math.round(gray[0] + (green[0] - gray[0]) * (value / 100));
  const g = Math.round(gray[1] + (green[1] - gray[1]) * (value / 100));
  const b = Math.round(gray[2] + (green[2] - gray[2]) * (value / 100));
  return `rgb(${r},${g},${b})`;
}

export default function AnalyticsDashboard() {
  // --- STATE HOOKS (unchanged) ---
  const [dateRange, setDateRange] = useState("last_30_days");
  const [department, setDepartment] = useState("All");
  const [module, setModule] = useState("All");
  const [quiz, setQuiz] = useState("All");
  const [learner, setLearner] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllLearners, setShowAllLearners] = useState(false);
  const [showAllAttention, setShowAllAttention] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState<string | null>(null);

  // --- API CALL WITH FRAPPE-REACT-SDK ---
  const apiParams: Record<string, string> = {
    date_range: dateRange,
  };
  if (department !== 'All') apiParams.department = department;
  if (module !== 'All') apiParams.module = module;
  if (quiz !== 'All') apiParams.quiz = quiz;
  if (learner !== 'All') apiParams.learner = learner;
  // TODO: Add TL filter in the future

  const {
    data: apiData,
    isLoading: apiLoading,
    error: apiError,
    mutate: mutateAnalytics
  } = useFrappeGetCall<{ message: any }>(
    'getLMSAnalytics',
    apiParams
  );

  useEffect(() => {
    mutateAnalytics();
  }, [dateRange, department, module, quiz, learner]);

  // --- EXTRACT DATA FROM API RESPONSE (always run hooks, use defaults if loading/error) ---
  const message = apiData?.message || {};
  const statCards = message.stat_cards || [];
  const modules = message.modules || [];
  const learners = message.learners || [];
  const departments = message.departments || [];
  const quizzes = message.quizzes || [];
  const progress = message.progress || [];
  const quizProgress = message.quiz_progress || [];
  const qaProgress = message.qa_progress || [];

  // --- ALL MEMOS AND DERIVED DATA HOOKS (ALWAYS RUN) ---
  const departmentOptions = useMemo(() => ['All', ...(departments).map((d: any) => d.department)], [departments]);
  const learnerOptions = useMemo(() => ['All', ...(learners).map((u: any) => u.full_name)], [learners]);
  const moduleOptions = useMemo(() => ['All', ...(modules).map((m: any) => m.name)], [modules]);
  const quizOptions = useMemo(() => ['All', ...(quizzes).map((q: any) => q.title)], [quizzes]);
  const moduleMap = useMemo(() => Object.fromEntries((modules).map((m: any) => [m.name, m])), [modules]);
  const userMap = useMemo(() => Object.fromEntries((learners).map((u: any) => [u.name, u])), [learners]);
  const quizMap = useMemo(() => Object.fromEntries((quizzes).map((q: any) => [q.name, q])), [quizzes]);

  // --- LOADING/ERROR STATES (after all hooks) ---
  if (apiLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }
  if (apiError || !apiData) {
    return <div className="p-8 text-center text-destructive">Error loading analytics data.<br/>Check API and permissions.</div>;
  }

  // --- STATS COMPUTATION ---
  // Helper: last 30 days in Frappe format
  const now = new Date();
  const last30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30Frappe = toFrappeDateString(last30);

  // Total Learners
  const totalLearners = learners.length;
  // Active Learners: unique learners with progress.modified_on in last 30 days
  const activeLearnerSet = new Set(progress.filter((p: any) => p.modified && new Date(p.modified) > last30).map((p: any) => p.learner));
  const activeLearners = activeLearnerSet.size;
  // Overall Completion %
  const completedCount = progress.filter((p: any) => p.status === 'Completed').length;
  const overallCompletionRate = progress.length > 0 ? Math.round((completedCount / progress.length) * 100) : 0;
  // New Modules This Month
  const newModulesThisMonth = modules.filter((m: any) => m.creation && new Date(m.creation) > last30).length;
  // Questions Answered
  const questionsAnswered = qaProgress.length;
  // Quizzes Attempted
  const quizzesAttempted = quizProgress.filter((q: any) => q.ended_on).length;
  // Avg Time Spent/Module
  const avgTimeSpent = progress.length > 0 ? Math.round((progress.reduce((sum: any, p: any) => sum + (p.module_duration || 0), 0) / progress.length)) : 0;
  // Avg Quiz Score
  const avgQuizScore = quizProgress.length > 0 ? Math.round((quizProgress.reduce((sum: any, q: any) => sum + (q.score || 0), 0) / quizProgress.length)) : 0;
  // Avg Q&A Score
  const avgQAScore = qaProgress.length > 0 ? Math.round((qaProgress.reduce((sum: any, q: any) => sum + (q.score || 0), 0) / qaProgress.length)) : 0;

  // --- CHARTS & TABLES (LIVE DATA) ---
  // Quiz Attempts vs Assigned (per module)
  const quizAttemptsVsAssigned = (modules).map((mod: any) => {
    const assigned = (quizProgress).filter((q: any) => q.quiz && q.quiz.startsWith(mod.name)).length;
    const attempted = (quizProgress).filter((q: any) => q.quiz && q.quiz.startsWith(mod.name) && q.ended_on).length;
    return { module: mod.name, assigned, attempted };
  });
  // Modules Started vs Assigned (per module)
  const modulesStartedVsAssigned = (modules).map((mod: any) => {
    const assigned = (progress).filter((p: any) => p.lms_module === mod.name).length;
    const started = (progress).filter((p: any) => p.lms_module === mod.name && p.status === 'Started').length;
    return { module: mod.name, assigned, started };
  });
  // Progress Heatmap (learners x modules)
  const progressHeatmap = (learners).map((learner: any) => {
    const row: any = { learner: learner.name };
    (modules).forEach((mod: any) => {
      const p = (progress).find((pr: any) => pr.learner === learner.name && pr.lms_module === mod.name);
      row[mod.name] = p ? (p.status === 'Completed' ? 100 : (p.score || 0)) : 0;
    });
    return row;
  });

  // --- UI ---
  // Learners Needing Attention: separate reasons, clickable, filterable
  // Compute specific reason for each learner
  const learnersNeedingAttention = learners
    .map((learner: any) => {
      const learnerProgress = progress.filter((p: any) => p.learner === learner.name);
      const overdue = learnerProgress.some((p: any) => p.status !== 'Completed' && p.modified && new Date(p.modified) < last30);
      const lowProgress = learnerProgress.some((p: any) => (p.score || 0) < 50);
      if (overdue) return { learner: learner.name, reason: 'Overdue' };
      if (lowProgress) return { learner: learner.name, reason: 'Low Progress' };
      return null;
    })
    .filter((x: any): x is { learner: string; reason: string } => x !== null);

  const filteredUsers = attentionFilter
    ? learners.filter((u: any) => u.name === attentionFilter)
    : learners;
  const filteredProgress = attentionFilter
    ? progress.filter((p: any) => p.learner === attentionFilter)
    : progress;
  const filteredQaProgress = attentionFilter
    ? qaProgress.filter((q: any) => q.user === attentionFilter)
    : qaProgress;
  const filteredQuizProgress = attentionFilter
    ? quizProgress.filter((q: any) => q.user === attentionFilter)
    : quizProgress;

  // 3. Module Insights: single table for Fastest/Slowest Learners
  // Compute time spent per learner per module
  const moduleTimes: { learner: string; module: string; time: number; }[] = [];
  progress.forEach((p: any) => {
    moduleTimes.push({ learner: p.learner, module: p.lms_module, time: p.module_duration || 0 });
  });
  // Sort by time ascending (fastest first)
  const sortedModuleTimes = [...moduleTimes].sort((a, b) => a.time - b.time);
  const fastest = sortedModuleTimes.slice(0, 2);
  const slowest = sortedModuleTimes.slice(-2);

  function getStatus(learner: string, module: string) {
    if (fastest.some((f: any) => f.learner === learner && f.module === module)) return 'Fastest';
    if (slowest.some((s: any) => s.learner === learner && s.module === module)) return 'Slowest';
    return '';
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <div className="flex flex-col">
          <label htmlFor="dateRange" className="text-xs text-muted-foreground mb-1">Date Range</label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger id="dateRange" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{["Last 7 Days", "Last 30 Days", "Last 90 Days"].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="department" className="text-xs text-muted-foreground mb-1">Department</label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {departmentOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="learner" className="text-xs text-muted-foreground mb-1">Learner</label>
          <Select value={learner} onValueChange={setLearner}>
            <SelectTrigger id="learner" className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {learnerOptions.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => {
          setDateRange("Last 30 Days");
          setDepartment("All");
          setLearner("All");
        }}>Reset Filters</Button>
        <Button variant="outline" className="ml-auto" onClick={() => alert('Export to Excel (not implemented)')}> <FileDown className="h-4 w-4 mr-1" /> Export to Excel</Button>
        <Button variant="outline" onClick={() => alert('Share Analytics (not implemented)')}> <Share2 className="h-4 w-4 mr-1" /> Share Analytics</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card: any) => (
          <Card key={card.title} className="shadow-sm bg-card flex flex-col items-center justify-center p-4">
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-xs text-muted-foreground mt-1 text-center">{card.title}</div>
          </Card>
        ))}
      </div>

      {/* Tabs for analytics sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 bg-card p-1 rounded-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learner">Learner Insights</TabsTrigger>
          <TabsTrigger value="module">Module Insights</TabsTrigger>
          <TabsTrigger value="quiz">Q&A / Quiz</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Compact Module Drill-down filter row */}
          <div className="flex items-center gap-2 mb-2">
            <label className="text-xs text-muted-foreground">Module Drill-down:</label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{moduleOptions.slice(1).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">(Coming soon)</span>
          </div>
          {/* Balanced grid for charts: two per row, no empty cells */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Attempts vs Assigned */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Quiz Attempts vs Assigned</CardTitle>
                <CardDescription>How many quizzes were attempted vs assigned per module.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizAttemptsVsAssigned}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="module" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="assigned" name="Assigned" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                    <Bar dataKey="attempted" name="Attempted" fill={getCssVarValue('--chart-2') || '#22c55e'} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Modules Started vs Assigned */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Modules Started vs Assigned</CardTitle>
                <CardDescription>Modules started vs assigned per module.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={modulesStartedVsAssigned}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="module" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="assigned" name="Assigned" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                    <Bar dataKey="started" name="Started" fill={getCssVarValue('--chart-2') || '#22c55e'} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Question Answers Attempted vs Assigned */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Question Answers Attempted vs Assigned</CardTitle>
                <CardDescription>Questions attempted vs assigned per module.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={qaProgress}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="question_answer" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Score" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Time Spent vs Expected Duration */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary"/>Time Spent vs Expected Duration</CardTitle>
                <CardDescription>Compare actual time spent to expected duration per module.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={progress}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="lms_module" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="module_duration" name="Duration" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="score" name="Score" stroke={getCssVarValue('--chart-2') || '#22c55e'} strokeWidth={2} dot />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Learner Insights Tab */}
        <TabsContent value="learner" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Heatmap */}
            <Card className="shadow-sm bg-card col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Grid className="h-5 w-5 text-primary"/>Progress Heatmap</CardTitle>
                <CardDescription>Learner progress across modules. <span className="ml-2 text-xs">(Deeper green = higher progress)</span></CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="min-w-max border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 text-left text-xs text-muted-foreground">Learner</th>
                      {Object.keys(progressHeatmap[0]).filter(k => k !== 'learner').map(module => (
                        <th key={module} className="p-2 text-xs text-muted-foreground">{module}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(progressHeatmap).map((row: any) => (
                      <tr key={row.learner}>
                        <td className="p-2 font-medium text-sm">{row.learner}</td>
                        {Object.keys(row).filter((k: string) => k !== 'learner').map((module: string) => {
                          const value = row[module] ?? 0;
                          return (
                            <td key={module} className="p-2">
                              <div style={{ background: getHeatmapColor(value), borderRadius: 4, padding: 4, color: value > 60 ? '#fff' : '#222', textAlign: 'center', minWidth: 32 }}>
                                {value}%
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Color legend */}
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span>Progress:</span>
                  <span style={{ background: getHeatmapColor(0), width: 24, height: 12, display: 'inline-block', borderRadius: 2 }} title="0%" />
                  <span>0%</span>
                  <span style={{ background: getHeatmapColor(50), width: 24, height: 12, display: 'inline-block', borderRadius: 2 }} title="50%" />
                  <span>50%</span>
                  <span style={{ background: getHeatmapColor(100), width: 24, height: 12, display: 'inline-block', borderRadius: 2 }} title="100%" />
                  <span>100%</span>
                </div>
              </CardContent>
            </Card>
            {/* Learners Needing Attention */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-500"/>Learners Needing Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {learnersNeedingAttention.length === 0 && <li className="text-muted-foreground">No learners need attention.</li>}
                  {learnersNeedingAttention.map((l: any) => (
                    <li key={l.learner}>
                      <button
                        className={`font-semibold mr-2 underline hover:text-primary focus:outline-none ${attentionFilter === l.learner ? 'text-primary' : ''}`}
                        onClick={() => setAttentionFilter(attentionFilter === l.learner ? null : l.learner)}
                        title="Click to filter by this learner"
                      >
                        {l.learner}
                      </button>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${l.reason === 'Overdue' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}
                        title={l.reason === 'Overdue' ? 'Learner has overdue modules' : 'Learner has low progress'}>
                        {l.reason}
                      </span>
                    </li>
                  ))}
                </ul>
                {attentionFilter && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAttentionFilter(null)}>Clear Filter</Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Module Insights Tab */}
        <TabsContent value="module" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Completions */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary"/>Recent Completions</CardTitle>
                <CardDescription>Completions in the last 30 days.</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Learner</th>
                      <th className="p-2 text-left">Module</th>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(qaProgress).map((row: any) => (
                      <tr key={row.name}>
                        <td className="p-2">{row.user}</td>
                        <td className="p-2">{row.question_answer}</td>
                        <td className="p-2">{typeof row.name === 'string' ? row.name.split('_').pop() : ''}</td>
                        <td className="p-2">{row.score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            {/* Learner Module Completion Times */}
            <Card className="shadow-sm bg-card col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-primary"/>Learner Module Completion Times</CardTitle>
                <CardDescription>Time spent per learner per module. <span className="ml-2 text-xs">(Fastest and slowest highlighted)</span></CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="p-2 text-left">Learner</th>
                      <th className="p-2 text-left">Module</th>
                      <th className="p-2 text-left">Time Spent</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedModuleTimes.map((row: any) => (
                      <tr key={row.learner + row.module}>
                        <td className="p-2">{row.learner}</td>
                        <td className="p-2">{row.module}</td>
                        <td className="p-2">{Math.floor(row.time / 60)}h {row.time % 60}m</td>
                        <td className="p-2">
                          {getStatus(row.learner, row.module) === 'Fastest' && <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-medium" title="Among the fastest"><ArrowUpRight className="h-3 w-3 mr-1"/>Fastest</span>}
                          {getStatus(row.learner, row.module) === 'Slowest' && <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-medium" title="Among the slowest"><ArrowDownRight className="h-3 w-3 mr-1"/>Slowest</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Q&A / Quiz Tab */}
        <TabsContent value="quiz" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quiz Attempts vs Score */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Quiz Attempts vs Score</CardTitle>
                <CardDescription>Quiz attempts vs average score per module.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(quizProgress)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="quiz" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="score" name="Score" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Q&A Attempted vs Score */}
            <Card className="shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5 text-primary"/>Q&A Attempted vs Score</CardTitle>
                <CardDescription>Q&A attempts vs average score per module.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(qaProgress)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="question_answer" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="score" name="Score" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            {/* Quiz Question Difficulty Analysis */}
            <Card className="shadow-sm bg-card col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><IconPieChart className="h-5 w-5 text-primary"/>Quiz Question Difficulty Analysis</CardTitle>
                <CardDescription>Correct vs incorrect answers by question difficulty.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(qaProgress)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="question_answer" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Score" fill={getCssVarValue('--chart-1') || '#0ea5e9'} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
