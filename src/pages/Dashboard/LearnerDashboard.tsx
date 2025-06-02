import * as React from "react"
import { useState } from "react"
import { useUser } from "@/hooks/use-user"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "wouter"
import { BookOpen, Clock, Award, Calendar, Target, Lock, PlayCircle, FastForward, Eye, CheckCircle } from "lucide-react"
import { ROUTES } from "@/config/routes"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import { useFrappeGetCall, useFrappeGetDocList } from "frappe-react-sdk"
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import AchievementShowcase from "@/components/AchievementShowcase";


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

const StatusBadge = ({ status, isMissed, isLocked, tooltip }: { status: string, isMissed?: boolean, isLocked?: boolean, tooltip?: string }) => {
  let icon = null, color = "";
  if (isLocked) {
    icon = <Lock className="h-4 w-4" />;
    color = "bg-gray-300 text-gray-700";
  } else if (isMissed) {
    icon = <Clock className="h-4 w-4" />;
    color = "bg-red-100 text-red-600";
  } else if (status === "In Progress") {
    icon = <FastForward className="h-4 w-4" />;
    color = "bg-blue-100 text-blue-600";
  } else if (status === "Completed") {
    icon = <CheckCircle className="h-4 w-4" />;
    color = "bg-green-100 text-green-600";
  } else {
    icon = <PlayCircle className="h-4 w-4" />;
    color = "bg-gray-100 text-gray-700";
  }
  return (
    <div className={`absolute top-3 right-3 rounded-full p-1 shadow ${color} cursor-default`} title={tooltip || status} aria-label={tooltip || status}>
      {icon}
    </div>
  );
};

