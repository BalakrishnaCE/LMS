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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  ScatterChart,
  Scatter
} from "recharts";
import {
  User,
  Users,
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
  Calendar,
  Mail,
  Building2,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye
} from "lucide-react";

interface LearnerAnalyticsProps {
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

const getActivityStatus = (lastActivity: string) => {
  const lastActivityDate = new Date(lastActivity);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff <= 1) return { label: 'Active', color: 'bg-green-100 text-green-800' };
  if (daysDiff <= 7) return { label: 'Recent', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'Inactive', color: 'bg-red-100 text-red-800' };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function LearnerAnalytics({ data, pagination }: LearnerAnalyticsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("completion_rate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "charts">("table");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  // Filter and sort data
  const filteredData = data.filter((learner) => {
    const matchesSearch = learner.learner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         learner.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || learner.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
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
  const chartData = data.slice(0, 10).map((learner) => ({
    name: learner.learner_name,
    completion: learner.completion_rate,
    progress: learner.avg_progress,
    modules: learner.modules_enrolled,
    time: learner.total_time_spent
  }));

  const performanceData = [
    { name: 'Excellent (80%+)', value: data.filter(l => l.completion_rate >= 80).length, color: '#22c55e' },
    { name: 'Good (60-79%)', value: data.filter(l => l.completion_rate >= 60 && l.completion_rate < 80).length, color: '#f59e0b' },
    { name: 'Needs Improvement (<60%)', value: data.filter(l => l.completion_rate < 60).length, color: '#ef4444' }
  ];

  const departmentData = data.reduce((acc, learner) => {
    const dept = learner.department || 'Unknown';
    if (!acc[dept]) acc[dept] = 0;
    acc[dept]++;
    return acc;
  }, {} as Record<string, number>);

  const departmentChartData = Object.entries(departmentData).map(([dept, count]) => ({
    name: dept,
    learners: count
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

  const departments = Array.from(new Set(data.map(l => l.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Learner Analytics</h2>
          <p className="text-muted-foreground">
            Individual learner performance and engagement analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search learners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All departments</SelectItem>
              {departments.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
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
                  <p className="text-sm font-medium text-muted-foreground">Total Learners</p>
                  <p className="text-2xl font-bold">{data.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                  <p className="text-2xl font-bold">
                    {data.length > 0 
                      ? Math.round(data.reduce((sum, l) => sum + (l.completion_rate || 0), 0) / data.length)
                      : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Achievements</p>
                  <p className="text-2xl font-bold">
                    {formatNumber(data.reduce((sum, l) => sum + (l.achievements_count || 0), 0))}
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
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
                  <p className="text-sm font-medium text-muted-foreground">Avg Time Spent</p>
                  <p className="text-2xl font-bold">
                    {data.length > 0 
                      ? formatTime(Math.round(data.reduce((sum, l) => sum + (l.total_time_spent || 0), 0) / data.length))
                      : "0m"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {viewMode === "charts" ? (
        /* Charts View */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Learner Performance Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Top Learner Performance
                </CardTitle>
                <CardDescription>
                  Completion rates and progress by learner
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
                    <Bar dataKey="completion" name="Completion %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="progress" name="Progress %" stroke="#22c55e" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconPieChart className="h-5 w-5 text-primary" />
                  Performance Distribution
                </CardTitle>
                <CardDescription>
                  Learner performance levels breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {performanceData.map((entry, index) => (
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

          {/* Department Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Department Distribution
                </CardTitle>
                <CardDescription>
                  Number of learners per department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="learners" name="Learners" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Progress vs Time Scatter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconLineChart className="h-5 w-5 text-primary" />
                  Progress vs Time Spent
                </CardTitle>
                <CardDescription>
                  Relationship between progress and time investment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="time" name="Time Spent" fontSize={12} />
                    <YAxis dataKey="progress" name="Progress %" fontSize={12} />
                    <Tooltip />
                    <Scatter dataKey="progress" fill="#3b82f6" />
                  </ScatterChart>
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
              <CardTitle>Learner Performance Details</CardTitle>
              <CardDescription>
                Comprehensive learner analytics with sorting and filtering
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableHeader column="learner_name">Learner</SortableHeader>
                      <SortableHeader column="department">Department</SortableHeader>
                      <SortableHeader column="modules_enrolled">Modules</SortableHeader>
                      <SortableHeader column="completion_rate">Completion Rate</SortableHeader>
                      <SortableHeader column="avg_progress">Avg Progress</SortableHeader>
                      <SortableHeader column="total_time_spent">Time Spent</SortableHeader>
                      <SortableHeader column="achievements_count">Achievements</SortableHeader>
                      <SortableHeader column="last_activity">Activity</SortableHeader>
                      <SortableHeader column="performance">Performance</SortableHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentData.map((learner, index) => {
                      const activityStatus = getActivityStatus(learner.last_activity);
                      return (
                        <motion.tr
                          key={learner.email}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={undefined} alt={learner.learner_name} />
                                <AvatarFallback>
                                  {learner.learner_name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{learner.learner_name}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {learner.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">{learner.department || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-purple-500" />
                              <span className="text-sm">
                                {learner.modules_enrolled || 0} enrolled
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${learner.completion_rate || 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {learner.completion_rate || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-orange-500" />
                              <span className="text-sm font-medium">
                                {learner.avg_progress || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-indigo-500" />
                              <span className="text-sm">
                                {formatTime(learner.total_time_spent || 0)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm">
                                {learner.achievements_count || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={activityStatus.color}>
                              {activityStatus.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPerformanceColor(learner.completion_rate || 0)}>
                              {getPerformanceLabel(learner.completion_rate || 0)}
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination.maxPage > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * 10) + 1} to{" "}
                    {Math.min(pagination.currentPage * 10, filteredData.length)} of{" "}
                    {filteredData.length} learners
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
