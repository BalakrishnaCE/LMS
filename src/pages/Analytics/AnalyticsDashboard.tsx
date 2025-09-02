import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  BookOpen,
  CheckCircle,
  TrendingUp,
  Target,
  Activity,
  Award,
  Clock,
  Star,
  Zap,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";


// Import the new analytics hook
import { useLMSAnalytics } from "@/lib/api";

interface AnalyticsData {
  overview: {
    total_learners: number;
    total_modules: number;
    total_quizzes: number;
    total_qa: number;
    total_assessments: number;
    active_learners: number;
    completion_rate: number;
    avg_progress: number;
    total_achievements: number;
    avg_quiz_score: number;
    quiz_attempts: number;
    qa_attempts: number;
    total_attempts: number;
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
    type: string;
  }>;
  trends: {
    daily: Array<{
      date: string;
      active_users: number;
      completions: number;
      avg_progress: number;
    }>;
    weekly: Array<{
      week: string;
      active_users: number;
      completions: number;
      avg_progress: number;
    }>;
    monthly: Array<{
      month: string;
      active_users: number;
      completions: number;
      avg_progress: number;
    }>;
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
  const currentData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

export default function AnalyticsDashboard() {
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

  // API call with filters
  const { data: analyticsData, isLoading: dataLoading, error } = useLMSAnalytics(filters);

  // Safely extract data with fallbacks
  const safeData = (analyticsData?.message || analyticsData || {}) as AnalyticsData;
  
  // Pagination hooks
  const modulePagination = usePagination(safeData?.module_analytics || []);
  const departmentPagination = usePagination(safeData?.department_analytics || []);
  const learnerPagination = usePagination(safeData?.learner_analytics || []);
  const quizPagination = usePagination(safeData?.quiz_analytics || []);

  React.useEffect(() => {
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
        <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    // Handle error object properly - ensure we only render strings
    let errorMessage = 'An unknown error occurred';
    
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Handle nested error objects
      if ('message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
      } else if ('error' in error && typeof error.error === 'string') {
        errorMessage = error.error;
      } else if ('details' in error && typeof error.details === 'string') {
        errorMessage = error.details;
      } else {
        // If it's a complex object, stringify it safely
        try {
          errorMessage = JSON.stringify(error);
        } catch {
          errorMessage = 'An error occurred while loading analytics data';
        }
      }
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
        <p className="text-muted-foreground mb-4">{errorMessage}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(safeData?.overview?.total_learners || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Active in the system
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(safeData?.overview?.active_learners || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(safeData?.overview?.total_modules || 0)}</div>
                <p className="text-xs text-muted-foreground">
                  Available modules
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{(safeData?.overview?.completion_rate || 0).toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Overall completion
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity Trends</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  Chart visualization will be implemented here
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Progress</span>
                    <span className="text-sm font-bold">{(safeData?.overview?.avg_progress || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg Quiz Score</span>
                    <span className="text-sm font-bold">{(safeData?.overview?.avg_quiz_score || 0).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Assessments</span>
                    <span className="text-sm font-bold">{formatNumber(safeData?.overview?.total_assessments || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Quizzes</span>
                    <span className="text-sm font-bold">{formatNumber(safeData?.overview?.total_quizzes || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Q&A</span>
                    <span className="text-sm font-bold">{formatNumber(safeData?.overview?.total_qa || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Achievements</span>
                    <span className="text-sm font-bold">{formatNumber(safeData?.overview?.total_achievements || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{modulePagination.currentData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Available modules
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Module Performance</CardTitle>
              <CardDescription>
                Detailed analysis of module completion and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modulePagination.currentData.map((module, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{module.module_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {module.enrolled_count} enrolled • {module.completed_count} completed
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{module.completion_rate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        Avg Progress: {module.avg_progress.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{departmentPagination.currentData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active departments
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>
                Department-wise learning analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentPagination.currentData.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{dept.department_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {dept.learner_count} learners • {dept.active_learners} active
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{dept.avg_completion_rate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        Avg Progress: {dept.avg_progress.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learners Tab */}
        <TabsContent value="learners" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{learnerPagination.currentData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active learners
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Learner Performance</CardTitle>
              <CardDescription>
                Individual learner analytics and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learnerPagination.currentData.map((learner, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{learner.learner_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {learner.department} • {learner.modules_enrolled} modules enrolled
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{learner.completion_rate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        Avg Progress: {learner.avg_progress.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quizzes Tab */}
        <TabsContent value="quizzes" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{quizPagination.currentData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Quizzes & Q&A
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Assessment Performance</CardTitle>
              <CardDescription>
                Quiz and Q&A analytics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quizPagination.currentData.map((quiz, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{quiz.quiz_name}</h4>
                        <Badge variant={quiz.type === "Quiz" ? "default" : "secondary"} className="text-xs">
                          {quiz.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {quiz.module_name} • {quiz.total_attempts} attempts
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{quiz.avg_score.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">
                        Pass Rate: {quiz.pass_rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
