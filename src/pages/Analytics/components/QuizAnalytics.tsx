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
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  ComposedChart,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  HelpCircle,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  Search,
  Download,
  BarChart3,
  PieChart as IconPieChart,
  LineChart as IconLineChart,
  Target,
  Award,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Zap,
  AlertTriangle
} from "lucide-react";

interface QuizAnalyticsProps {
  data: any[];
  pagination: any;
}

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

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPerformanceColor = (rate: number) => {
  if (rate >= 80) return 'bg-green-100 text-green-800';
  if (rate >= 60) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

const getPerformanceLabel = (rate: number) => {
  if (rate >= 80) return 'Excellent';
  if (rate >= 60) return 'Good';
  return 'Needs Improvement';
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function QuizAnalytics({ data, pagination }: QuizAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("avg_score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "charts">("table");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  // Filter and sort data
  const filteredData = data.filter((quiz) => {
    const matchesSearch = quiz.quiz_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         quiz.module_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = !selectedModule || quiz.module_name === selectedModule;
    const matchesDifficulty = !selectedDifficulty || quiz.difficulty_level === selectedDifficulty;
    return matchesSearch && matchesModule && matchesDifficulty;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    const aValue = a[sortBy] || 0;
    const bValue = b[sortBy] || 0;
    return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
  });

  const currentData = sortedData.slice(
    (pagination.currentPage - 1) * pagination.maxPage,
    pagination.currentPage * pagination.maxPage
  );

  // Chart data
  const chartData = data.slice(0, 10).map((quiz) => ({
    name: quiz.quiz_name,
    score: quiz.avg_score,
    pass_rate: quiz.pass_rate,
    attempts: quiz.total_attempts,
    time: quiz.avg_time_spent
  }));

  const difficultyData = [
    { name: 'Easy', value: data.filter(q => q.difficulty_level === 'Easy').length, color: '#22c55e' },
    { name: 'Medium', value: data.filter(q => q.difficulty_level === 'Medium').length, color: '#f59e0b' },
    { name: 'Hard', value: data.filter(q => q.difficulty_level === 'Hard').length, color: '#ef4444' }
  ];

  const performanceData = [
    { name: 'Excellent (80%+)', value: data.filter(q => q.avg_score >= 80).length, color: '#22c55e' },
    { name: 'Good (60-79%)', value: data.filter(q => q.avg_score >= 60 && q.avg_score < 80).length, color: '#f59e0b' },
    { name: 'Needs Improvement (<60%)', value: data.filter(q => q.avg_score < 60).length, color: '#ef4444' }
  ];

  const moduleData = data.reduce((acc, quiz) => {
    const module = quiz.module_name || 'Unknown';
    if (!acc[module]) acc[module] = { attempts: 0, avg_score: 0, count: 0 };
    acc[module].attempts += quiz.total_attempts || 0;
    acc[module].avg_score += quiz.avg_score || 0;
    acc[module].count += 1;
    return acc;
  }, {} as Record<string, { attempts: number; avg_score: number; count: number }>);

  const moduleChartData = Object.entries(moduleData).map(([module, stats]) => ({
    name: module,
    attempts: stats.attempts,
    avg_score: Math.round(stats.avg_score / stats.count)
  }));

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortBy === column && (
          <span className="text-xs">
            {sortOrder === "asc" ? "↑" : "↓"}
          </span>
        )}
      </div>
    </TableHead>
  );

  const modules = Array.from(new Set(data.map(q => q.module_name).filter(Boolean)));
  const difficulties = Array.from(new Set(data.map(q => q.difficulty_level).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Quiz Analytics</h2>
          <p className="text-muted-foreground">
            Assessment performance and difficulty analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All modules</SelectItem>
              {modules.map(module => (
                <SelectItem key={module} value={module}>{module}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All levels</SelectItem>
              {difficulties.map(diff => (
                <SelectItem key={diff} value={diff}>{diff}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={viewMode} onValueChange={(value: "table" | "charts") => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="table">Table</SelectItem>
              <SelectItem value="charts">Charts</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Quizzes</p>
                  <p className="text-2xl font-bold">{data.length}</p>
                </div>
                <HelpCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Score</p>
                  <p className="text-2xl font-bold">
                    {data.length > 0 
                      ? Math.round(data.reduce((sum, q) => sum + (q.avg_score || 0), 0) / data.length)
                      : 0}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Attempts</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data.reduce((sum, q) => sum + (q.total_attempts || 0), 0))}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Pass Rate</p>
                  <p className="text-2xl font-bold">
                    {data.length > 0 
                      ? Math.round(data.reduce((sum, q) => sum + (q.pass_rate || 0), 0) / data.length)
                      : 0}%
                  </p>
                </div>
                <Award className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {viewMode === "charts" ? (
        /* Charts View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quiz Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Quiz Performance
                </CardTitle>
                <CardDescription>
                  Average scores and pass rates by quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="score" name="Avg Score %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="pass_rate" name="Pass Rate %" stroke="#22c55e" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Difficulty Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPieChart className="h-5 w-5 text-primary" />
                  Difficulty Distribution
                </CardTitle>
                <CardDescription>
                  Quiz difficulty levels breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={difficultyData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {difficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Module Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Module Performance
                </CardTitle>
                <CardDescription>
                  Quiz performance by module
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={moduleChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="avg_score" name="Avg Score %" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Radar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLineChart className="h-5 w-5 text-primary" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Multi-dimensional performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={chartData.slice(0, 5)}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Avg Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                    />
                    <Radar
                      name="Pass Rate"
                      dataKey="pass_rate"
                      stroke="#22c55e"
                      fill="#22c55e"
                      fillOpacity={0.6}
                    />
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        /* Table View */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Quiz Performance Details</CardTitle>
              <CardDescription>
                Comprehensive quiz analytics with sorting and filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader column="quiz_name">Quiz Name</SortableHeader>
                      <SortableHeader column="module_name">Module</SortableHeader>
                      <SortableHeader column="total_attempts">Attempts</SortableHeader>
                      <SortableHeader column="avg_score">Avg Score</SortableHeader>
                      <SortableHeader column="pass_rate">Pass Rate</SortableHeader>
                      <SortableHeader column="avg_time_spent">Avg Time</SortableHeader>
                      <SortableHeader column="difficulty_level">Difficulty</SortableHeader>
                      <SortableHeader column="performance">Performance</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((quiz, index) => (
                      <motion.tr
                        key={quiz.quiz_name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                            {quiz.quiz_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            <span className="text-sm">{quiz.module_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm">
                              {formatNumber(quiz.total_attempts || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${quiz.avg_score || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {quiz.avg_score || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${quiz.pass_rate || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {quiz.pass_rate || 0}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">
                              {formatTime(quiz.avg_time_spent || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getDifficultyColor(quiz.difficulty_level || 'Unknown')}>
                            {quiz.difficulty_level || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPerformanceColor(quiz.avg_score || 0)}>
                            {getPerformanceLabel(quiz.avg_score || 0)}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.maxPage > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * 10) + 1} to{" "}
                    {Math.min(pagination.currentPage * 10, filteredData.length)} of{" "}
                    {filteredData.length} quizzes
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pagination.prev}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {pagination.currentPage} of {pagination.maxPage}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={pagination.next}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
