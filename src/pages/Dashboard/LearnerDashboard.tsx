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
  // IMPORTANT: 
  // - Completed modules are NEVER locked (always accessible)
  // - Only Department-based modules can be locked
  // - Manual and Everyone modules are NEVER locked
  const isCompleted = module.progress?.status === "Completed";
  let isLocked = false;
  let lockReason = "";
  
  // Only Department-based modules can be locked
  if (module.assignment_based !== "Department") {
    isLocked = false;
  } else if (isCompleted) {
    // If module is completed, it's never locked
    isLocked = false;
  } else if (module.is_locked !== undefined && module.is_locked !== null) {
    // CRITICAL: Use backend is_locked field - backend has department-aware locking logic
    // Backend returns false for unlocked modules, true for locked modules
    // IMPORTANT: false is a valid value, so we must check !== undefined && !== null
    isLocked = Boolean(module.is_locked);
    
    if (isLocked) {
      lockReason = "Complete previous modules to unlock this module.";
      
    } else {
      
    }
  } else {
    // is_locked is undefined or null - use fallback calculation
    console.warn(`⚠️ [DASHBOARD] Module ${module.name} (${module.name1}) - is_locked is ${module.is_locked} (undefined/null), using fallback calculation`);
    // Fallback to frontend calculation (for backward compatibility only)
    // IMPORTANT: Filter by department to ensure independent locking per department
    if (module.assignment_based === "Department" && module.order && module.order > 0) {
      const moduleDepartment = (module.department || "").trim().toLowerCase();
      
      // Find all Department-based ordered modules from the SAME department only
      const deptOrdered = allModules.filter((m: any) => {
        const mDept = (m.department || "").trim().toLowerCase();
        return m.assignment_based === "Department" 
          && m.order && m.order > 0
          && mDept === moduleDepartment; // SAME DEPARTMENT ONLY
      });
      
      // Find all previous Department-based modules (lower order) from SAME department
      const previous = deptOrdered.filter((m: any) => m.order < module.order);
      
      // If any previous Department-based module from SAME department is not completed, lock this module
      if (previous.some((m: any) => m.progress?.status !== "Completed")) {
        isLocked = true;
        lockReason = "Complete previous modules to unlock this module.";
      }
    }
  }
  return { isLocked, lockReason };
}

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

  // Extract modules and meta - PRIORITIZE useLearnerModuleData (has is_locked field) over useLearnerDashboard
  // CRITICAL: get_learner_module_data includes is_locked field which is essential for proper locking
  // useLearnerModuleData returns data directly: { modules: [...], meta: {...} }
  // useLearnerDashboard returns data under message: [{ module: {...}, progress: {...} }]
  
  let modules: any[] = [];
  let meta: any = {};
  
  // PRIORITY 1: Use useLearnerModuleData (has is_locked field) - this is the primary source
  if (data?.message?.modules && Array.isArray(data.message.modules)) {
    // Response format: { message: { modules: [...], meta: {...} } }
    modules = data.message.modules || [];
    meta = data.message.meta || {};
    
  } else if (data?.modules && Array.isArray(data.modules)) {
    // Direct structure: { modules: [...], meta: {...} }
    modules = data.modules || [];
    meta = data.meta || {};
    
  } else if (data?.message && Array.isArray(data.message)) {
    // Array format: { message: [{ module: {...}, progress: {...} }] }
    modules = data.message.map((item: any) => ({
      ...item.module,
      progress: item.progress,
      // CRITICAL: Preserve is_locked field
      is_locked: item.module?.is_locked !== undefined ? item.module.is_locked : item.is_locked
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
   
  }
  // FALLBACK: Use get_learner_dashboard only if useLearnerModuleData is not available
  else if (DeadlineData?.message && Array.isArray(DeadlineData.message) && DeadlineData.message.length > 0) {
    // Transform the data to match expected format
    // WARNING: get_learner_dashboard may not have is_locked field
    modules = DeadlineData.message.map((item: any) => {
      const moduleData = {
        ...item.module,
        progress: item.progress,
        // Explicitly preserve is_locked if it exists (may be undefined)
        is_locked: item.module?.is_locked !== undefined ? item.module.is_locked : undefined
      };
      // Debug logging for is_locked
      if (item.module?.is_locked !== undefined) {
        
      } else {
        console.warn(`⚠️ [DASHBOARD] Module ${item.module?.name} (${item.module?.name1}) - is_locked is MISSING from dashboard API, will use fallback logic`);
      }
      return moduleData;
    });
    
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
    
  }
  
  // Check if modules have the nested structure (module.module, module.progress)
  if (modules.length > 0 && modules[0].module) {
    modules = modules.map((item: any) => {
      const moduleData = {
        ...item.module,
        progress: item.progress,
        // CRITICAL: Preserve is_locked field if it exists
        is_locked: item.module?.is_locked !== undefined ? item.module.is_locked : item.is_locked
      };
      
      return moduleData;
    });
  }
  
  // Check if modules are empty and add fallback
  if (modules.length > 0 && Object.keys(modules[0]).length === 0) {
    // Try to get modules from the fallback API
    if (DeadlineData?.message && Array.isArray(DeadlineData.message)) {
      modules = DeadlineData.message.map((item: any) => ({
        ...item.module,
        progress: item.progress,
        // Preserve is_locked if it exists
        is_locked: item.module?.is_locked !== undefined ? item.module.is_locked : undefined
      }));
    }
  }
  
  // Final check: Log all modules and their is_locked status for debugging
  React.useEffect(() => {
    if (modules.length > 0) {
      console.log('🔍 [DASHBOARD] Final modules array:', modules.map((m: any) => ({
        name: m.name,
        name1: m.name1,
        is_locked: m.is_locked,
        hasIsLocked: 'is_locked' in m,
        assignment_based: m.assignment_based,
        department: m.department,
        order: m.order
      })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(modules.map((m: any) => ({ name: m.name, is_locked: m.is_locked })))]);
  
  // If useLearnerModuleData doesn't have data, use useLearnerDashboard data (final fallback)
  if (modules.length === 0 && DeadlineData?.message && !deadlineError) {
    const deadlineModules = DeadlineData.message;
    
    // Ensure deadlineModules is an array before calling map
    if (Array.isArray(deadlineModules)) {
      // Transform the data to match expected format
      // WARNING: Preserve is_locked if it exists, but it may be undefined
      modules = deadlineModules.map((item: any) => {
        const moduleData = {
          ...item.module,
          progress: item.progress,
          // Explicitly preserve is_locked if it exists
          is_locked: item.module?.is_locked !== undefined ? item.module.is_locked : undefined
        };
        if (moduleData.is_locked === undefined) {
          console.warn(`⚠️ [DASHBOARD] Module ${moduleData.name} (${moduleData.name1}) - is_locked is MISSING from final fallback`);
        }
        return moduleData;
      });
    } else {
      console.warn('DeadlineData.message is not an array:', deadlineModules);
      // If it's not an array, try to extract array from nested structure
      const extractedArray = getDeadlineDataArray();
      if (Array.isArray(extractedArray) && extractedArray.length > 0) {
        modules = extractedArray.map((item: any) => ({
          ...item.module,
          progress: item.progress,
          // Preserve is_locked if it exists
          is_locked: item.module?.is_locked !== undefined ? item.module.is_locked : undefined
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
    
    fetchAchievements();
  }, [modules.length, fetchAchievements]);

  // Map API data to AchievementShowcase props
  let achievements: Achievement[] = [];
  
  if (dashboardAchievements && Array.isArray(dashboardAchievements)) {
    
    achievements = dashboardAchievements.map((ua: any) => ({
      id: ua.name,
      icon_name: ua.icon_name,
      text: ua.text,
      description: ua.description,
      created_on: ua.created_on,
    }));
    
  } else {
   
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
                                        src={(() => {
                                          // Helper function to get full image URL
                                          const getImageUrl = (path: string): string => {
                                            if (!path) return '';
                                            const trimmed = path.trim();
                                            if (!trimmed) return '';
                                            
                                            // If already a full URL, return as is
                                            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                                              return trimmed;
                                            }
                                            
                                            // Ensure path starts with / if it doesn't already
                                            const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                                            
                                            // Determine base URL
                                            // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
                                            // In development: use http://lms.noveloffice.org
                                            const baseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
                                            const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                                            
                                            return `${cleanBaseUrl}${relativePath}`;
                                          };
                                          return getImageUrl(module.image);
                                        })()}
                                        alt={module.name1 + ' image'} 
                                        className="object-cover w-full h-full rounded-r-xl" 
                                        loading="lazy"
                                        onError={() => {
                                          console.error('Failed to load module image:', module.image);
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
                                            <span className="font-semibold text-base">{Math.round(progress)}%</span>
                                          </div>
                                        </div>
                                        <Progress value={progress} className="h-2" aria-label={`Progress: ${Math.round(progress)}%`} />
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
                            
                            // For "Ready to Start" modules, use backend is_locked if available
                            let isLocked = false;
                            let lockReason = "";
                            
                            // CRITICAL: Use backend is_locked field if available (same as other sections)
                            if (module.is_locked !== undefined && module.is_locked !== null) {
                              isLocked = Boolean(module.is_locked);
                              console.log(`🔒 [DASHBOARD] Ready to Start - Module ${module.name} (${module.name1}) - Using backend is_locked: ${module.is_locked} -> isLocked: ${isLocked}`);
                              if (isLocked) {
                                lockReason = "Complete previous modules to unlock this module.";
                              }
                            } else if (module.assignment_based === "Department" && module.order && module.order > 0) {
                              // Fallback: Check if there are any previous department-ordered modules from SAME department that aren't completed
                              const moduleDepartment = (module.department || "").trim().toLowerCase();
                              const deptOrdered = sortedModules.filter((m: any) => {
                                const mDept = (m.department || "").trim().toLowerCase();
                                return m.assignment_based === "Department" 
                                  && m.order && m.order > 0
                                  && mDept === moduleDepartment; // SAME DEPARTMENT ONLY
                              });
                              const previous = deptOrdered.filter((m: any) => m.order < module.order);
                              if (previous.some((m: any) => m.progress?.status !== "Completed")) {
                                isLocked = true;
                                lockReason = "Complete previous modules to unlock this module.";
                                console.warn(`⚠️ [DASHBOARD] Ready to Start - Module ${module.name} (${module.name1}) - Using fallback calculation, is_locked was missing`);
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
                                          src={(() => {
                                            // Helper function to get full image URL
                                            const getImageUrl = (path: string): string => {
                                              if (!path) return '';
                                              const trimmed = path.trim();
                                              if (!trimmed) return '';
                                              
                                              // If already a full URL, return as is
                                              if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                                                return trimmed;
                                              }
                                              
                                              // Ensure path starts with / if it doesn't already
                                              const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                                              
                                              // Determine base URL
                                              // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
                                              // In development: use http://lms.noveloffice.org
                                              const baseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
                                              const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                                              
                                              return `${cleanBaseUrl}${relativePath}`;
                                            };
                                            return getImageUrl(module.image);
                                          })()}
                                        alt={moduleName + ' image'} 
                                        className="object-cover w-full h-full rounded-r-xl" 
                                        loading="lazy"
                                        onError={() => {
                                          console.error('Failed to load module image:', module.image);
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
                                          src={(() => {
                                            // Helper function to get full image URL
                                            const getImageUrl = (path: string): string => {
                                              if (!path) return '';
                                              const trimmed = path.trim();
                                              if (!trimmed) return '';
                                              
                                              // If already a full URL, return as is
                                              if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                                                return trimmed;
                                              }
                                              
                                              // Ensure path starts with / if it doesn't already
                                              const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                                              
                                              // Determine base URL
                                              // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
                                              // In development: use http://lms.noveloffice.org
                                              const baseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
                                              const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                                              
                                              return `${cleanBaseUrl}${relativePath}`;
                                            };
                                            return getImageUrl(module.image);
                                          })()}
                                        alt={module.name1 + ' image'} 
                                        className="object-cover w-full h-full rounded-r-xl" 
                                        loading="lazy"
                                        onError={() => {
                                          console.error('Failed to load module image:', module.image);
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
                                            <span className="font-semibold text-base">{Math.round(progress)}%</span>
                                          </div>
                                        </div>
                                        <Progress value={progress} className="h-2" aria-label={`Progress: ${Math.round(progress)}%`} />
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