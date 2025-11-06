import * as React from "react"
import { useUser } from "@/hooks/use-user"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Link } from "wouter"
import { BookOpen, Clock, Award, Calendar, Target, Lock, PlayCircle, FastForward, CheckCircle } from "lucide-react"
import { ROUTES, LMS_API_BASE_URL } from "@/config/routes"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import AchievementShowcase from "@/components/AchievementShowcase";
import { useLearnerDashboard, useLearnerModuleData } from "@/lib/api";
import { useFrappeGetDocList } from "frappe-react-sdk";
import { calculateProgressStats, calculateModuleProgress } from "@/utils/progressUtils";


interface Achievement {
  id: string;
  icon_name: string;
  text: string;
  description: string;
  created_on?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

// Locking logic for department-ordered modules
function getLockState(module: any, allModules: any[]) {
  let isLocked = false;
  let lockReason = "";
  if (module.assignment_based === "Department" && module.order && module.order > 0) {
    const deptOrdered = allModules.filter((m: any) => m.assignment_based === "Department" && m.order && m.order > 0);
    const previous = deptOrdered.filter((m: any) => m.order < module.order);
    if (previous.some((m: any) => m.progress?.status !== "Completed")) {
      isLocked = true;
      lockReason = "Complete previous modules to unlock this module.";
    }
  }
  return { isLocked, lockReason };
}

// const StatusBadge = ({ status, isMissed, isLocked, tooltip }: { status: string, isMissed?: boolean, isLocked?: boolean, tooltip?: string }) => {
//   let icon = null, color = "";
//   if (isLocked) {
//     icon = <Lock className="h-4 w-4" />;
//     color = "bg-gray-300 text-gray-700";
//   } else if (isMissed) {
//     icon = <Clock className="h-4 w-4" />;
//     color = "bg-red-100 text-red-600";
//   } else if (status === "In Progress") {
//     icon = <FastForward className="h-4 w-4" />;
//     color = "bg-blue-100 text-blue-600";
//   } else if (status === "Completed") {
//     icon = <CheckCircle className="h-4 w-4" />;
//     color = "bg-green-100 text-green-600";
//   } else {
//     icon = <PlayCircle className="h-4 w-4" />;
//     color = "bg-gray-100 text-gray-700";
//   }
//   return (
//     <div className={`absolute top-3 right-3 rounded-full p-1 shadow ${color} cursor-default`} title={tooltip || status} aria-label={tooltip || status}>
//       {icon}
//     </div>
//   );
// };

export default function LearnerDashboard() {
  const { user, isLoading: userLoading } = useUser();
  // const [activeTab, setActiveTab] = useState("current")

  // Fetch modules and stats from new API
  const { data, error, isLoading } = useLearnerModuleData(user?.email || "", {
    limit: 100, // Large enough for dashboard
    offset: 0,
  }, { enabled: !userLoading && !!user?.email && user?.email.trim() !== "" });

  const { data: DeadlineData, error: deadlineError, isLoading: deadlinesLoading } = useLearnerDashboard(user?.email || "", { enabled: !!user?.email && user?.email.trim() !== "" });
  
  if (error) {
    console.error('API Error details:', error);
  }
  
  if (deadlineError) {
    console.error('Deadline API Error details:', deadlineError);
  }

  // Helper function to safely extract the data array from DeadlineData
  const getDeadlineDataArray = () => {
    if (!DeadlineData) return [];
    const deadlineData = DeadlineData as any;
    if (Array.isArray(deadlineData.message)) return deadlineData.message;
    if (deadlineData.message && Array.isArray(deadlineData.message.message)) return deadlineData.message.message;
    return [];
  };

  // Convert modules array to the format expected by the dashboard
  const getModulesArray = () => {
    const modulesArray = modules.map((module: any) => ({
      module: module,
      progress: module.progress || {
        status: "Not Started",
        overall_progress: 0,
        completion_details: {
          lessons_completed: 0,
          chapters_completed: 0,
          contents_completed: 0,
          total_lesson_chapter_items: 0,
          total_content_items: 0
        }
      }
    }));
    return modulesArray;
  };
  // Fetch achievements using direct API call to avoid conflicts
  const [dashboardAchievements, setDashboardAchievements] = React.useState<any[]>([]);
  const [achievementsLoading, setAchievementsLoading] = React.useState(true);
  
  const fetchAchievements = React.useCallback(async () => {
    if (!user?.name) return;
    
    try {
      setAchievementsLoading(true);
      const response = await fetch(`${LMS_API_BASE_URL}api/resource/User Achievement?filters=[["user","=","${user.name}"]]&fields=["name","achievement","created_on","user","achievement.icon_name","achievement.text","achievement.description"]`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.data) {
        setDashboardAchievements(data.data);
        console.log('🔍 Dashboard - Direct API achievements:', data.data);
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
      setDashboardAchievements([]);
    } finally {
      setAchievementsLoading(false);
    }
  }, [user?.name]);
  
  React.useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);
  
  console.log('🔍 Dashboard - dashboardAchievements:', dashboardAchievements);
  console.log('🔍 Dashboard - achievementsLoading:', achievementsLoading);
  console.log('🔍 Dashboard - dashboardAchievements type:', typeof dashboardAchievements);
  console.log('🔍 Dashboard - dashboardAchievements is array?', Array.isArray(dashboardAchievements));

  // Extract modules and meta - use both APIs but prioritize useLearnerDashboard
  // useLearnerModuleData returns data directly: { modules: [...], meta: {...} }
  // useLearnerDashboard returns data under message: [{ module: {...}, progress: {...} }]
  
  // Prioritize get_learner_dashboard (filters for published modules) over useLearnerModuleData
  let modules: unknown = [];
  let meta = {};
  
  // First try to use get_learner_dashboard (filters for published modules)
  if (DeadlineData?.message && Array.isArray(DeadlineData.message) && DeadlineData.message.length > 0) {
    // Transform the data to match expected format
    modules = DeadlineData.message.map((item: any) => ({
      ...item.module,
      progress: item.progress
    }));
    
    // Calculate meta from modules
    meta = {
      total_modules: modules.length,
      completed_modules: modules.filter((m: any) => m.progress?.status === "Completed").length,
      in_progress_modules: modules.filter((m: any) => m.progress?.status === "In Progress").length,
      not_started_modules: modules.filter((m: any) => m.progress?.status === "Not Started").length,
      overdue_modules: 0,
      average_progress: modules.length > 0 ? 
        Math.round(modules.reduce((sum: number, m: any) => sum + (m.progress?.progress || 0), 0) / modules.length) : 0,
      total_count: modules.length
    };
    
    console.log('Using get_learner_dashboard (published modules only) - modules count:', modules.length);
  } else if (data?.message?.modules) {
    // Fallback to useLearnerModuleData if get_learner_dashboard fails
    modules = data.message.modules || [];
    meta = data.message.meta || {};
    console.log('Fallback to useLearnerModuleData - modules count:', modules.length);
  } else if (data?.modules) {
    // Direct structure fallback
    modules = data.modules || [];
    meta = data.meta || {};
    console.log('Fallback to direct structure - modules count:', modules.length);
  }
  
  // Debug logging
  console.log('Data from useLearnerModuleData:', data);
  console.log('DeadlineData from useLearnerDashboard:', DeadlineData);
  console.log('Final modules count:', modules.length);
  
  // Check if modules have the nested structure (module.module, module.progress)
  if (modules.length > 0 && modules[0].module) {
    modules = modules.map((item: any) => ({
      ...item.module,
      progress: item.progress
    }));
  }
  
  // Check if modules are empty and add fallback
  if (modules.length > 0 && Object.keys(modules[0]).length === 0) {
    // Try to get modules from the fallback API
    if (DeadlineData?.message && Array.isArray(DeadlineData.message)) {
      modules = DeadlineData.message.map((item: any) => ({
        ...item.module,
        progress: item.progress
      }));
    }
  }
  
  // If useLearnerModuleData doesn't have data, use useLearnerDashboard data
  if (modules.length === 0 && DeadlineData?.message && !deadlineError) {
    const deadlineModules = DeadlineData.message;
    
    // Ensure deadlineModules is an array before calling map
    if (Array.isArray(deadlineModules)) {
      // Transform the data to match expected format
      modules = deadlineModules.map((item: any) => ({
        ...item.module,
        progress: item.progress
      }));
    } else {
      console.warn('DeadlineData.message is not an array:', deadlineModules);
      // If it's not an array, try to extract array from nested structure
      const extractedArray = getDeadlineDataArray();
      if (Array.isArray(extractedArray) && extractedArray.length > 0) {
        modules = extractedArray.map((item: any) => ({
          ...item.module,
          progress: item.progress
        }));
      }
    }
    
    // Calculate meta from the transformed data using shared utility
    const stats = calculateProgressStats(modules);
    meta = {
      total_modules: stats.totalModules,
      completed_modules: stats.completedModules,
      in_progress_modules: stats.inProgressModules,
      not_started_modules: stats.notStartedModules,
      average_progress: stats.averageProgress,
      total_count: stats.totalModules
    };
  }

  // Calculate stats (fallback to 0 if not present)
  // Calculate stats directly from modules if meta is not available
  const stats = calculateProgressStats(modules);
  
  const totalModules = meta.total_count || meta.total_modules || stats.totalModules || 0;
  const completedModules = meta.completed_modules || stats.completedModules || 0;
  const inProgressModules = meta.in_progress_modules || stats.inProgressModules || 0;
  const averageProgress = meta.average_progress || stats.averageProgress || 0;

  // Robust sorting: ordered modules (order > 0) by order asc, then unordered (order 0 or undefined) in API order
  const sortedModules = React.useMemo(() => {
    // Separate ordered and unordered
    const ordered = modules.filter((m: any) => m.order && m.order > 0).sort((a: any, b: any) => a.order - b.order);
    const unordered = modules.filter((m: any) => !m.order || m.order === 0);
    // Ordered first, then unordered in original order
    return [...ordered, ...unordered];
  }, [modules]);

  // Refresh achievements when component mounts or modules change
  React.useEffect(() => {
    console.log('🔍 Dashboard - Refreshing achievements due to module change');
    fetchAchievements();
  }, [modules.length, fetchAchievements]);

  // Map API data to AchievementShowcase props
  let achievements: Achievement[] = [];
  console.log('🔍 Dashboard - dashboardAchievements in mapping:', dashboardAchievements);
  console.log('🔍 Dashboard - achievementsLoading in mapping:', achievementsLoading);
  
  if (dashboardAchievements && Array.isArray(dashboardAchievements)) {
    console.log('🔍 Dashboard - dashboardAchievements is array, length:', dashboardAchievements.length);
    achievements = dashboardAchievements.map((ua: any) => ({
      id: ua.name,
      icon_name: ua.icon_name,
      text: ua.text,
      description: ua.description,
      created_on: ua.created_on,
    }));
    console.log('🔍 Dashboard - mapped achievements:', achievements);
  } else {
    console.log('🔍 Dashboard - dashboardAchievements is not array or empty:', dashboardAchievements);
  }

  // Loading and error states
  if (isLoading || userLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-red-500">Error loading dashboard.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <AnimatePresence mode="wait">
        <motion.div 
          key="content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="@container/main flex flex-1 flex-col gap-2"
        >
          {/* Welcome Section */}
          <motion.div variants={itemVariants} className="p-4">
            <h1 className="text-2xl font-bold">Welcome back, {user?.full_name}!</h1>
            <p className="text-muted-foreground mt-2">Track your progress and continue learning.</p>
          </motion.div>

          {/* Enhanced Stats Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4"
          >
            {/* Total Modules Card */}
            <motion.div
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "backOut" }}
                      className="p-2 rounded-xl bg-primary/5 dark:bg-primary/10 shadow-sm border border-border/20"
                    >
                      <BookOpen className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Total Modules
                      </h3>
                    </div>
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mb-2"
                >
                  <div className="text-3xl font-bold text-foreground">
                    {totalModules}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Assigned to you
                  </p>
                </motion.div>
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

