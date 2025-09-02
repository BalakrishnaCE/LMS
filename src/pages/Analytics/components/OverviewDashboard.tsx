import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  AreaChart,
  Area,
  CartesianGrid
} from "recharts";
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
  ArrowDownRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OverviewDashboardProps {
  data: any;
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

const getTrendColor = (current: number, previous: number) => {
  if (current > previous) return "text-green-600";
  if (current < previous) return "text-red-600";
  return "text-gray-600";
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function OverviewDashboard({ data }: OverviewDashboardProps) {
  // Safely extract data with fallbacks
  const overview = data?.overview || {};
  const trends = data?.trends || {};
  const moduleAnalytics = Array.isArray(data?.module_analytics) ? data.module_analytics : [];
  const departmentAnalytics = Array.isArray(data?.department_analytics) ? data.department_analytics : [];

  // Prepare chart data with defensive programming
  const modulePerformanceData = moduleAnalytics.slice(0, 5).map((module: any) => ({
    name: module?.module_name || 'Unknown Module',
    completion: module?.completion_rate || 0,
    progress: module?.avg_progress || 0,
    enrolled: module?.enrolled_count || 0
  }));

  const departmentPerformanceData = departmentAnalytics.slice(0, 5).map((dept: any) => ({
    name: dept?.department_name || 'Unknown Department',
    completion: dept?.avg_completion_rate || 0,
    progress: dept?.avg_progress || 0,
    learners: dept?.learner_count || 0
  }));

  const trendData = Array.isArray(trends?.daily) ? trends.daily.slice(-7) : [];

  const pieData = [
    { name: 'Completed', value: overview.completion_rate || 0, color: '#22c55e' },
    { name: 'In Progress', value: 100 - (overview.completion_rate || 0), color: '#f59e0b' }
  ];

  const statCards = [
    {
      title: "Total Learners",
      value: formatNumber(overview.total_learners || 0),
      icon: Users,
      trend: "+12%",
      trendValue: 12,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active Learners",
      value: formatNumber(overview.active_learners || 0),
      icon: Activity,
      trend: "+8%",
      trendValue: 8,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Total Modules",
      value: formatNumber(overview.total_modules || 0),
      icon: BookOpen,
      trend: "+5%",
      trendValue: 5,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Completion Rate",
      value: `${overview.completion_rate || 0}%`,
      icon: CheckCircle,
      trend: "+3%",
      trendValue: 3,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    },
    {
      title: "Avg Progress",
      value: `${overview.avg_progress || 0}%`,
      icon: Target,
      trend: "+7%",
      trendValue: 7,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Avg Quiz Score",
      value: `${overview.avg_quiz_score || 0}%`,
      icon: Award,
      trend: "+2%",
      trendValue: 2,
      color: "text-pink-600",
      bgColor: "bg-pink-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      {card.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">{card.value}</p>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(card.trendValue, 0)}
                        <span className={`text-sm font-medium ${getTrendColor(card.trendValue, 0)}`}>
                          {card.trend}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <card.icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Trends */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Activity Trends (Last 7 Days)
              </CardTitle>
              <CardDescription>
                Daily active users and completion trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="active_users" 
                    name="Active Users" 
                    stackId="1"
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completions" 
                    name="Completions" 
                    stackId="2"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Completion Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Completion Distribution
              </CardTitle>
              <CardDescription>
                Overall completion status breakdown
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Percentage']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-4">
                {pieData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name}: {item.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performing Modules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Top Performing Modules
              </CardTitle>
              <CardDescription>
                Modules with highest completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modulePerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Completion Rate']}
                  />
                  <Bar dataKey="completion" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Department Performance
              </CardTitle>
              <CardDescription>
                Average completion rates by department
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} width={100} />
                  <Tooltip 
                    formatter={(value: any) => [`${value}%`, 'Completion Rate']}
                  />
                  <Bar dataKey="completion" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(overview.total_achievements || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Achievements Earned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatTime(overview.avg_time_spent || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Time per Module</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(overview.total_quizzes || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Quizzes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {formatNumber(overview.quiz_attempts || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Quiz Attempts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
