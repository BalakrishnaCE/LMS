import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "wouter"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { ROUTES, LMS_API_BASE_URL } from "@/config/routes"
import { Progress } from "@/components/ui/progress"
import { useFrappeGetCall } from "frappe-react-sdk"
import { CheckCircle, Clock, ChevronDown, ChevronUp, Calendar, AlertTriangle, BookOpen, Target } from 'lucide-react';
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ModulesProps {
    itemsPerPage?: number;
}


// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
}
const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export function LearnerModules({ itemsPerPage = 20 }: ModulesProps) {
    const [page, setPage] = useState(1)
    const [searchQuery] = useState("")
    const { user } = useUser()
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    // Note: offset not needed for dashboard API as it returns all modules

    // Debug logging for user and API parameters
    console.log('User object:', user);
    console.log('User email:', user?.email);
    console.log('API call parameters:', {
        user: user?.email,
    });

    // Fetch modules using the working API (has proper structure generation)
    const { data, error, isLoading, mutate } = useFrappeGetCall<any>("novel_lms.novel_lms.api.module_management.LearnerModuleData", {
        user: user?.email,
        limit: itemsPerPage,
        offset: 0,
    })

    // Fetch progress data separately from dashboard API (real-time, no cache)
    const { data: progressData, isLoading: progressLoading } = useFrappeGetCall<any>("novel_lms.novel_lms.api.progress_tracking.get_learner_dashboard", {
        user: user?.email,
    }, {
        enabled: !!user?.email,
    })

    // Create progress map from dashboard API (real-time progress data)
    const progressMap = React.useMemo(() => {
        const map: { [key: string]: any } = {};
        if (progressData?.message && Array.isArray(progressData.message)) {
            progressData.message.forEach((item: any) => {
                if (item.module && item.progress) {
                    map[item.module.name] = item.progress;
                }
            });
        }
        console.log('Progress map from dashboard:', map);
        return map;
    }, [progressData]);

    // Transform data to match expected format (working API structure)
    const modules = React.useMemo(() => {
        if (!data?.message?.message?.modules) {
            return [];
        }
        const transformedModules = data.message.message.modules.map((module: any) => ({
            ...module,
            // Override progress with real-time data from dashboard API
            progress: progressMap[module.name] || module.progress
        }));
        
        // Debug logging
        console.log('Raw API response:', data);
        console.log('Transformed modules:', transformedModules);
        if (transformedModules.length > 0) {
            console.log('First module structure:', transformedModules[0].structure);
            console.log('First module progress:', transformedModules[0].progress);
        }
        
        return transformedModules;
    }, [data, progressMap]);
    
    // Calculate meta from modules (use API meta or calculate from modules)
    const meta = React.useMemo(() => {
        // Use API meta if available, otherwise calculate from modules
        if (data?.message?.message?.meta) {
            return data.message.message.meta;
        }
        
        if (!modules || modules.length === 0) {
            return {
                total_modules: 0,
                completed_modules: 0,
                in_progress_modules: 0,
                not_started_modules: 0,
                average_progress: 0,
                total_count: 0,
                total: 0
            };
        }
        
        return {
            total_modules: modules.length,
            completed_modules: modules.filter((m: any) => m.progress?.status === "Completed").length,
            in_progress_modules: modules.filter((m: any) => m.progress?.status === "In Progress").length,
            not_started_modules: modules.filter((m: any) => m.progress?.status === "Not Started").length,
            average_progress: modules.length > 0 ? 
                Math.round(modules.reduce((sum: number, m: any) => sum + Math.round(m.progress?.progress || 0), 0) / modules.length) : 0,
            total_count: modules.length,
            total: modules.length
        };
    }, [modules, data]);
    
    const totalPages = Math.ceil((meta.total_count || 0) / itemsPerPage)

    // Retry function for failed API calls
    const handleRetry = React.useCallback(() => {
        setRetryCount(prev => prev + 1);
        mutate();
    }, [mutate]);

    // Auto-retry on error (max 3 times)
    React.useEffect(() => {
        if (error) {
            console.log('API Error:', error);
            console.log('Error details:', JSON.stringify(error, null, 2));
        }
        if (error && retryCount < 3) {
            const timer = setTimeout(() => {
                handleRetry();
            }, 1000 * (retryCount + 1)); // Exponential backoff
            return () => clearTimeout(timer);
        }
    }, [error, retryCount, handleRetry]);

    // Client-side search (optional: can be moved to backend if needed)
    const filteredModules = useMemo(() => {
        if (!searchQuery) return modules
        return modules.filter((mod: any) =>
            mod.name1?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [modules, searchQuery])

    // Sort modules: ordered modules (order > 0) first by order asc, then unordered (order 0 or undefined) in original order
    const sortedModules = useMemo(() => {
        const ordered = filteredModules.filter((m: any) => m.order && m.order > 0).sort((a: any, b: any) => a.order - b.order);
        const unordered = filteredModules.filter((m: any) => !m.order || m.order === 0);
        return [...ordered, ...unordered];
    }, [filteredModules]);

    // Calculate stats using the same logic as dashboard
    const completedCount = filteredModules.filter((m: any) => m.progress?.status === "Completed").length;
    const inProgressCount = filteredModules.filter((m: any) => m.progress?.status === "In Progress").length;
    const notStartedCount = filteredModules.filter((m: any) => m.progress?.status === "Not Started").length;

    // Use progress from dashboard API (real-time data)
    const calculatedAverageProgress = filteredModules.length > 0 
        ? Math.round(filteredModules.reduce((sum: number, m: any) => {
            return sum + Math.round(m.progress?.progress || 0);
        }, 0) / filteredModules.length)
        : 0;

    // Use calculated progress or fallback to meta data
    const averageProgress = calculatedAverageProgress || meta.average_progress || 0;



    return (
        <div className="space-y-6">
            <div className="space-y-6">
                <AnimatePresence>
                <motion.div
                    key="stats"
                        initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-card to-card/80 border border-border rounded-xl p-6 shadow-lg backdrop-blur-sm"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Title and Description */}
                            <div className="space-y-2">
                                <motion.h1 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                                    className="text-3xl font-bold text-foreground"
                                >
                                    Available Modules
                                </motion.h1>
                                <motion.p 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                    className="text-muted-foreground"
                                >
                                    Browse and enroll in modules to start your learning journey
                                </motion.p>
                            </div>
                            
                            {/* Enhanced Animated Stats */}
                            <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                                {/* Completed Modules */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 px-4 py-2 rounded-lg border border-green-200 dark:border-green-800"
                                >
                                    <motion.div 
                                        className="w-4 h-4 flex items-center justify-center"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </motion.div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                            {completedCount}
                                        </span>
                                        <span className="text-xs text-green-600 dark:text-green-500">Completed</span>
                                    </div>
                                </motion.div>

                                {/* In Progress Modules */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800"
                                >
                                    <motion.div 
                                        className="w-4 h-4 flex items-center justify-center"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    >
                                        <Clock className="w-4 h-4 text-blue-500" />
                                    </motion.div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                                            {inProgressCount}
                                        </span>
                                        <span className="text-xs text-blue-600 dark:text-blue-500">In Progress</span>
                                    </div>
                                </motion.div>

                                {/* Available Modules */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-950/30 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800"
                                >
                                    <motion.div 
                                        className="w-4 h-4 flex items-center justify-center"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    >
                                        <BookOpen className="w-4 h-4 text-gray-500" />
                                    </motion.div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-400">
                                            {notStartedCount}
                                        </span>
                                        <span className="text-xs text-gray-600 dark:text-gray-500">Available</span>
                                    </div>
                                </motion.div>

                                {/* Average Progress */}
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                    className="flex items-center gap-3 bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-lg border border-primary/20 dark:border-primary/30"
                                >
                                    <motion.div 
                                        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
                                        animate={{ rotate: [0, 360] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Target className="w-4 h-4 text-primary-foreground" />
                                    </motion.div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-primary">
                                            {Math.round(averageProgress)}%
                                    </span>
                                        <span className="text-xs text-primary/70">Avg Progress</span>
                                    </div>
                                </motion.div>
                                </div>
                        </div>

                        {/* Enhanced Progress Bar for Overall Completion */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="mt-4"
                        >
                            <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                                <span className="font-medium">Overall Progress</span>
                                <span className="font-semibold text-foreground">
                                    {averageProgress}% Complete
                                </span>
                            </div>
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-full bg-gray-200/60 dark:bg-gray-700/60 rounded-xl h-3 overflow-hidden shadow-inner border border-gray-300/20 dark:border-gray-600/20 cursor-pointer transition-all duration-200 hover:shadow-md">
                                            <motion.div 
                                                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-xl relative shadow-lg"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${averageProgress}%` }}
                                                transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                                                style={{
                                                    boxShadow: '0 0 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                                }}
                                            >
                                                {/* Subtle shine effect */}
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-xl" />
                                            </motion.div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="bg-card border border-border shadow-lg">
                                        <div className="space-y-2 p-2">
                                            <div className="text-sm font-semibold text-foreground">Progress Breakdown</div>
                                            <div className="space-y-1 text-xs">
                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                                    <span className="text-muted-foreground">Completed:</span>
                                                    <span className="font-medium text-green-600 dark:text-green-400">{meta.completed_modules || 0} modules</span>
                                </div>
                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-blue-500" />
                                                    <span className="text-muted-foreground">In Progress:</span>
                                                    <span className="font-medium text-blue-600 dark:text-blue-400">{meta.in_progress_modules || 0} modules</span>
                                </div>
                                <div className="flex items-center gap-2">
                                                    <BookOpen className="w-3 h-3 text-gray-500" />
                                                    <span className="text-muted-foreground">Available:</span>
                                                    <span className="font-medium text-gray-600 dark:text-gray-400">{meta.not_started_modules || 0} modules</span>
                                                </div>
                                                <div className="pt-1 border-t border-border">
                                                    <div className="flex items-center gap-2">
                                                        <Target className="w-3 h-3 text-primary" />
                                                        <span className="text-muted-foreground">Total:</span>
                                                        <span className="font-medium text-foreground">{meta.total || filteredModules.length || 0} modules</span>
                                                    </div>
                                </div>
                            </div>
                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                </motion.div>
                </motion.div>
            </AnimatePresence>
            </div>

            {/* Loading and Error States */}
            {(isLoading || progressLoading) && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-muted-foreground">Loading modules and progress...</div>
                </div>
            )}
            {error && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-red-500">Error loading modules.</div>
                    {retryCount < 3 && (
                        <button 
                            onClick={handleRetry}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Retry ({retryCount}/3)
                        </button>
                    )}
                    {retryCount >= 3 && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            Failed to load after 3 attempts. Please refresh the page.
                        </div>
                    )}
                </div>
            )}

            {/* Modules Grid */}
            {!isLoading && !progressLoading && !error && (!data || sortedModules.length === 0) && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={emptyAnimation} loop style={{ width: 180, height: 180 }} />
                    <div className="mt-4 text-muted-foreground text-lg">
                        {!data ? "Loading modules..." : "No modules found. Try a different search or check back later!"}
                    </div>
                </div>
            )}
            {!isLoading && !progressLoading && !error && data && sortedModules.length > 0 && (
                <motion.div
                    key="grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto p-4"
                >
                    <AnimatePresence>
                {sortedModules.map((module: any, idx: number) => {
                    const status = module.progress?.status || "Not Started";
                    
                    // Use progress from dashboard API (real-time data)
                    const progress = Math.round(module.progress?.progress || 0);
                    
                    const isCompleted = status === "Completed";
                    const isInProgress = status === "In Progress";
                    const isNotStarted = status === "Not Started";
                    let buttonText = "Start";
                    if (isInProgress) buttonText = "Continue";
                    if (isCompleted) buttonText = "Completed";
                    const hasImage = !!module.image;

                    // Locking logic
                    let isLocked = false;
                    let lockReason = "";
                    if (module.assignment_based === "Department" && module.order && module.order > 0) {
                        // Find all department-ordered modules
                        const deptOrdered = sortedModules.filter((m: any) => m.assignment_based === "Department" && m.order && m.order > 0);
                        // Find all previous modules (lower order)
                        const previous = deptOrdered.filter((m: any) => m.order < module.order);
                        // If any previous is not completed, lock this module
                        if (previous.some((m: any) => m.progress?.status !== "Completed")) {
                            isLocked = true;
                            lockReason = "Complete previous modules to unlock this module.";
                        }
                    }
                    // Unordered or Everyone/Manual modules are never locked

                    // Status bar color logic
                    let statusColor = "bg-gray-200 text-gray-700";
                    if (isCompleted) statusColor = "bg-green-100 text-green-700";
                    else if (isInProgress) statusColor = "bg-blue-100 text-blue-700";
                    else if (isNotStarted) statusColor = "bg-gray-200 text-gray-700";

                    let statusDarkColor = "dark:bg-gray-800 dark:text-gray-300";
                    if (isCompleted) statusDarkColor = "dark:bg-green-900 dark:text-green-300";
                    else if (isInProgress) statusDarkColor = "dark:bg-blue-900 dark:text-blue-200";
                    else if (isNotStarted) statusDarkColor = "dark:bg-gray-800 dark:text-gray-300";

                    // Utility: robustly check if module has Quiz/QA
                    const hasQuizQA = (
                        (module.contents && module.contents.length > 0 && module.contents.some((c: any) => c.content_type === "Quiz" || c.content_type === "Question Answer")) ||
                        (module.structure && module.structure.lessons && module.structure.lessons.some((lesson: any) =>
                            lesson.chapters && lesson.chapters.some((chapter: any) => {
                                const ct = chapter.content_types || {};
                                return (ct["Quiz"] > 0 || ct["Question Answer"] > 0);
                            })
                        ))
                    );

                    // Enhanced status/date logic
                    const completedOn = module.progress?.completed_on ? new Date(module.progress.completed_on) : null;
                    const startedOn = module.progress?.started_on ? new Date(module.progress.started_on) : null;
                    const dueDate = startedOn && module.duration ? new Date(startedOn.getTime() + module.duration * 24 * 60 * 60 * 1000) : null;
                    const now = new Date();
                    let daysLeft = null;
                    let isOverdue = false;
                    if (dueDate) {
                        const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        daysLeft = diff;
                        isOverdue = diff < 0;
                    }
                    // Lessons/Chapters summary
                    const lessonCount = module.structure?.summary?.lesson_count || 0;
                    const chapterCount = module.structure?.summary?.chapter_count || 0;

                    return (
                        <motion.div
                            key={module.name}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            whileHover={{ scale: 1.04, boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)" }}
                            className="h-full"
                        >
                            <Card className={`relative h-full shadow-2xl rounded-2xl overflow-hidden border-0 !pt-0 !py-0 flex flex-col`}>
                                {/* Status Bar */}
                                <div className={`w-full h-8 flex items-center justify-center text-sm font-medium ${statusColor} ${statusDarkColor} z-10`} style={{ position: 'absolute', top: 0, left: 0 }}>
                                    {isCompleted && (
                                        <span className="flex items-center gap-1 text-green-700 dark:text-green-300"><CheckCircle className="h-4 w-4" /> Completed{completedOn && <span className="ml-2 text-xs">on {completedOn.toLocaleDateString()}</span>}</span>
                                    )}
                                    {isInProgress && !isOverdue && (
                                        <span className="flex items-center gap-1 text-blue-700 dark:text-blue-200"><Clock className="h-4 w-4" /> Time Left: {daysLeft} days{startedOn && <span className="ml-2 text-xs">Started: {startedOn.toLocaleDateString()}</span>}</span>
                                    )}
                                    {isInProgress && isOverdue && (
                                        <span className="flex items-center gap-1 text-orange-700 dark:text-orange-300"><AlertTriangle className="h-4 w-4" /> Overdue by {Math.abs(daysLeft ?? 0)} days{startedOn && <span className="ml-2 text-xs">Started: {startedOn.toLocaleDateString()}</span>}</span>
                                    )}
                                    {isNotStarted && (
                                        <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-4 w-4" /> Duration: {module.duration || '-'} days</span>
                                    )}
                                </div>
                                {/* Image or Letter Avatar */}
                                {hasImage ? (
                                    <div className="w-full h-44 relative" style={{ marginTop: '2rem' }}>
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${module.image.startsWith('http') ? module.image : `${LMS_API_BASE_URL}${module.image}`})` }} />
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
                                    </div>
                                ) : (
                                    <div className="w-full h-44 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30" style={{ marginTop: '2rem' }}>
                                        <span className="text-6xl font-semibold text-primary/60 dark:text-primary/70">
                                            {module.name1?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                {/* Module Name and Progress */}
                                <div className="flex-1 flex flex-col justify-between">
                                    <CardHeader className="pb-2 pt-6 text-center">
                                        <CardTitle className="text-lg font-bold">
                                            {module.name1}
                                        </CardTitle>
                                    </CardHeader>
                                    {/* Progress Bar and Percentage */}
                                    <div className="px-6 pb-2">
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-semibold text-base">{Number(progress ?? 0)}%</span>
                                        </div>
                                        <Progress value={Number(progress ?? 0)} className="h-3" aria-label={`Progress: ${Number(progress ?? 0)}%`} />
                                    </div>
                                    {/* Expandable Summary Section */}
                                    <div className="px-6 pb-2">
                                        <button
                                            className="flex items-center gap-2 text-sm text-primary hover:underline focus:outline-none"
                                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                            aria-expanded={expandedIdx === idx}
                                            aria-controls={`summary-${module.name}`}
                                        >
                                            {expandedIdx === idx ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            Summary
                                        </button>
                                        <AnimatePresence>
                                            {expandedIdx === idx && (
                                                <motion.div
                                                    id={`summary-${module.name}`}
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1, transition: { duration: 0.05, ease: 'easeInOut' } }}
                                                    exit={{ height: 0, opacity: 0, transition: { duration: 0.05, ease: 'easeInOut' } }}
                                                    className="overflow-hidden mt-2 text-xs text-muted-foreground rounded bg-muted/40 p-2"
                                                >
                                                    <div><span className="font-semibold">{lessonCount}</span> Lessons, <span className="font-semibold">{chapterCount}</span> Chapters</div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <CardFooter className="flex flex-col gap-2 pb-4 px-4">
                                    {isLocked && (
                                            <div className="text-xs text-gray-400 mt-1 text-center">{lockReason}</div>
                                        )}
                                        <div className="flex gap-2 w-full">
                    
                                            <Link
                                                href={isLocked ? '#' : ROUTES.LEARNER_MODULE_DETAIL(module.name)}
                                                className="flex-1"
                                                tabIndex={isLocked ? -1 : 0}
                                                aria-disabled={isLocked}
                                                onClick={e => { if (isLocked) e.preventDefault(); }}
                                            >
                                                <Button
                                                    variant={isCompleted ? "secondary" : isInProgress ? "default" : "outline"}
                                                    className={`w-full text-base font-semibold py-2 rounded-xl shadow-md transition-all duration-200
                                                        hover:bg-primary/90 hover:shadow-lg
                                                        dark:hover:bg-primary/80 dark:hover:shadow-lg hover:text-white
                                                        focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                                                        ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    aria-label={(isCompleted && hasQuizQA ? 'Check Final Score' : buttonText) + ' ' + module.name1}
                                                    disabled={isLocked}
                                                >
                                                    {isCompleted && hasQuizQA ? 'Check Final Score' : buttonText}
                                                </Button>
                                            </Link>
                                        </div>
                                        
                                    </CardFooter>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
                    </AnimatePresence>
                </motion.div>
            )}

            <div className="flex justify-center mt-8">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => setPage(page - 1)}
                                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                                aria-label="Previous page"
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink>{page}</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => setPage(page + 1)}
                                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                                aria-label="Next page"
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
} 