export default function LearnerDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState("current")

  // Fetch modules and stats from LearnerModuleData API
  const { data, error, isLoading } = useFrappeGetCall<any>("LearnerModuleData", {
    user: user?.email,
    limit: 100, // Large enough for dashboard
    offset: 0,
  });

  const { data: DeadlineData, isLoading: deadlinesLoading } = useFrappeGetCall<any>("learnerDashboard", {
    user: user?.email,
  });

  console.log('DeadlineData', DeadlineData);

  // Fetch user achievements from API
  const { data: userAchievements, isLoading: achievementsLoading } = useFrappeGetDocList(
    "User Achievement",
    {
      fields: [
        "name",
        "achievement",
        "created_on",
        "user",
        "achievement.icon_name",
        "achievement.text",
        "achievement.description"
      ],
      filters: [["user", "=", user?.name || ""]],
    },
    { enabled: !!user?.name }
  );

  // Extract modules and meta
  const modules = data?.data?.modules || [];
  const meta = data?.data?.meta || {};

  // Calculate stats (fallback to 0 if not present)
  const totalModules = meta.total_count || 0;
  const completedModules = meta.completed_modules || 0;
  const inProgressModules = meta.in_progress_modules || 0;
  const averageProgress = meta.average_progress || 0;

  // Robust sorting: ordered modules (order > 0) by order asc, then unordered (order 0 or undefined) in API order
  const sortedModules = React.useMemo(() => {
    // Separate ordered and unordered
    const ordered = modules.filter((m: any) => m.order && m.order > 0).sort((a: any, b: any) => a.order - b.order);
    const unordered = modules.filter((m: any) => !m.order || m.order === 0);
    // Ordered first, then unordered in original order
    return [...ordered, ...unordered];
  }, [modules]);

  // Map API data to AchievementShowcase props
  let achievements: Achievement[] = [];
  if (userAchievements && Array.isArray(userAchievements)) {
    achievements = userAchievements.map((ua: any) => ({
      id: ua.name,
      icon_name: ua.icon_name,
      text: ua.text,
      description: ua.description,
      created_on: ua.created_on,
    }));
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

          {/* Stats Cards */}
          <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                <BookOpen className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalModules}</div>
                <p className="text-xs text-muted-foreground">Assigned to you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <Award className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedModules}</div>
                <p className="text-xs text-muted-foreground">Modules finished</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressModules}</div>
                <p className="text-xs text-muted-foreground">Currently learning</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
                <Target className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(averageProgress)}%</div>
                <Progress value={averageProgress} className="h-2 mt-2" />
              </CardContent>
            </Card>
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
                    {sortedModules.filter((m: any) => m.progress?.status === 'In Progress').length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8">
                        <Lottie animationData={emptyAnimation} loop style={{ width: 120, height: 120 }} />
                        <div className="mt-4 text-muted-foreground">No modules in progress.</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sortedModules.filter((m: any) => m.progress?.status === 'In Progress').map((module: any, idx: number) => {
                          const { isLocked, lockReason } = getLockState(module, sortedModules);
                          const progress = module.progress?.progress || 0;
                          const startDate = module.progress?.started_on ? new Date(module.progress.started_on) : null;
                          const duration = module.progress?.module_duration || module.duration;
                          let dueDate = null;
                          if (startDate && duration) {
                            dueDate = new Date(startDate);
                            dueDate.setDate(startDate.getDate() + Number(duration));
                          }
                          const isMissed = dueDate && dueDate < new Date();
                          return (
                            <motion.div key={module.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="transition-all duration-200">
                              <Card className={`relative shadow-md rounded-xl overflow-hidden border mb-2 ${isLocked ? 'opacity-60' : ''}`}>
                                <div className="flex flex-col sm:flex-row items-stretch">
                                  {/* Image or Avatar */}
                                  {module.image ? (
                                    <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 relative">
                                      <img src={module.image.startsWith('http') ? module.image : `http://10.80.4.72${module.image}`} alt={module.name1 + ' image'} className="object-cover w-full h-full rounded-r-xl" loading="lazy" />
                                    </div>
                                  ) : (
                                    <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-r-xl">
                                      <span className="text-4xl font-bold text-primary/70 dark:text-primary/80">{module.name1?.charAt(0).toUpperCase()}</span>
                                    </div>
                                  )}
                                  {/* Main Content */}
                                  <div className="flex-1 flex flex-col justify-between p-4 gap-2">
                                    <div className="flex flex-col gap-1">
                                      <h3 className="text-lg font-semibold truncate" title={module.name1}>{module.name1}</h3>
                                      {module.description && <p className="text-sm text-muted-foreground truncate" title={module.description}>{module.description}</p>}
                                    </div>
                                    {/* Progress and Meta */}
                                    <div className="flex flex-col gap-1 mt-2">
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">Progress</span>
                                        <span className="font-semibold text-base">{progress}%</span>
                                      </div>
                                      <Progress value={progress} className="h-2" aria-label={`Progress: ${progress}%`} />
                                      {startDate && <span className="text-xs text-muted-foreground mt-1">Started: {startDate.toLocaleDateString()}</span>}
                                      {duration && <span className="text-xs text-muted-foreground mt-1">Duration: {duration} days</span>}
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
                                          aria-label={`Start module: ${module.name1}`}
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
                      const notStarted = DeadlineData.message.filter((item: any) => !item.progress);
                      const ordered = notStarted.filter((item: any) => item.module?.order && item.module.order > 0).sort((a: any, b: any) => a.module.order - b.module.order);
                      const unordered = notStarted.filter((item: any) => !item.module?.order || item.module.order === 0);
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
                          {readyToStart.map((item: any, idx: number) => {
                            const module = item.module;
                            const moduleName = module?.name1 || module?.name || "Module";
                            const duration = module?.duration;
                            const { isLocked, lockReason } = getLockState(module, sortedModules);
                            const isMissed = false; // Not started modules can't be missed
                            return (
                              <motion.div key={module.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="transition-all duration-200">
                                <Card className={`relative shadow-md rounded-xl overflow-hidden border mb-2 ${isLocked ? 'opacity-60' : ''}`}>
                                  <div className="flex flex-col sm:flex-row items-stretch">
                                    {/* Image or Avatar */}
                                    {module.image ? (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 relative">
                                        <img src={module.image.startsWith('http') ? module.image : `http://10.80.4.72${module.image}`} alt={moduleName + ' image'} className="object-cover w-full h-full rounded-r-xl" loading="lazy" />
                                      </div>
                                    ) : (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-r-xl">
                                        <span className="text-4xl font-bold text-primary/70 dark:text-primary/80">{moduleName?.charAt(0).toUpperCase()}</span>
                                      </div>
                                    )}
                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col justify-between p-4 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <h3 className="text-lg font-semibold truncate" title={moduleName}>{moduleName}</h3>
                                        {module.description && <p className="text-sm text-muted-foreground truncate" title={module.description}>{module.description}</p>}
                                      </div>
                                      {/* Meta */}
                                      <div className="flex flex-col gap-1 mt-2">
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
                      {sortedModules.filter((m: any) => m.progress?.status === 'Completed').length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8">
                          <Lottie animationData={emptyAnimation} loop style={{ width: 120, height: 120 }} />
                          <div className="mt-4 text-muted-foreground">No completed modules yet.</div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sortedModules.filter((m: any) => m.progress?.status === 'Completed').map((module: any, idx: number) => {
                            const { isLocked, lockReason } = getLockState(module, sortedModules);
                            const progress = module.progress?.progress || 0;
                            const isMissed = false; // Completed modules are not missed
                            return (
                              <motion.div key={module.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="transition-all duration-200">
                                <Card className={`relative shadow-md rounded-xl overflow-hidden border mb-2 ${isLocked ? 'opacity-60' : ''}`}>
                                  <div className="flex flex-col sm:flex-row items-stretch">
                                    {/* Image or Avatar */}
                                    {module.image ? (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 relative">
                                        <img src={module.image.startsWith('http') ? module.image : `http://10.80.4.72${module.image}`} alt={module.name1 + ' image'} className="object-cover w-full h-full rounded-r-xl" loading="lazy" />
                                      </div>
                                    ) : (
                                      <div className="w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 flex items-center justify-center bg-primary/10 dark:bg-primary/20 rounded-r-xl">
                                        <span className="text-4xl font-bold text-primary/70 dark:text-primary/80">{module.name1?.charAt(0).toUpperCase()}</span>
                                      </div>
                                    )}
                                    {/* Main Content */}
                                    <div className="flex-1 flex flex-col justify-between p-4 gap-2">
                                      <div className="flex flex-col gap-1">
                                        <h3 className="text-lg font-semibold truncate" title={module.name1}>{module.name1}</h3>
                                        {module.description && <p className="text-sm text-muted-foreground truncate" title={module.description}>{module.description}</p>}
                                      </div>
                                      {/* Progress and Meta */}
                                      <div className="flex flex-col gap-1 mt-2">
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">Progress</span>
                                          <span className="font-semibold text-base">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" aria-label={`Progress: ${progress}%`} />
                                        {module.status === "Completed" && module.last_accessed && (
                                          <span className="text-xs text-green-700 dark:text-green-400 mt-1">Completed on {new Date(module.last_accessed).toLocaleDateString()}</span>
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
                                            aria-label={`Resume module: ${module.name1}`}
                                          >
                                            Resume
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
                      let inProgressModules = DeadlineData.message.filter(
                        (item: any) => item.progress && item.progress.status === "In Progress"
                      );
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
                      let notStartedModules = DeadlineData.message.filter(
                        (item: any) => !item.progress
                      );
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