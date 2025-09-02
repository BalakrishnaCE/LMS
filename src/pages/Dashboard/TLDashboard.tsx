import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Award,
  Eye,
  BarChart3,
  Calendar,
  Target
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import errorAnimation from '@/assets/Error.json';
import { useLMSUserPermissions } from "@/hooks/use-lms-user-permissions";
import { useFrappeAuth } from "frappe-react-sdk";
import { useTLDashboard } from "@/lib/api";

interface TLStats {
  total_learners: number;
  active_learners: number;
  completed_modules: number;
  total_modules: number;
  average_progress: number;
  recent_activities: Array<{
    user: string;
    action: string;
    module: string;
    timestamp: string;
  }>;
  top_performers: Array<{
    user: string;
    full_name: string;
    progress: number;
    completed_modules: number;
  }>;
  department_stats: Array<{
    department: string;
    learner_count: number;
    average_progress: number;
  }>;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

const iconVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "backOut"
    }
  }
}

// Card configuration for TL Dashboard - using consistent design system colors
const tlCardConfig = [
  {
    key: "learners",
    title: "Total Learners",
    icon: Users,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  },
  {
    key: "completion",
    title: "Module Completion",
    icon: BookOpen,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  },
  {
    key: "progress",
    title: "Average Progress",
    icon: TrendingUp,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  },
  {
    key: "activity",
    title: "Recent Activity",
    icon: Clock,
    iconColor: "text-primary",
    bgColor: "bg-primary/5",
    darkBgColor: "dark:bg-primary/10"
  }
];

export default function TLDashboard() {
  const { currentUser } = useFrappeAuth();
  const [stats, setStats] = React.useState<TLStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Debug logging
  React.useEffect(() => {
    console.log("TL Dashboard - Current User:", currentUser);
  }, [currentUser]);

  // Use the new TL Dashboard API service - only call when currentUser is available
  const { data, error: apiError, isLoading: apiLoading } = useTLDashboard(currentUser || "", {
    enabled: !!currentUser // Only enable the API call when currentUser exists
  });

  // Single useEffect to handle data updates and prevent infinite loops
  React.useEffect(() => {
    console.log("TL Dashboard - API State:", {
      apiLoading,
      apiError,
      data,
      currentUser
    });

    if (apiError) {
      console.error("TL Dashboard - API Error:", apiError);
      setError(apiError.message || "Failed to load TL dashboard data");
      setIsLoading(false);
      toast.error("Failed to load dashboard data");
    } else if (data) {
      console.log("TL Dashboard - Data received:", data);
      setStats(data);
      setIsLoading(false);
    } else if (apiLoading) {
      console.log("TL Dashboard - API loading...");
      setIsLoading(true);
    }
  }, [data, apiError, apiLoading, currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-soft">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading TL Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg-soft">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Error loading dashboard</div>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
          variant="outline"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Card data for TL Dashboard
  const tlCardData = [
    {
      value: stats?.total_learners || 0,
      subtitle: `${stats?.active_learners || 0} active learners`,
      percentage: stats?.active_learners && stats?.total_learners ? (stats.active_learners / stats.total_learners) * 100 : 0,
      isPositive: true
    },
    {
      value: stats?.completed_modules || 0,
      subtitle: `of ${stats?.total_modules || 0} total modules`,
      percentage: stats?.completed_modules && stats?.total_modules ? (stats.completed_modules / stats.total_modules) * 100 : 0,
      isPositive: true
    },
    {
      value: `${stats?.average_progress || 0}%`,
      subtitle: "team average",
      percentage: stats?.average_progress || 0,
      isPositive: (stats?.average_progress || 0) > 50
    },
    {
      value: stats?.recent_activities?.length || 0,
      subtitle: "activities today",
      percentage: 0,
      isPositive: true
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Lead Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your team's learning progress and performance
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Users className="w-4 h-4 mr-2" />
          Team Lead
        </Badge>
      </motion.div>

      {/* Enhanced Stats Cards */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {tlCardConfig.map((config, index) => {
          const IconComponent = config.icon;
          const data = tlCardData[index];
          
          return (
            <motion.div
              key={config.key}
              variants={cardVariants}
              whileHover={{ 
                y: -8, 
                scale: 1.02,
                transition: { duration: 0.2, ease: "easeOut" }
              }}
                          className={`
              relative overflow-hidden rounded-2xl p-6
              bg-card text-card-foreground
              shadow-lg hover:shadow-2xl
              border border-border/50
              backdrop-blur-sm
              transition-all duration-300 ease-out
            `}
            >
              {/* Subtle background pattern */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              
              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                                         <motion.div
                       variants={iconVariants}
                       className={`
                         p-2 rounded-xl ${config.bgColor} ${config.darkBgColor}
                         shadow-sm border border-border/20
                       `}
                     >
                      <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        {config.title}
                      </h3>
                    </div>
                  </div>
                  
                  {/* Badge for progress indicator */}
                  {config.key === "progress" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
                    >
                      <Badge 
                        variant="secondary"
                        className={`
                          ${data.isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}
                          border-0 shadow-sm
                        `}
                      >
                        {data.isPositive ? "Good" : "Needs Attention"}
                      </Badge>
                    </motion.div>
                  )}
                </div>
                
                {/* Value */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="mb-2"
                >
                  <div className="text-3xl font-bold text-foreground">
                    {data.value}
                  </div>
                </motion.div>
                
                {/* Subtitle */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <p className="text-sm text-muted-foreground">
                    {data.subtitle}
                  </p>
                </motion.div>

                {/* Progress bar for progress card */}
                {config.key === "progress" && (
                  <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                    className="mt-3"
                  >
                    <Progress 
                      value={data.percentage} 
                      className="h-2"
                    />
                  </motion.div>
                )}
              </div>
              
              {/* Subtle decorative accent */}
              <motion.div
                className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full opacity-5"
                style={{
                  background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)"
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.05, 0.1, 0.05]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Top Performers */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.top_performers?.slice(0, 5).map((performer, index) => (
                <div key={performer.user} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{performer.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {performer.completed_modules} modules completed
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {performer.progress}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recent_activities?.slice(0, 8).map((activity, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs">
                    <Eye className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span> {activity.action} in{" "}
                      <span className="font-medium">{activity.module}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          View Team Progress
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Generate Reports
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Learners
        </Button>
      </div>
    </div>
  );
}
