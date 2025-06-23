import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  Activity,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  FileText,
  Eye,
  Users,
  Timer
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

export default function QuizzesDetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  
  const message = apiData?.message || {};
  const quizzes = message.quizzes || [];
  const quizProgress = message.quiz_progress || [];
  const learners = message.learners || [];
  
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  // Calculate quiz statistics
  const quizStats = useMemo(() => {
    const totalQuizzes = quizzes.length;
    const totalAttempts = quizProgress.length;
    const completedAttempts = quizProgress.filter((q: any) => q.ended_on).length;
    const completionRate = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;
    
    const avgScore = quizProgress.length > 0
      ? Math.round(quizProgress.reduce((sum: number, q: any) => sum + (q.score || 0), 0) / quizProgress.length)
      : 0;
    
    const avgTimeSpent = quizProgress.length > 0
      ? Math.round(quizProgress.reduce((sum: number, q: any) => sum + (q.time_spent || 0), 0) / quizProgress.length)
      : 0;

    const highPerformers = quizProgress.filter((q: any) => q.score >= 90).length;
    const lowPerformers = quizProgress.filter((q: any) => q.score < 50).length;

    return {
      totalQuizzes,
      totalAttempts,
      completedAttempts,
      completionRate,
      avgScore,
      avgTimeSpent,
      highPerformers,
      lowPerformers
    };
  }, [quizzes, quizProgress]);

  // Enhanced quiz data with performance metrics
  const enhancedQuizzes = useMemo(() => {
    return quizzes.map((quiz: any) => {
      const quizAttempts = quizProgress.filter((q: any) => q.quiz === quiz.name);
      const completedAttempts = quizAttempts.filter((q: any) => q.ended_on).length;
      const completionRate = quizAttempts.length > 0 ? Math.round((completedAttempts / quizAttempts.length) * 100) : 0;
      
      const avgScore = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum: number, q: any) => sum + (q.score || 0), 0) / quizAttempts.length)
        : 0;
      
      const avgTimeSpent = quizAttempts.length > 0
        ? Math.round(quizAttempts.reduce((sum: number, q: any) => sum + (q.time_spent || 0), 0) / quizAttempts.length)
        : 0;
      
      const lastAttempt = quizAttempts.length > 0
        ? new Date(Math.max(...quizAttempts.map((q: any) => new Date(q.ended_on || 0).getTime())))
        : null;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const isRecentlyActive = lastAttempt && lastAttempt > thirtyDaysAgo;
      
      return {
        ...quiz,
        totalAttempts: quizAttempts.length,
        completedAttempts,
        completionRate,
        avgScore,
        avgTimeSpent,
        lastAttempt,
        isRecentlyActive
      };
    });
  }, [quizzes, quizProgress]);

  // Filter quizzes based on search and filters
  const filteredQuizzes = useMemo(() => {
    return enhancedQuizzes.filter((quiz: any) => {
      const matchesSearch = 
        quiz.title?.toLowerCase().includes(search.toLowerCase()) ||
        quiz.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesScore = scoreFilter === "all" || 
        (scoreFilter === "high" && quiz.avgScore >= 80) ||
        (scoreFilter === "medium" && quiz.avgScore >= 50 && quiz.avgScore < 80) ||
        (scoreFilter === "low" && quiz.avgScore < 50);
      
      return matchesSearch && matchesScore;
    });
  }, [enhancedQuizzes, search, scoreFilter]);

  // Chart data
  const scoreDistributionData = useMemo(() => {
    const ranges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89 },
      { range: '70-79%', min: 70, max: 79 },
      { range: '60-69%', min: 60, max: 69 },
      { range: '50-59%', min: 50, max: 59 },
      { range: '<50%', min: 0, max: 49 },
    ];
    
    return ranges.map(({ range, min, max }) => ({
      range,
      count: quizProgress.filter((q: any) => q.score >= min && q.score <= max).length
    }));
  }, [quizProgress]);

  const quizActivityData = useMemo(() => {
    const data: Array<{ date: string; quizAttempts: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const attemptsCount = quizProgress.filter((q: any) => 
        q.ended_on && q.ended_on.startsWith(dateStr)
      ).length;
      data.push({ date: dateStr, quizAttempts: attemptsCount });
    }
    return data;
  }, [quizProgress]);

  const topPerformersData = useMemo(() => {
    const learnerScores = new Map();
    quizProgress.forEach((q: any) => {
      if (q.score !== undefined) {
        const current = learnerScores.get(q.user) || { total: 0, count: 0 };
        learnerScores.set(q.user, {
          total: current.total + q.score,
          count: current.count + 1
        });
      }
    });
    
    return Array.from(learnerScores.entries())
      .map(([user, data]: [string, any]) => ({
        user,
        avgScore: Math.round(data.total / data.count)
      }))
      .sort((a, b) => b.avgScore - a.avgScore)
      .slice(0, 10);
  }, [quizProgress]);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quiz Analytics</h1>
          <p className="text-muted-foreground">Detailed quiz performance and engagement metrics</p>
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
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizStats.totalQuizzes}</div>
            <p className="text-xs text-muted-foreground">All quizzes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizStats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">All attempts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizStats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizStats.avgTimeSpent} min</div>
            <p className="text-xs text-muted-foreground">Per attempt</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quiz Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Quiz Attempts (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quizActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="quizAttempts" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Top Performing Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {topPerformersData.map((performer, index) => (
              <div key={performer.user} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-primary">{index + 1}</div>
                <div className="text-sm font-medium">{performer.user}</div>
                <div className="text-lg font-bold">{performer.avgScore}%</div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
                placeholder="Search by quiz title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (≥80%)</SelectItem>
                <SelectItem value="medium">Medium (50-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;50%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quizzes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Total Attempts</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>Last Attempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuizzes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No quizzes found.
                  </TableCell>
                </TableRow>
              )}
              {filteredQuizzes.map((quiz: any) => (
                <TableRow key={quiz.name}>
                  <TableCell className="font-medium">{quiz.title}</TableCell>
                  <TableCell>{quiz.totalAttempts}</TableCell>
                  <TableCell>{quiz.completedAttempts}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{quiz.completionRate}%</span>
                      <Progress value={quiz.completionRate} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{quiz.avgScore}%</span>
                      <Progress value={quiz.avgScore} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>{quiz.avgTimeSpent} min</TableCell>
                  <TableCell>
                    {quiz.lastAttempt 
                      ? new Date(quiz.lastAttempt).toLocaleDateString()
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