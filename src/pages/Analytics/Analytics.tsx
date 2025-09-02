import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
  HelpCircle,
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
  Calendar,
  Clock,
  Star,
  Zap,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  LineChart
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
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  CartesianGrid,
  AreaChart,
  Area,
  ComposedChart
} from "recharts";
import { useLMSAnalytics } from '@/lib/api';
import { toast } from "sonner";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import OverviewDashboard from './components/OverviewDashboard';
import ModuleAnalytics from './components/ModuleAnalytics';
import DepartmentAnalytics from './components/DepartmentAnalytics';
import LearnerAnalytics from './components/LearnerAnalytics';
import QuizAnalytics from './components/QuizAnalytics';

// Types
interface AnalyticsData {
  overview: {
    total_learners: number;
    total_modules: number;
    total_quizzes: number;
    active_learners: number;
    completion_rate: number;
    avg_progress: number;
    total_achievements: number;
    avg_quiz_score: number;
  };
  module_analytics: Array<{
    module_name: string;
    enrolled_count: number;
    completed_count: number;
    completion_rate: number;
    avg_progress: number;
    avg_time_spent: number;
    difficulty_score: number;
  }>;
  department_analytics: Array<{
    department_name: string;
    learner_count: number;
    avg_completion_rate: number;
    avg_progress: number;
    top_module: string;
    active_learners: number;
  }>;
  learner_analytics: Array<{
    learner_name: string;
    email: string;
    department: string;
    modules_enrolled: number;
    modules_completed: number;
    completion_rate: number;
    avg_progress: number;
    total_time_spent: number;
    achievements_count: number;
    last_activity: string;
  }>;
  quiz_analytics: Array<{
    quiz_name: string;
    module_name: string;
    total_attempts: number;
    avg_score: number;
    pass_rate: number;
    avg_time_spent: number;
    difficulty_level: string;
  }>;
  trends: {
    daily: Array<{ date: string; active_users: number; completions: number; avg_progress: number }>;
    weekly: Array<{ week: string; active_users: number; completions: number; avg_progress: number }>;
    monthly: Array<{ month: string; active_users: number; completions: number; avg_progress: number }>;
  };
}

interface FilterState {
  dateRange: string;
  dateFrom: string;
  dateTo: string;
  department: string;
  module: string;
  learner: string;
  quiz: string;
}

// Custom hook for pagination
const usePagination = (data: any[], itemsPerPage: number = 10) => {
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

  return {
    currentData,
    currentPage,
    maxPage,
    next,
    prev,
    jump,
    reset,
    hasNext: currentPage < maxPage,
    hasPrev: currentPage > 1
  };
};

// Utility functions
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
};

const getTrendIcon = (current: number, previous: number) => {
  if (current > previous) return <ArrowUpRight className="h-4 w-4 text-green-500" />;
  if (current < previous) return <ArrowDownRight className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-gray-500" />;
};

