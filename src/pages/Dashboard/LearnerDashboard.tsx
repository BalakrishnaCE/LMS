import * as React from "react"
import { useState } from "react"
import { useUser } from "@/hooks/use-user"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link } from "wouter"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, Award, ChevronRight, Flame, Calendar, Star, Target } from "lucide-react"
import { ROUTES } from "@/config/routes"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';

interface Module {
  name: string;
  name1: string;
  description: string;
  progress: number;
  total_lessons: number;
  completed_lessons: number;
  last_accessed: string;
}

interface LearnerStats {
  total_modules: number;
  completed_modules: number;
  in_progress_modules: number;
  average_progress: number;
  learning_streak: number;
  total_achievements: number;
  upcoming_deadlines: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: string;
}

interface Deadline {
  id: string;
  title: string;
  due_date: string;
  module_name: string;
}

// Dummy data for development
const dummyModules: Module[] = [
  {
    name: "module1",
    name1: "Introduction to Programming",
    description: "Learn the basics of programming with Python",
    progress: 75,
    total_lessons: 12,
    completed_lessons: 9,
    last_accessed: "2024-03-20 14:30:00"
  },
  {
    name: "module2",
    name1: "Web Development Fundamentals",
    description: "Master HTML, CSS, and JavaScript basics",
    progress: 30,
    total_lessons: 15,
    completed_lessons: 4,
    last_accessed: "2024-03-19 10:15:00"
  },
  {
    name: "module3",
    name1: "Database Management",
    description: "Understanding SQL and database design",
    progress: 100,
    total_lessons: 10,
    completed_lessons: 10,
    last_accessed: "2024-03-18 16:45:00"
  }
];

const dummyStats: LearnerStats = {
  total_modules: 3,
  completed_modules: 1,
  in_progress_modules: 2,
  average_progress: 68,
  learning_streak: 5,
  total_achievements: 8,
  upcoming_deadlines: 2
};

const dummyAchievements: Achievement[] = [
  {
    id: "1",
    title: "Quick Learner",
    description: "Completed 5 lessons in one day",
    date: "2024-03-20",
    icon: "🚀"
  },
  {
    id: "2",
    title: "Perfect Score",
    description: "Achieved 100% in a quiz",
    date: "2024-03-19",
    icon: "🎯"
  }
];

const dummyDeadlines: Deadline[] = [
  {
    id: "1",
    title: "Final Project Submission",
    due_date: "2024-03-25",
    module_name: "Web Development Fundamentals"
  },
  {
    id: "2",
    title: "Database Design Assignment",
    due_date: "2024-03-28",
    module_name: "Database Management"
  }
];

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

export default function LearnerDashboard() {
  const { user, isLoading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState("current")
  const [isLoading, setIsLoading] = useState(true)

  // Using dummy data instead of API call
  const modules = dummyModules;
  const stats = dummyStats;
  const achievements = dummyAchievements;
  const deadlines = dummyDeadlines;

  React.useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="flex flex-1 flex-col">
      <AnimatePresence mode="wait">
        {(isLoading || userLoading) ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center flex justify-center items-center h-full"
          >
            <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
            <div className="mt-4 text-muted-foreground">Loading dashboard...</div>
          </motion.div>
        ) : (
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
                  <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.learning_streak} days</div>
                  <p className="text-xs text-muted-foreground">Keep it up!</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                  <Star className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_achievements}</div>
                  <p className="text-xs text-muted-foreground">Earned badges</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
                  <Calendar className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.upcoming_deadlines}</div>
                  <p className="text-xs text-muted-foreground">Tasks due soon</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                  <Target className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(stats.average_progress)}%</div>
                  <Progress value={stats.average_progress} className="h-2 mt-2" />
                </CardContent>
              </Card>
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
              {/* Current Modules */}
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Learning Journey</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="current">Current Modules</TabsTrigger>
                        <TabsTrigger value="completed">Completed Modules</TabsTrigger>
                      </TabsList>
                      <TabsContent value="current" className="mt-4">
                        <div className="grid gap-4">
                          {modules
                            .filter(module => module.progress < 100)
                            .map((module, index) => (
                              <motion.div
                                key={module.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Card>
                                  <CardContent className="p-6">
                                    <div className="flex flex-col gap-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="text-lg font-semibold">{module.name1}</h3>
                                          <p className="text-sm text-muted-foreground">{module.description}</p>
                                        </div>
                                        <Link href={ROUTES.LEARNER_MODULE_DETAIL(module.name)}>
                                          <Button variant="ghost" className="w-full justify-start">
                                            <div className="flex items-center gap-4 w-full">
                                              <div className="flex-1">
                                                <h3 className="font-medium">{module.name1}</h3>
                                                <p className="text-sm text-muted-foreground">{module.description}</p>
                                                <div className="mt-2">
                                                  <div className="flex justify-between text-sm mb-1">
                                                    <span>Progress</span>
                                                    <span>{module.progress}%</span>
                                                  </div>
                                                  <Progress value={module.progress} className="h-2" />
                                                </div>
                                              </div>
                                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                          </Button>
                                        </Link>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                          <span>{module.completed_lessons} of {module.total_lessons} lessons completed</span>
                                          <span>Last accessed: {new Date(module.last_accessed).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="completed" className="mt-4">
                        <div className="grid gap-4">
                          {modules
                            .filter(module => module.progress === 100)
                            .map((module, index) => (
                              <motion.div
                                key={module.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Card>
                                  <CardContent className="p-6">
                                    <div className="flex flex-col gap-4">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h3 className="text-lg font-semibold">{module.name1}</h3>
                                          <p className="text-sm text-muted-foreground">{module.description}</p>
                                        </div>
                                        <Link href={ROUTES.LEARNER_MODULE_DETAIL(module.name)}>
                                          <Button variant="ghost" className="w-full justify-start">
                                            <div className="flex items-center gap-4 w-full">
                                              <div className="flex-1">
                                                <h3 className="font-medium">{module.name1}</h3>
                                                <p className="text-sm text-muted-foreground">{module.description}</p>
                                                <div className="mt-2">
                                                  <div className="flex justify-between text-sm mb-1">
                                                    <span>Progress</span>
                                                    <span>{module.progress}%</span>
                                                  </div>
                                                  <Progress value={module.progress} className="h-2" />
                                                </div>
                                              </div>
                                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                          </Button>
                                        </Link>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                          <span>Completed on {new Date(module.last_accessed).toLocaleDateString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Sidebar */}
              <motion.div variants={itemVariants} className="space-y-4">
                {/* Upcoming Deadlines */}
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Deadlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {deadlines.map((deadline) => (
                        <div key={deadline.id} className="flex items-start gap-4">
                          <Calendar className="h-5 w-5 text-red-500 mt-1" />
                          <div>
                            <h4 className="font-medium">{deadline.title}</h4>
                            <p className="text-sm text-muted-foreground">{deadline.module_name}</p>
                            <p className="text-sm text-red-500">Due: {new Date(deadline.due_date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {achievements.map((achievement) => (
                        <div key={achievement.id} className="flex items-start gap-4">
                          <span className="text-2xl">{achievement.icon}</span>
                          <div>
                            <h4 className="font-medium">{achievement.title}</h4>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            <p className="text-xs text-muted-foreground">Earned on {new Date(achievement.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 