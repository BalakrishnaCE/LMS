import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Clock, 
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  FileText,
  Eye,
  Users
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

export default function ModulesDetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  
  const message = apiData?.message || {};
  const modules = message.modules || [];
  const progress = message.progress || [];
  const learners = message.learners || [];
  
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [assignmentType, setAssignmentType] = useState("all");

  // Calculate module statistics
  const moduleStats = useMemo(() => {
    const totalModules = modules.length;
    const publishedModules = modules.filter((m: any) => m.published).length;
    const draftModules = totalModules - publishedModules;
    
    const totalAssignments = progress.length;
    const completedAssignments = progress.filter((p: any) => p.status === 'Completed').length;
    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
    
    const avgScore = progress.length > 0
      ? Math.round(progress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / progress.length)
      : 0;
    
    const avgDuration = progress.length > 0
      ? Math.round(progress.reduce((sum: number, p: any) => sum + (p.module_duration || 0), 0) / progress.length)
      : 0;

    return {
      totalModules,
      publishedModules,
      draftModules,
      totalAssignments,
      completedAssignments,
      completionRate,
      avgScore,
      avgDuration
    };
  }, [modules, progress]);

  // Enhanced module data with performance metrics
  const enhancedModules = useMemo(() => {
    return modules.map((module: any) => {
      const moduleProgress = progress.filter((p: any) => p.lms_module === module.name);
      const assignedLearners = new Set(moduleProgress.map((p: any) => p.learner)).size;
      const completedLearners = moduleProgress.filter((p: any) => p.status === 'Completed').length;
      const completionRate = assignedLearners > 0 ? Math.round((completedLearners / assignedLearners) * 100) : 0;
      
      const avgScore = moduleProgress.length > 0
        ? Math.round(moduleProgress.reduce((sum: number, p: any) => sum + (p.score || 0), 0) / moduleProgress.length)
        : 0;
      
      const avgDuration = moduleProgress.length > 0
        ? Math.round(moduleProgress.reduce((sum: number, p: any) => sum + (p.module_duration || 0), 0) / moduleProgress.length)
        : 0;
      
      const lastAccessed = moduleProgress.length > 0
        ? new Date(Math.max(...moduleProgress.map((p: any) => new Date(p.modified || 0).getTime())))
        : null;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isRecentlyActive = lastAccessed && lastAccessed > thirtyDaysAgo;
      
      return {
        ...module,
        assignedLearners,
        completedLearners,
        completionRate,
        avgScore,
        avgDuration,
        lastAccessed,
        isRecentlyActive,
        status: module.published ? 'Published' : 'Draft'
      };
    });
  }, [modules, progress]);

  // Filter modules based on search and filters
  const filteredModules = useMemo(() => {
    return enhancedModules.filter((module: any) => {
      const matchesSearch = 
        module.name?.toLowerCase().includes(search.toLowerCase()) ||
        module.assignment_type?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = status === "all" || 
        (status === "published" && module.published) ||
        (status === "draft" && !module.published);
      
      const matchesAssignmentType = assignmentType === "all" || 
        module.assignment_type === assignmentType;
      
      return matchesSearch && matchesStatus && matchesAssignmentType;
    });
  }, [enhancedModules, search, status, assignmentType]);

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
      count: enhancedModules.filter((m: any) => m.completionRate >= min && m.completionRate <= max).length
    }));
  }, [enhancedModules]);

  const moduleActivityData = useMemo(() => {
    const data: Array<{ date: string; activeModules: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const activeCount = new Set(
        progress
          .filter((p: any) => p.modified && p.modified.startsWith(dateStr))
          .map((p: any) => p.lms_module)
      ).size;
      data.push({ date: dateStr, activeModules: activeCount });
    }
    return data;
  }, [progress]);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  // Assignment type options
  const assignmentTypeOptions = useMemo(() => {
    const types = new Set(modules.map((m: any) => m.assignment_type).filter(Boolean));
    return Array.from(types).sort() as string[];
  }, [modules]);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Module Analytics</h1>
          <p className="text-muted-foreground">Detailed module performance and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moduleStats.totalModules}</div>
            <p className="text-xs text-muted-foreground">All modules</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moduleStats.publishedModules}</div>
            <p className="text-xs text-muted-foreground">Available to learners</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moduleStats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Overall completion</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{moduleStats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">Average performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Rate Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Module Completion Rate Distribution</CardTitle>
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

        {/* Module Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Active Modules (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={moduleActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="activeModules" stroke="#3b82f6" strokeWidth={2} />
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
                placeholder="Search by module name or type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assignmentTypeOptions.map((type: string) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Module Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Avg Duration</TableHead>
                <TableHead>Last Accessed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredModules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground">
                    No modules found.
                  </TableCell>
                </TableRow>
              )}
              {filteredModules.map((module: any) => (
                <TableRow key={module.name}>
                  <TableCell className="font-medium">{module.name}</TableCell>
                  <TableCell>{module.assignment_type || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={module.published ? "default" : "secondary"}>
                      {module.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{module.assignedLearners}</TableCell>
                  <TableCell>{module.completedLearners}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{module.completionRate}%</span>
                      <Progress value={module.completionRate} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{module.avgScore}%</span>
                      <Progress value={module.avgScore} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{module.avgDuration} min</TableCell>
                  <TableCell>
                    {module.lastAccessed 
                      ? new Date(module.lastAccessed).toLocaleDateString()
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