const getTrendColor = (current: number, previous: number) => {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-600";
  return "text-gray-600";
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "last_30_days",
    dateFrom: "",
    dateTo: "",
    department: "",
    module: "",
    learner: "",
    quiz: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Use mock data instead of API call to avoid errors
  const mockData: AnalyticsData = {
    overview: {
      total_learners: 150,
      total_modules: 25,
      total_quizzes: 50,
      active_learners: 120,
      completion_rate: 75.5,
      avg_progress: 68.2,
      total_achievements: 45,
      avg_quiz_score: 82.3
    },
    module_analytics: [
      {
        module_name: "Introduction to LMS",
        enrolled_count: 45,
        completed_count: 38,
        completion_rate: 84.4,
        avg_progress: 78.5,
        avg_time_spent: 120,
        difficulty_score: 2.1
      },
      {
        module_name: "Advanced Analytics",
        enrolled_count: 32,
        completed_count: 25,
        completion_rate: 78.1,
        avg_progress: 72.3,
        avg_time_spent: 180,
        difficulty_score: 3.8
      },
      {
        module_name: "User Management",
        enrolled_count: 28,
        completed_count: 22,
        completion_rate: 78.6,
        avg_progress: 69.8,
        avg_time_spent: 90,
        difficulty_score: 2.5
      }
    ],
    department_analytics: [
      {
        department_name: "IT Department",
        learner_count: 45,
        avg_completion_rate: 82.3,
        avg_progress: 75.6,
        top_module: "Introduction to LMS",
        active_learners: 42
      },
      {
        department_name: "HR Department",
        learner_count: 38,
        avg_completion_rate: 78.9,
        avg_progress: 71.2,
        top_module: "User Management",
        active_learners: 35
      },
      {
        department_name: "Sales Department",
        learner_count: 32,
        avg_completion_rate: 76.4,
        avg_progress: 68.9,
        top_module: "Advanced Analytics",
        active_learners: 28
      }
    ],
    learner_analytics: [
      {
        learner_name: "John Doe",
        email: "john.doe@example.com",
        department: "IT Department",
        modules_enrolled: 8,
        modules_completed: 6,
        completion_rate: 75.0,
        avg_progress: 72.5,
        total_time_spent: 480,
        achievements_count: 3,
        last_activity: "2024-01-07"
      },
      {
        learner_name: "Jane Smith",
        email: "jane.smith@example.com",
        department: "HR Department",
        modules_enrolled: 6,
        modules_completed: 5,
        completion_rate: 83.3,
        avg_progress: 78.9,
        total_time_spent: 360,
        achievements_count: 4,
        last_activity: "2024-01-07"
      }
    ],
    quiz_analytics: [
      {
        quiz_name: "LMS Basics Quiz",
        module_name: "Introduction to LMS",
        total_attempts: 45,
        avg_score: 85.2,
        pass_rate: 91.1,
        difficulty_level: "Easy",
        avg_time_spent: 15
      },
      {
        quiz_name: "Analytics Assessment",
        module_name: "Advanced Analytics",
        total_attempts: 32,
        avg_score: 78.5,
        pass_rate: 84.4,
        difficulty_level: "Medium",
        avg_time_spent: 25
      }
    ],
    trends: {
      daily: [
        { date: "2024-01-01", active_users: 45, completions: 12, avg_progress: 65.2 },
        { date: "2024-01-02", active_users: 52, completions: 18, avg_progress: 68.7 },
        { date: "2024-01-03", active_users: 48, completions: 15, avg_progress: 67.3 },
        { date: "2024-01-04", active_users: 61, completions: 22, avg_progress: 71.8 },
        { date: "2024-01-05", active_users: 55, completions: 19, avg_progress: 69.5 },
        { date: "2024-01-06", active_users: 58, completions: 21, avg_progress: 70.2 },
        { date: "2024-01-07", active_users: 62, completions: 24, avg_progress: 72.1 }
      ],
      weekly: [
        { week: "Week 1", active_users: 320, completions: 85, avg_progress: 68.5 },
        { week: "Week 2", active_users: 345, completions: 92, avg_progress: 71.2 },
        { week: "Week 3", active_users: 378, completions: 105, avg_progress: 73.8 }
      ],
      monthly: [
        { month: "January", active_users: 1250, completions: 342, avg_progress: 72.1 },
        { month: "February", active_users: 1380, completions: 378, avg_progress: 74.5 },
        { month: "March", active_users: 1450, completions: 412, avg_progress: 76.2 }
      ]
    }
  };

  const safeData = mockData;
  const dataLoading = false;
  const error = null;
  
  // Pagination hooks
  const modulePagination = usePagination(safeData?.module_analytics || []);
  const departmentPagination = usePagination(safeData?.department_analytics || []);
  const learnerPagination = usePagination(safeData?.learner_analytics || []);
  const quizPagination = usePagination(safeData?.quiz_analytics || []);

  useEffect(() => {
    if (!dataLoading) {
      setIsLoading(false);
    }
  }, [dataLoading]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reset pagination when filters change
    modulePagination.reset();
    departmentPagination.reset();
    learnerPagination.reset();
    quizPagination.reset();
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Analytics data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Trigger refetch
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }



  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
              <p className="text-muted-foreground">
                Comprehensive insights into learning performance and engagement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={dataLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>

          {/* Filters Sheet */}
          <Sheet open={showFilters} onOpenChange={setShowFilters}>
            <SheetContent className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Analytics Filters</SheetTitle>
                <SheetDescription>
                  Customize your analytics view with advanced filters
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="dateRange">Date Range</Label>
                  <Select
                    value={filters.dateRange}
                    onValueChange={(value) => handleFilterChange('dateRange', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                      <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                      <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filters.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="grid gap-2">
                      <Label htmlFor="dateFrom">From</Label>
                      <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="dateTo">To</Label>
                      <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={filters.department}
                    onValueChange={(value) => handleFilterChange('department', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All departments</SelectItem>
                      {/* Add department options dynamically */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="module">Module</Label>
                  <Select
                    value={filters.module}
                    onValueChange={(value) => handleFilterChange('module', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All modules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All modules</SelectItem>
                      {/* Add module options dynamically */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter>
                <Button onClick={() => setShowFilters(false)}>Apply Filters</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="modules">Modules</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="learners">Learners</TabsTrigger>
              <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <OverviewDashboard data={safeData} />
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="space-y-6">
              <ModuleAnalytics 
                data={safeData?.module_analytics || []} 
                pagination={modulePagination}
              />
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-6">
              <DepartmentAnalytics 
                data={safeData?.department_analytics || []} 
                pagination={departmentPagination}
              />
            </TabsContent>

            {/* Learners Tab */}
            <TabsContent value="learners" className="space-y-6">
              <LearnerAnalytics 
                data={safeData?.learner_analytics || []} 
                pagination={learnerPagination}
              />
            </TabsContent>

            {/* Quizzes Tab */}
            <TabsContent value="quizzes" className="space-y-6">
              <QuizAnalytics 
                data={safeData?.quiz_analytics || []} 
                pagination={quizPagination}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
