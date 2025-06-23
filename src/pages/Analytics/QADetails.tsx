import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BookOpen, 
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
  Timer,
  MessageSquare
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

export default function QADetails() {
  const { data: apiData, isLoading, error } = useFrappeGetCall<{ message: any }>(
    "getLMSAnalytics",
    {}
  );
  
  const message = apiData?.message || {};
  const qas = message.qa_progress || [];
  const learners = message.learners || [];
  
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");

  // Calculate QA statistics
  const qaStats = useMemo(() => {
    const totalQAs = new Set(qas.map((qa: any) => qa.question_answer)).size;
    const totalAttempts = qas.length;
    const completedAttempts = qas.filter((qa: any) => qa.score !== undefined && qa.score !== null).length;
    const completionRate = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;
    
    const avgScore = qas.length > 0
      ? Math.round(qas.reduce((sum: number, qa: any) => sum + (qa.score || 0), 0) / qas.length)
      : 0;

    const highPerformers = qas.filter((qa: any) => qa.score >= 90).length;
    const lowPerformers = qas.filter((qa: any) => qa.score < 50).length;

    const pendingScores = qas.filter((qa: any) => qa.score === undefined || qa.score === null).length;

    return {
      totalQAs,
      totalAttempts,
      completedAttempts,
      completionRate,
      avgScore,
      highPerformers,
      lowPerformers,
      pendingScores
    };
  }, [qas]);

  // Enhanced QA data with performance metrics
  const enhancedQAs = useMemo(() => {
    const qaMap = new Map();
    
    qas.forEach((qa: any) => {
      if (!qaMap.has(qa.question_answer)) {
        qaMap.set(qa.question_answer, {
          name: qa.question_answer,
          attempts: [],
          totalAttempts: 0,
          completedAttempts: 0,
          avgScore: 0,
          lastAttempt: null
        });
      }
      
      const qaData = qaMap.get(qa.question_answer);
      qaData.attempts.push(qa);
      qaData.totalAttempts++;
      
      if (qa.score !== undefined && qa.score !== null) {
        qaData.completedAttempts++;
      }
      
      if (qa.attended_on) {
        const attemptDate = new Date(qa.attended_on);
        if (!qaData.lastAttempt || attemptDate > qaData.lastAttempt) {
          qaData.lastAttempt = attemptDate;
        }
      }
    });
    
    // Calculate averages
    qaMap.forEach((qaData) => {
      const scores = qaData.attempts
        .filter((qa: any) => qa.score !== undefined && qa.score !== null)
        .map((qa: any) => qa.score);
      
      qaData.avgScore = scores.length > 0 
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;
      
      qaData.completionRate = qaData.totalAttempts > 0 
        ? Math.round((qaData.completedAttempts / qaData.totalAttempts) * 100)
        : 0;
    });
    
    return Array.from(qaMap.values());
  }, [qas]);

  // Filter QAs based on search and filters
  const filteredQAs = useMemo(() => {
    return enhancedQAs.filter((qa: any) => {
      const matchesSearch = 
        qa.name?.toLowerCase().includes(search.toLowerCase());
      
      const matchesScore = scoreFilter === "all" || 
        (scoreFilter === "high" && qa.avgScore >= 80) ||
        (scoreFilter === "medium" && qa.avgScore >= 50 && qa.avgScore < 80) ||
        (scoreFilter === "low" && qa.avgScore < 50);
      
      return matchesSearch && matchesScore;
    });
  }, [enhancedQAs, search, scoreFilter]);

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
      count: qas.filter((qa: any) => qa.score >= min && qa.score <= max).length
    }));
  }, [qas]);

  const qaActivityData = useMemo(() => {
    const data: Array<{ date: string; qaAttempts: number }> = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const attemptsCount = qas.filter((qa: any) => 
        qa.attended_on && qa.attended_on.startsWith(dateStr)
      ).length;
      data.push({ date: dateStr, qaAttempts: attemptsCount });
    }
    return data;
  }, [qas]);

  const topPerformersData = useMemo(() => {
    const learnerScores = new Map();
    qas.forEach((qa: any) => {
      if (qa.score !== undefined && qa.score !== null) {
        const current = learnerScores.get(qa.user) || { total: 0, count: 0 };
        learnerScores.set(qa.user, {
          total: current.total + qa.score,
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
  }, [qas]);

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-muted/30 dark:bg-background min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Q&A Analytics</h1>
          <p className="text-muted-foreground">Detailed Q&A performance and engagement metrics</p>
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
            <CardTitle className="text-sm font-medium">Total Q&As</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats.totalQAs}</div>
            <p className="text-xs text-muted-foreground">All Q&A sessions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">All attempts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats.avgScore}%</div>
            <p className="text-xs text-muted-foreground">Overall performance</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Scores</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qaStats.pendingScores}</div>
            <p className="text-xs text-muted-foreground">Awaiting evaluation</p>
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

        {/* QA Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Q&A Attempts (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qaActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="qaAttempts" stroke="#3b82f6" strokeWidth={2} />
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
                placeholder="Search by Q&A name..."
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

      {/* QAs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Q&A Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Q&A Name</TableHead>
                <TableHead>Total Attempts</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Avg Score</TableHead>
                <TableHead>Last Attempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQAs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No Q&As found.
                  </TableCell>
                </TableRow>
              )}
              {filteredQAs.map((qa: any) => (
                <TableRow key={qa.name}>
                  <TableCell className="font-medium">{qa.name}</TableCell>
                  <TableCell>{qa.totalAttempts}</TableCell>
                  <TableCell>{qa.completedAttempts}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{qa.completionRate}%</span>
                      <Progress value={qa.completionRate} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{qa.avgScore}%</span>
                      <Progress value={qa.avgScore} className="w-16 h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    {qa.lastAttempt 
                      ? new Date(qa.lastAttempt).toLocaleDateString()
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