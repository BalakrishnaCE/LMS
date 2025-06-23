import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Clock, 
  Target,
  Activity,
  Calendar,
  Filter,
  Download
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useFrappeGetCall } from "frappe-react-sdk";

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function LearnersDetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  
  const message = apiData?.message || {};
  const learners = message.learners || [];
  const progress = message.progress || [];
  const quizProgress = message.quiz_progress || [];
  const qas = message.qa_progress || [];
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  // Calculate learner statistics
  const learnerStats = useMemo(() => {
    const totalLearners = learners.length;
    const activeLearners = new Set(
      progress
        .filter((p: any) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return p.modified && new Date(p.modified) > thirtyDaysAgo;
        })
        .map((p: any) => p.learner)
    ).size;
    
    const avgCompletionRate = progress.length > 0 
      ? Math.round((progress.filter((p: any) => p.status === 'Completed').length / progress.length) * 100)
      : 0;
    
    const avgQuizScore = quizProgress.length > 0
      ? Math.round(quizProgress.reduce((sum: number, q: any) => sum + (q.score || 0), 0) / quizProgress.length)
      : 0;
    
    const avgQAScore = qas.length > 0
      ? Math.round(qas.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / qas.length)
      : 0;

    return {
      totalLearners,
      activeLearners,
      avgCompletionRate,
      avgQuizScore,
      avgQAScore
    };
  }, [learners, progress, quizProgress, qas]);

  // Enhanced learner data with progress metrics
  const enhancedLearners = useMemo(() => {
    return learners.map((learner: any) => {
      const learnerProgress = progress.filter((p: any) => p.learner === learner.name);
      const learnerQuizzes = quizProgress.filter((q: any) => q.user === learner.name);
      const learnerQAs = qas.filter((qa: any) => qa.user === learner.name);
      
      const completedModules = learnerProgress.filter((p: any) => p.status === 'Completed').length;
      const totalModules = learnerProgress.length;
      const completionRate = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      
      const avgQuizScore = learnerQuizzes.length > 0
        ? Math.round(learnerQuizzes.reduce((sum: number, q: any) => sum + (q.score || 0), 0) / learnerQuizzes.length)
        : 0;
      
      const avgQAScore = learnerQAs.length > 0
        ? Math.round(learnerQAs.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / learnerQAs.length)
        : 0;
      
      const lastActive = learnerProgress.length > 0
        ? new Date(Math.max(...learnerProgress.map((p: any) => new Date(p.modified || 0).getTime())))
        : null;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isActive = lastActive && lastActive > thirtyDaysAgo;
      
      return {
        ...learner,
        completedModules,
        totalModules,
        completionRate,
        avgQuizScore,
        avgQAScore,
        lastActive,
        isActive,
        status: isActive ? 'Active' : 'Inactive'
      };
    });
  }, [learners, progress, quizProgress, qas]);

  // Filter learners based on search and filters
  const filteredLearners = useMemo(() => {
    return enhancedLearners.filter((learner: any) => {
      const matchesSearch = 
        learner.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        learner.email?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "active" && learner.isActive) ||
        (statusFilter === "inactive" && !learner.isActive);
      
      const matchesDepartment = departmentFilter === "all" || 
        learner.department === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesDepartment;
    });
  }, [enhancedLearners, search, statusFilter, departmentFilter]);

  // Chart data
  const completionRateData = useMemo(() => {
    const ranges = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '21-40%', min: 21, max: 40 },
      { range: '41-60%', min: 41, max: 60 },
      { range: '61-80%', min: 61, max: 80 },
      { range: '81-100%', min: 81, max: 100 },
    ];
    
    return ranges.map(({ range, min, max }) => ({
      range,
      count: enhancedLearners.filter((l: any) => l.completionRate >= min && l.completionRate <= max).length
    }));
  }, [enhancedLearners]);

  const activityTrendData = useMemo(() => {
    const data: Array<{ date: string; activeLearners: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activeCount = new Set(
        progress
          .filter((p: any) => p.modified && p.modified.startsWith(dateStr))
          .map((p: any) => p.learner)
      ).size;
      data.push({ date: dateStr, activeLearners: activeCount });
    }
    return data;
  }, [progress]);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Department options
  const departmentOptions = useMemo(() => {
    const departments = new Set(learners.map((l: any) => l.department).filter(Boolean));
    return Array.from(departments).sort() as string[];
  }, [learners]);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Learner Analytics</h1>
          <p className="text-muted-foreground">Detailed learner performance and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnerStats.totalLearners}</div>
            <p className="text-xs text-muted-foreground">All registered learners</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnerStats.activeLearners}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnerStats.avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">Module completion rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Quiz Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnerStats.avgQuizScore}%</div>
            <p className="text-xs text-muted-foreground">Quiz performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg QA Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{learnerStats.avgQAScore}%</div>
            <p className="text-xs text-muted-foreground">Q&A performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Rate Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={completionRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Learners (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="activeLearners" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map((dept: string) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Learners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Learner Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Avg Quiz Score</TableHead>
                <TableHead>Avg QA Score</TableHead>
                <TableHead>Last Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLearners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No learners found.
                  </TableCell>
                </TableRow>
              )}
              {filteredLearners.map((learner: any) => (
                <TableRow key={learner.name}>
                  <TableCell className="font-medium">{learner.full_name}</TableCell>
                  <TableCell>{learner.email}</TableCell>
                  <TableCell>{learner.department || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={learner.isActive ? "default" : "secondary"}>
                      {learner.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{learner.completionRate}%</span>
                      <Progress value={learner.completionRate} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{learner.avgQuizScore}%</span>
                      <Progress value={learner.avgQuizScore} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{learner.avgQAScore}%</span>
                      <Progress value={learner.avgQAScore} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {learner.lastActive 
                      ? new Date(learner.lastActive).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 