            {/* Completed Modules Card */}
            <motion.div
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "backOut", delay: 0.1 }}
                      className="p-2 rounded-xl bg-primary/5 dark:bg-primary/10 shadow-sm border border-border/20"
                    >
                      <Award className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Completed
                      </h3>
                    </div>
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-2"
                >
                  <div className="text-3xl font-bold text-foreground">
                    {completedModules}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Modules finished
                  </p>
                </motion.div>
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

            {/* In Progress Card */}
            <motion.div
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "backOut", delay: 0.2 }}
                      className="p-2 rounded-xl bg-primary/5 dark:bg-primary/10 shadow-sm border border-border/20"
                    >
                      <Clock className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        In Progress
                      </h3>
                    </div>
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="mb-2"
                >
                  <div className="text-3xl font-bold text-foreground">
                    {inProgressModules}
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <p className="text-sm text-muted-foreground">
                    Currently learning
                  </p>
                </motion.div>
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

            {/* Average Progress Card */}
            <motion.div
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
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "backOut", delay: 0.3 }}
                      className="p-2 rounded-xl bg-primary/5 dark:bg-primary/10 shadow-sm border border-border/20"
                    >
                      <Target className="h-5 w-5 text-primary" />
                    </motion.div>
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Avg. Progress
                      </h3>
                    </div>
                  </div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-2"
                >
                  <div className="text-3xl font-bold text-foreground">
                    {Math.round(averageProgress)}%
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mb-3"
                >
                  <p className="text-sm text-muted-foreground">
                    Overall completion
                  </p>
                </motion.div>

                {/* Progress bar */}
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                >
                  <Progress value={averageProgress} className="h-2" />
                </motion.div>
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
          </motion.div>

          {/* Achievements Showcase */}
          <motion.div variants={itemVariants} className="px-4">
            <AchievementShowcase achievements={achievements} loading={achievementsLoading} />
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
            {/* Learning Journey Timeline/Stepper */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Your Learning Journey</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* In Progress Modules */}
                  <section>
                    <h3 className="text-lg font-semibold mb-2">In Progress</h3>
                    {(() => {
                      const inProgressModules = sortedModules.filter((m: any) => {
                        // Use the same progress calculation logic as module detail view
                        let progress = m.progress?.overall_progress ?? m.progress?.progress ?? 0;
                        
                        // If overall_progress is 0 but there are completion details, calculate progress
                        if (progress === 0 && m.progress?.completion_details) {
                          const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = m.progress.completion_details;
                          
                          // Try chapter-based progress first
                          if (total_lesson_chapter_items > 0) {
                            progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                          }
                          // Fallback to content-based progress
                          else if (total_content_items > 0) {
                            progress = Math.round((contents_completed / total_content_items) * 100);
                          }
                        }
                        
                        // Consider "In Progress" if status is "In Progress" OR (progress > 0 and < 100)
                        return m.progress?.status === 'In Progress' || (progress > 0 && progress < 100);
                      });
                      return inProgressModules.length === 0;
                    })() ? (
                      <div className="flex flex-col items-center justify-center p-8">
                        <Lottie animationData={emptyAnimation} loop style={{ width: 120, height: 120 }} />
                        <div className="mt-4 text-muted-foreground">No modules in progress.</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedModules.filter((m: any) => {
                          // Use the same logic as the filter above
                          let progress = m.progress?.overall_progress ?? m.progress?.progress ?? 0;
                          
                          // If overall_progress is 0 but there are completion details, calculate progress
                          if (progress === 0 && m.progress?.completion_details) {
                            const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = m.progress.completion_details;
                            
                            // Try chapter-based progress first
                            if (total_lesson_chapter_items > 0) {
                              progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                            }
                            // Fallback to content-based progress
                            else if (total_content_items > 0) {
                              progress = Math.round((contents_completed / total_content_items) * 100);
                            }
                          }
                          
                          // Consider "In Progress" if status is "In Progress" OR (progress > 0 and < 100)
                          return m.progress?.status === 'In Progress' || (progress > 0 && progress < 100);
                        }).map((module: any, idx: number) => {
                          const { isLocked, lockReason } = getLockState(module, sortedModules);
                          const progress = calculateModuleProgress(module.progress || {});
                          const startDate = module.progress?.started_on ? new Date(module.progress.started_on) : null;
                          const duration = module.progress?.module_duration || module.duration;
                          let dueDate = null;
                          if (startDate && duration) {
                            dueDate = new Date(startDate);
                            dueDate.setDate(startDate.getDate() + Number(duration));
                          }
                          const isMissed = dueDate && dueDate < new Date();
                          return (
                            <motion.div key={module.name || `module-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="transition-all duration-200">
                              <Card className={`relative shadow-md rounded-xl overflow-hidden border mb-2 ${isLocked ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col sm:flex-row items-stretch">
                                  {/* Image or Avatar */}
                                  {module.image ? (
                                    <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 relative">
                                      <img 
                                        src={module.image.startsWith('http') ? module.image : `${LMS_API_BASE_URL}${module.image}`} 
                                        alt={module.name1 + ' image'} 
                                        className="object-cover w-full h-full rounded-r-xl" 
                                        loading="lazy"
                                        onError={(e) => {
                                          // Try alternative URL if first fails
                                          const currentSrc = e.currentTarget.src;
                                          if (!currentSrc.includes('lms.noveloffice.in')) {
                                            e.currentTarget.src = module.image.startsWith('http') ? module.image : `https://lms.noveloffice.in${module.image}`;
                                          }
                                        }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-r-xl">
                                      <span className="text-4xl font-bold text-primary/70 dark:text-primary/80">{module.name1?.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  {/* Main Content */}
                                  <div className="flex-1 flex flex-col justify-between p-4 gap-2 min-w-0">
                                    {/* Progress and Meta */}
                                    <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex flex-col space-y-1 text-xs">
                                          <h3 className="text-lg font-semibold truncate">{module.name1}</h3>
                                          <p className="text-sm text-muted-foreground truncate">{module.description?.replace(/<[^>]+>/g, '')}</p>
                                          <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-semibold text-base">{progress}%</span>
                                          </div>
                                        </div>
                                        <Progress value={progress} className="h-2" aria-label={`Progress: ${progress}%`} />
                                      {/* {startDate && <span className="text-xs text-muted-foreground mt-1">Started: {startDate.toLocaleDateString()}</span>} */}
                                      {/* {duration && <span className="text-xs text-muted-foreground mt-1">Duration: {duration} days</span>} */}
                                      <span className="text-xs text-muted-foreground mt-1">
                                        Started: {startDate ? startDate.toLocaleDateString() : 'N/A'}
                                      </span>
                                      <span className="text-xs text-muted-foreground mt-1">
                                        Duration: {duration ?? 0} days
                                      </span>
                                      {dueDate && (
                                        <span className={`text-xs mt-1 ${isMissed ? 'text-red-600 font-semibold' : 'text-red-500'}`}>Due: {dueDate.toLocaleDateString()} {isMissed && <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded">Missed Deadline</span>}</span>
                                      )}
                                      <div className="flex items-center gap-2 mt-2">
                                        {isLocked ? (
                                          <>
                                            <Lock className="h-4 w-4 text-gray-400" />
                                            <span className="text-xs text-gray-400">Locked</span>
                                          </>
                                        ) : isMissed ? (
                                          <>
                                            <Clock className="h-4 w-4 text-red-500" />
                                            <span className="text-xs text-red-600 font-semibold">Missed Deadline</span>
                                          </>
                                        ) : module.progress?.status === "Completed" ? (
                                          <>
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-xs text-green-700">Completed</span>
                                          </>
                                        ) : module.progress?.status === "In Progress" ? (
                                          <>
                                            <FastForward className="h-4 w-4 text-blue-500" />
                                            <span className="text-xs text-blue-700">In Progress</span>
                                          </>
                                        ) : (
                                          <>
                                            <PlayCircle className="h-4 w-4 text-gray-400" />
                                            <span className="text-xs text-gray-700">Not Started</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    {/* Action Button */}
                                    <div className="flex justify-end mt-4">
                                      {isLocked ? (
                                        <span
                                          className="rounded-full px-4 py-2 bg-gray-200 text-gray-500 flex items-center gap-2 cursor-not-allowed shadow"
                                          title={lockReason}
                                        >
                                          <Lock className="h-4 w-4" />
                                          Locked
                                        </span>
                                      ) : (
                                        <Link
                                          href={ROUTES.LEARNER_MODULE_DETAIL(module.name)}
                                          className="rounded-full px-4 py-2 bg-primary text-white flex items-center gap-2 shadow hover:bg-primary/90 transition"
                                          aria-label={`${module.progress?.status === "Completed" ? "Review" : module.progress?.status === "In Progress" ? "Resume" : "Start"} module: ${module.name1}`}
                                        >
                                          {module.progress?.status === "Completed" ? (
                                            "Review"
                                          ) : module.progress?.status === "In Progress" ? (
                                            "Resume"
                                          ) : (
                                            "Start"
                                          )}
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                  {/* Ready to Start Modules */}
                  <section className="mt-8">
                    <h3 className="text-lg font-semibold mb-2">Ready to Start</h3>
                    {deadlinesLoading ? (
                      <div className="flex flex-col items-center justify-center p-8">
                        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                        <div className="mt-4 text-muted-foreground">Loading modules...</div>
                      </div>
                    ) : (function() {
                      const notStarted = sortedModules.filter((m: any) => {
                        // Use the same progress calculation logic as module detail view
                        let progress = m.progress?.overall_progress ?? m.progress?.progress ?? 0;
                        
                        // If overall_progress is 0 but there are completion details, calculate progress
                        if (progress === 0 && m.progress?.completion_details) {
                          const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = m.progress.completion_details;
                          
                          // Try chapter-based progress first
                          if (total_lesson_chapter_items > 0) {
                            progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                          }
                          // Fallback to content-based progress
                          else if (total_content_items > 0) {
                            progress = Math.round((contents_completed / total_content_items) * 100);
                          }
                        }
                        
                        // Consider "Not Started" only if progress is 0 and status is "Not Started"
                        // This ensures modules with progress > 0 are not shown in "Ready to Start"
                        return progress === 0 && (!m.progress || m.progress.status === 'Not Started');
                      });
                      
                      const ordered = notStarted.filter((item: any) => item.order && item.order > 0).sort((a: any, b: any) => a.order - b.order);
                      const unordered = notStarted.filter((item: any) => !item.order || item.order === 0);
                      const readyToStart = [...ordered, ...unordered];
                      if (!readyToStart.length) {
                        return (
                          <div className="flex flex-col items-center justify-center p-8">
                            <Lottie animationData={emptyAnimation} loop style={{ width: 120, height: 120 }} />
                            <div className="mt-4 text-muted-foreground">All modules started!</div>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-4">
                          {readyToStart.map((module: any, idx: number) => {
                            const moduleName = module?.name1 || module?.name || "Module";
                            const duration = module?.duration;
                            
                            // For "Ready to Start" modules, only check if it's a department-ordered module
                            // Since these modules haven't been started, we don't need complex locking logic
                            let isLocked = false;
                            let lockReason = "";
                            if (module.assignment_based === "Department" && module.order && module.order > 0) {
                              // Check if there are any previous department-ordered modules that aren't completed
                              const deptOrdered = sortedModules.filter((m: any) => 
                                m.assignment_based === "Department" && m.order && m.order > 0
                              );
                              const previous = deptOrdered.filter((m: any) => m.order < module.order);
                              if (previous.some((m: any) => m.progress?.status !== "Completed")) {
                                isLocked = true;
                                lockReason = "Complete previous modules to unlock this module.";
                              }
                            }
                            
                            const isMissed = false; // Not started modules can't be missed
                            return (
                              <motion.div key={module.name || `ready-module-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="transition-all duration-200">
                                <Card className={`relative shadow-md rounded-xl overflow-hidden border mb-2 ${isLocked ? 'opacity-60' : ''}`}>
                                  <div className="flex flex-col sm:flex-row items-stretch">
                                    {/* Image or Avatar */}
                                    {module.image ? (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 relative">
                                        <img 
                                          src={module.image.startsWith('http') ? module.image : `${LMS_API_BASE_URL}${module.image}`} 
                                          alt={moduleName + ' image'} 
                                          className="object-cover w-full h-full rounded-r-xl" 
                                          loading="lazy"
                                          onError={(e) => {
                                            // Try alternative URL if first fails
                                            const currentSrc = e.currentTarget.src;
                                            if (!currentSrc.includes('lms.noveloffice.in')) {
                                              e.currentTarget.src = module.image.startsWith('http') ? module.image : `https://lms.noveloffice.in${module.image}`;
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-r-xl">
                                        <span className="text-4xl font-bold text-primary/70 dark:text-primary/80">{moduleName?.charAt(0).toUpperCase()}</span>
                                      </div>
                                    )}
                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col justify-between p-4 gap-2 min-w-0">
                                      {/* Meta */}
                                      <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex flex-col space-y-1 text-xs">
                                          <h3 className="text-lg font-semibold truncate">{module.name1}</h3>
                                          <p className="text-sm text-muted-foreground truncate">{module.description?.replace(/<[^>]+>/g, '')}</p>
                                        </div>
                                        {duration !== 0 && <span className="text-xs text-muted-foreground mt-1">Duration: {duration} days</span>}
                                        <div className="flex items-center gap-2 mt-2">
                                          {isLocked ? (
                                            <>
                                              <Lock className="h-4 w-4 text-gray-400" />
                                              <span className="text-xs text-gray-400">Locked</span>
                                            </>
                                          ) : isMissed ? (
                                            <>
                                              <Clock className="h-4 w-4 text-red-500" />
                                              <span className="text-xs text-red-600 font-semibold">Missed Deadline</span>
                                            </>
                                          ) : module.progress?.status === "Completed" ? (
                                            <>
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                              <span className="text-xs text-green-700">Completed</span>
                                            </>
                                          ) : module.progress?.status === "In Progress" ? (
                                            <>
                                              <FastForward className="h-4 w-4 text-blue-500" />
                                              <span className="text-xs text-blue-700">In Progress</span>
                                            </>
                                          ) : (
                                            <>
                                              <PlayCircle className="h-4 w-4 text-gray-400" />
                                              <span className="text-xs text-gray-700">Not Started</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {/* Action Button */}
                                      <div className="flex justify-end mt-4 flex-shrink-0">
                                        {isLocked ? (
                                          <span
                                            className="rounded-full px-4 py-2 bg-gray-200 text-gray-500 flex items-center gap-2 cursor-not-allowed shadow"
                                            title={lockReason}
                                          >
                                            <Lock className="h-4 w-4" />
                                            Locked
                                          </span>
                                        ) : (
                                          <Link
                                            href={ROUTES.LEARNER_MODULE_DETAIL(module.name)}
                                            className="rounded-full px-4 py-2 bg-primary text-white flex items-center gap-2 shadow hover:bg-primary/90 transition flex-shrink-0"
                                            aria-label={`Start module: ${moduleName}`}
                                          >
                                            {module.progress?.status === "In Progress" ? (
                                              <>
                                                <FastForward className="h-5 w-5" />
                                                Resume
                                              </>
                                            ) : (
                                              <>
                                                <PlayCircle className="h-5 w-5" />
                                                Start
                                              </>
                                            )}
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </section>
                  {/* Completed Modules (collapsible) */}
                  <section className="mt-8">
                    <details>
                      <summary className="text-lg font-semibold mb-2 cursor-pointer">Completed Modules</summary>
                      {(() => {
                        const completedModules = sortedModules.filter((m: any) => {
                          // Use the same progress calculation logic as module detail view
                          let progress = m.progress?.overall_progress ?? m.progress?.progress ?? 0;
                          
                          // If overall_progress is 0 but there are completion details, calculate progress
                          if (progress === 0 && m.progress?.completion_details) {
                            const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = m.progress.completion_details;
                            
                            // Try chapter-based progress first
                            if (total_lesson_chapter_items > 0) {
                              progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                            }
                            // Fallback to content-based progress
                            else if (total_content_items > 0) {
                              progress = Math.round((contents_completed / total_content_items) * 100);
                            }
                          }
                          
                          // Consider "Completed" if progress >= 100 or status is "Completed"
                          return progress >= 100 || m.progress?.status === 'Completed';
                        });
                        return completedModules.length === 0;
                      })() ? (
                        <div className="flex flex-col items-center justify-center p-8">
                          <Lottie animationData={emptyAnimation} loop style={{ width: 120, height: 120 }} />
                          <div className="mt-4 text-muted-foreground">No completed modules yet.</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sortedModules.filter((m: any) => m.progress?.status === 'Completed').map((module: any, idx: number) => {
                            const { isLocked, lockReason } = getLockState(module, sortedModules);
                            const progress = calculateModuleProgress(module.progress || {});

                            // console.log("Fields in module =", Object.keys(module));
                            // console.log("Progress=", module.progress.overall_progress)

                            const isMissed = false; // Completed modules are not missed
                            return (
                              <motion.div key={module.name || `completed-module-${idx}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="transition-all duration-200">
                                <Card className={`relative shadow-md rounded-xl overflow-hidden border mb-2 ${isLocked ? 'opacity-60' : ''}`}>
                                  <div className="flex flex-col sm:flex-row items-stretch">
                                    {/* Image or Avatar */}
                                    {module.image ? (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 relative">
                                        <img 
                                          src={module.image.startsWith('http') ? module.image : `${LMS_API_BASE_URL}${module.image}`} 
                                          alt={module.name1 + ' image'} 
                                          className="object-cover w-full h-full rounded-r-xl" 
                                          loading="lazy"
                                          onError={(e) => {
                                            // Try alternative URL if first fails
                                            const currentSrc = e.currentTarget.src;
                                            if (!currentSrc.includes('lms.noveloffice.in')) {
                                              e.currentTarget.src = module.image.startsWith('http') ? module.image : `https://lms.noveloffice.in${module.image}`;
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-r-xl">
                                        <span className="text-4xl font-bold text-primary/70 dark:text-primary/80">{module.name1?.charAt(0).toUpperCase()}</span>
                                      </div>
                                    )}
                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col justify-between p-4 gap-2 min-w-0">
                                      {/* Progress and Meta */}
                                      <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex flex-col space-y-1 text-xs">
                                          <h3 className="text-lg font-semibold truncate">{module.name1}</h3>
                                          <p className="text-sm text-muted-foreground truncate">{module.description?.replace(/<[^>]+>/g, '')}</p>
                                          <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-semibold text-base">{progress}%</span>
                                          </div>
                                        </div>
                                        <Progress value={progress} className="h-2" aria-label={`Progress: ${progress}%`} />
                                        {module.progress?.status === "Completed" && module.progress?.completed_on && (
                                          <span className="text-xs text-green-700 dark:text-green-400 mt-1">Completed on {new Date(module.progress.completed_on).toLocaleDateString()}</span>
                                        )}
                                        <div className="flex items-center gap-2 mt-2">
                                          {isLocked ? (
                                            <>
                                              <Lock className="h-4 w-4 text-gray-400" />
                                              <span className="text-xs text-gray-400">Locked</span>
                                            </>
                                          ) : isMissed ? (
                                            <>
                                              <Clock className="h-4 w-4 text-red-500" />
                                              <span className="text-xs text-red-600 font-semibold">Missed Deadline</span>
                                            </>
                                          ) : module.progress?.status === "Completed" ? (
                                            <>
                                              <CheckCircle className="h-4 w-4 text-green-500" />
                                              <span className="text-xs text-green-700">Completed</span>
                                            </>
                                          ) : module.progress?.status === "In Progress" ? (
                                            <>
                                              <FastForward className="h-4 w-4 text-blue-500" />
                                              <span className="text-xs text-blue-700">In Progress</span>
                                            </>
                                          ) : (
                                            <>
                                              <PlayCircle className="h-4 w-4 text-gray-400" />
                                              <span className="text-xs text-gray-700">Not Started</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {/* Action Button */}
                                      <div className="flex justify-end mt-4">
                                        {isLocked ? (
                                          <span
                                            className="rounded-full px-4 py-2 bg-gray-200 text-gray-500 flex items-center gap-2 cursor-not-allowed shadow"
                                            title={lockReason}
                                          >
                                            <Lock className="h-4 w-4" />
                                            Locked
                                          </span>
                                        ) : (
                                          <Link
                                            href={ROUTES.LEARNER_MODULE_DETAIL(module.name)}
                                            className="rounded-full px-4 py-2 bg-primary text-white flex items-center gap-2 shadow hover:bg-primary/90 transition"
                                            aria-label={`${module.progress?.status === "Completed" ? "Review" : "Resume"} module: ${module.name1}`}
                                          >
                                            {module.progress?.status === "Completed" ? (
                                              "Review"
                                            ) : module.progress?.status === "In Progress" ? (
                                              "Resume"
                                            ) : (
                                              "Start"
                                            )}
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </details>
                  </section>
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div variants={itemVariants} className="space-y-4">
              {/* Upcoming Deadlines: Only In Progress modules, ordered */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  {deadlinesLoading ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                      <div className="mt-2 text-muted-foreground">Loading deadlines...</div>
                    </div>
                  ) : !DeadlineData?.message?.length ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Lottie animationData={emptyAnimation} loop style={{ width: 80, height: 80 }} />
                      <div className="mt-2 text-muted-foreground">No upcoming deadlines.</div>
                    </div>
                  ) : (
                    (() => {
                      // Filter and order modules for deadlines section
                      let inProgressModules = getModulesArray().filter((item: any) => {
                        if (!item.progress) return false;
                        
                        // Use the same progress calculation logic as other sections
                        let progress = item.progress?.overall_progress ?? item.progress?.progress ?? 0;
                        
                        // If overall_progress is 0 but there are completion details, calculate progress
                        if (progress === 0 && item.progress?.completion_details) {
                          const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = item.progress.completion_details;
                          
                          // Try chapter-based progress first
                          if (total_lesson_chapter_items > 0) {
                            progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                          }
                          // Fallback to content-based progress
                          else if (total_content_items > 0) {
                            progress = Math.round((contents_completed / total_content_items) * 100);
                          }
                        }
                        
                        // Consider "In Progress" if status is "In Progress" OR (progress > 0 and < 100)
                        return item.progress.status === "In Progress" || (progress > 0 && progress < 100);
                      });
                      // Separate ordered and unordered
                      const ordered = inProgressModules.filter((m: any) => m.module?.order && m.module.order > 0).sort((a: any, b: any) => a.module.order - b.module.order);
                      const unordered = inProgressModules.filter((m: any) => !m.module?.order || m.module.order === 0);
                      inProgressModules = [...ordered, ...unordered];
                      return inProgressModules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4">
                          <Lottie animationData={emptyAnimation} loop style={{ width: 80, height: 80 }} />
                          <div className="mt-2 text-muted-foreground">No modules in progress.</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {inProgressModules.map((item: any) => {
                            const moduleName = item.module?.name1 || item.module?.name || "Module";
                            const startDate = item.progress?.started_on ? new Date(item.progress.started_on) : null;
                            const duration = item.progress?.module_duration || item.module?.duration;
                            let dueDate = null;
                            if (startDate && duration) {
                              dueDate = new Date(startDate);
                              dueDate.setDate(startDate.getDate() + Number(duration));
                            }
                            const isMissed = dueDate && dueDate < new Date();
                            return (
                              <div key={item.module?.name} className="flex items-start gap-4">
                                <Calendar className="h-5 w-5 text-red-500 mt-1" />
                                <div>
                                  <h4 className="font-medium">{moduleName}</h4>
                                  {startDate && <p className="text-sm text-muted-foreground">Started: {startDate.toLocaleDateString()}</p>}
                                  {duration && <p className="text-sm text-muted-foreground">Duration: {duration} days</p>}
                                  {dueDate && (
                                    <p className={`text-sm ${isMissed ? "text-red-600 font-semibold" : "text-red-500"}`}>Due: {dueDate.toLocaleDateString()} {isMissed && <span className="ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded">Missed Deadline</span>}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>

              {/* Ready to Start: Only modules with no progress, ordered */}
              <Card>
                <CardHeader>
                  <CardTitle>Ready to Start</CardTitle>
                </CardHeader>
                <CardContent>
                  {deadlinesLoading ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                      <div className="mt-2 text-muted-foreground">Loading modules...</div>
                    </div>
                  ) : !DeadlineData?.message?.length ? (
                    <div className="flex flex-col items-center justify-center p-4">
                      <Lottie animationData={emptyAnimation} loop style={{ width: 80, height: 80 }} />
                      <div className="mt-2 text-muted-foreground">No modules found.</div>
                    </div>
                  ) : (
                    (() => {
                      // Filter and order modules for ready to start section
                      let notStartedModules = getModulesArray().filter((item: any) => {
                        if (!item.progress) return true; // No progress means not started
                        
                        // Use the same progress calculation logic as other sections
                        let progress = item.progress?.overall_progress ?? item.progress?.progress ?? 0;
                        
                        // If overall_progress is 0 but there are completion details, calculate progress
                        if (progress === 0 && item.progress?.completion_details) {
                          const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = item.progress.completion_details;
                          
                          // Try chapter-based progress first
                          if (total_lesson_chapter_items > 0) {
                            progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                          }
                          // Fallback to content-based progress
                          else if (total_content_items > 0) {
                            progress = Math.round((contents_completed / total_content_items) * 100);
                          }
                        }
                        
                        // Consider "Not Started" only if progress is 0 and status is "Not Started"
                        // This ensures modules with progress > 0 are not shown in "Ready to Start"
                        return progress === 0 && item.progress.status === 'Not Started';
                      });
                      // Separate ordered and unordered
                      const ordered = notStartedModules.filter((m: any) => m.module?.order && m.module.order > 0).sort((a: any, b: any) => a.module.order - b.module.order);
                      const unordered = notStartedModules.filter((m: any) => !m.module?.order || m.module.order === 0);
                      notStartedModules = [...ordered, ...unordered];
                      return notStartedModules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4">
                          <Lottie animationData={emptyAnimation} loop style={{ width: 80, height: 80 }} />
                          <div className="mt-2 text-muted-foreground">All modules started!</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {notStartedModules.map((item: any) => {
                            const moduleName = item.module?.name1 || item.module?.name || "Module";
                            const duration = item.module?.duration;
                            // const { isLocked, lockReason } = getLockState(item.module, sortedModules);
                            // const isMissed = false; // Not started modules can't be missed
                            return (
                              <div key={item.module?.name} className="flex items-start gap-4">
                                <Calendar className="h-5 w-5 text-blue-500 mt-1" />
                                <div>
                                  <h4 className="font-medium">{moduleName}</h4>
                                  {duration !== 0 && <p className="text-sm text-muted-foreground">Duration: {duration} days</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}