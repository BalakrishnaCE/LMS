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
import React, { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { useNavigation } from "@/contexts/NavigationContext"
import { ROUTES, LMS_API_BASE_URL } from "@/config/routes"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { useLearnerModuleData, useLearnerDashboard } from "@/lib/api"
import { CheckCircle, Clock, ChevronDown, ChevronUp, Calendar, AlertTriangle, BookOpen, Target, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

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

export function LearnerModules({ itemsPerPage = 8 }: ModulesProps) {
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState(() => {
        return localStorage.getItem('learner_modules_search') || ""
    })
    const { user } = useUser()
    const { addToHistory, getPreviousSearchState } = useNavigation()
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [modulesWithQuizQA, setModulesWithQuizQA] = useState<Set<string>>(new Set());
    const offset = (page - 1) * itemsPerPage

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
        // Force re-fetch by updating a dependency or using a key
        window.location.reload();
    };

    // Restore search state from navigation history when component mounts
    useEffect(() => {
        const previousSearchState = getPreviousSearchState('learner');
        if (previousSearchState) {
            setSearchQuery(previousSearchState.query);
        }
    }, [getPreviousSearchState]);

    // Track search state changes in navigation history (only when there's actual search activity)
    useEffect(() => {
        // Only track if there's a search query
        const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;
        
        if (hasSearchQuery) {
            // Add a longer delay to ensure we capture the complete search query
            const timeoutId = setTimeout(() => {
                addToHistory('/modules/learner', 'Modules List', {
                    query: searchQuery,
                    department: 'all', // Learner modules don't have department filter
                    status: 'all'      // Learner modules don't have status filter
                });
            }, 1500); // 1500ms delay to wait for user to finish typing
            
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, addToHistory]);


    // Fetch modules with optimized learner API using new API service
    // Use user email or name as fallback - API accepts both
    const userIdentifier = user?.email || user?.name || "";
    const shouldCallAPI = !!userIdentifier;
    
    // Debug logging
    useEffect(() => {
        console.log('🔍 LearnerModules - User state:', {
            user,
            userEmail: user?.email,
            userName: user?.name,
            userIdentifier,
            shouldCallAPI
        });
    }, [user, userIdentifier, shouldCallAPI]);
    
    const { data, error, isLoading: apiLoading } = useLearnerModuleData(userIdentifier, {
        limit: itemsPerPage,
        offset,
    }, { 
        enabled: shouldCallAPI && userIdentifier.trim() !== ""
    })
    
    // Also fetch from learner dashboard API as fallback (filters for published modules)
    const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useLearnerDashboard(
        userIdentifier, 
        { enabled: shouldCallAPI && userIdentifier.trim() !== "" }
    )
    
    // Debug API response
    useEffect(() => {
        if (data) {
            console.log('🔍 LearnerModules - API Response:', {
                hasData: !!data,
                dataKeys: Object.keys(data || {}),
                hasMessage: !!data?.message,
                hasMessageModules: !!data?.message?.modules,
                hasDirectModules: !!data?.modules,
                modulesCount: data?.modules?.length || data?.message?.modules?.length || 0,
                modules: data?.modules || data?.message?.modules,
                meta: data?.meta || data?.message?.meta,
                error: data?.error
            });
        }
        if (error) {
            console.error('❌ LearnerModules - API Error:', error);
        }
    }, [data, error]);
    
    // Extract modules and meta - match dashboard logic to handle different response formats
    // Prioritize get_learner_dashboard (filters for published modules) over useLearnerModuleData
    let modules: any[] = [];
    let meta: any = {};
    
    // First try to use get_learner_dashboard (filters for published modules) - same as dashboard
    if (dashboardData?.message && Array.isArray(dashboardData.message) && dashboardData.message.length > 0) {
        // Transform the data to match expected format
        modules = dashboardData.message.map((item: any) => ({
            ...item.module,
            progress: item.progress
        }));
        
        // Calculate meta from modules
        meta = {
            total_modules: modules.length,
            completed_modules: modules.filter((m: any) => m.progress?.status === "Completed").length,
            in_progress_modules: modules.filter((m: any) => m.progress?.status === "In Progress").length,
            not_started_modules: modules.filter((m: any) => m.progress?.status === "Not Started").length,
            total_count: modules.length
        };
    } 
    // Fallback to useLearnerModuleData
    else if (data?.message?.modules && Array.isArray(data.message.modules)) {
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
            progress: item.progress
        }));
        // Calculate meta from modules
        meta = {
            total_modules: modules.length,
            completed_modules: modules.filter((m: any) => m.progress?.status === "Completed").length,
            in_progress_modules: modules.filter((m: any) => m.progress?.status === "In Progress").length,
            not_started_modules: modules.filter((m: any) => m.progress?.status === "Not Started").length,
            total_count: modules.length
        };
    }
    
    // Check if modules have the nested structure (module.module, module.progress)
    if (modules.length > 0 && modules[0].module) {
        modules = modules.map((item: any) => ({
            ...item.module,
            progress: item.progress
        }));
    }
    const totalPages = Math.ceil((meta.total_count || 0) / itemsPerPage)

    // Handle search query change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        localStorage.setItem('learner_modules_search', e.target.value);
    };

    // Handle clear search
    const handleClearSearch = () => {
        setSearchQuery("");
        localStorage.removeItem('learner_modules_search');
    };

    // Client-side search (optional: can be moved to backend if needed)
    const filteredModules = useMemo(() => {
        if (!searchQuery) return modules
        return modules.filter((mod: any) =>
            mod.name1?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [modules, searchQuery])

    // Reset to page 1 when search changes
    React.useEffect(() => {
        setPage(1);
    }, [searchQuery]);

    // Check which completed modules have quiz/QA content
    useEffect(() => {
        const checkModulesWithQuizQA = async () => {
            if (!user?.name || modules.length === 0) return;

            const completedModules = modules.filter((m: any) => m.progress?.status === "Completed");
            if (completedModules.length === 0) return;

            try {
                // Fetch all quiz progress for the user
                const quizRes = await fetch(
                    `${LMS_API_BASE_URL}/api/resource/Quiz Progress?filters=[[\"user\",\"=\",\"${user.name}\"]]&fields=[\"module\"]`,
                    { credentials: 'include' }
                );
                const quizProgressList = (await quizRes.json())?.data || [];

                // Fetch all QA progress for the user
                const qaRes = await fetch(
                    `${LMS_API_BASE_URL}/api/resource/Question Answer Progress?filters=[[\"user\",\"=\",\"${user.name}\"]]&fields=[\"module\"]`,
                    { credentials: 'include' }
                );
                const qaProgressList = (await qaRes.json())?.data || [];

                // Create a set of module IDs that have quiz/QA progress
                const modulesWithContent = new Set<string>();
                
                // Add modules that have quiz progress
                quizProgressList.forEach((qp: any) => {
                    if (qp.module) {
                        modulesWithContent.add(qp.module);
                    }
                });

                // Add modules that have QA progress
                qaProgressList.forEach((qap: any) => {
                    if (qap.module) {
                        modulesWithContent.add(qap.module);
                    }
                });

                setModulesWithQuizQA(modulesWithContent);
            } catch (error) {
                console.error('Error checking modules with quiz/QA:', error);
            }
        };

        checkModulesWithQuizQA();
    }, [modules, user?.name]);

    // Sort modules: ordered modules (order > 0) first by order asc, then unordered (order 0 or undefined) in original order
    const sortedModules = useMemo(() => {
        const ordered = filteredModules.filter((m: any) => m.order && m.order > 0).sort((a: any, b: any) => a.order - b.order);
        const unordered = filteredModules.filter((m: any) => !m.order || m.order === 0);
        return [...ordered, ...unordered];
    }, [filteredModules]);

    // Calculate stats using production pattern
    const completedCount = filteredModules.filter((m: any) => m.progress?.status === "Completed").length;
    const inProgressCount = filteredModules.filter((m: any) => m.progress?.status === "In Progress").length;
    const notStartedCount = filteredModules.filter((m: any) => m.progress?.status === "Not Started").length;
    const calculatedAverageProgress = filteredModules.length > 0 
        ? Math.round(filteredModules.reduce((sum: number, m: any) => {
            let progress = m.progress?.overall_progress ?? m.progress?.progress ?? 0;
            
            // If overall_progress is 0 but there are completion details, calculate progress
            if (progress === 0 && m.progress?.completion_details) {
                const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = m.progress.completion_details;
                
                // Try chapter-based progress first
                if (total_lesson_chapter_items > 0) {
                    progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                }
                // Fallback to content-based progress if chapter progress is still 0
                else if (total_content_items > 0) {
                    progress = Math.round((contents_completed / total_content_items) * 100);
                }
            }
            
            return sum + (typeof progress === 'number' && !isNaN(progress) ? progress : 0);
        }, 0) / filteredModules.length)
        : 0;
    
    // Use calculated progress or fallback to meta data
    const averageProgress = calculatedAverageProgress || meta.average_progress || 0;
    


    return (
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

                <motion.div
                    key="search"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="flex gap-4 p-4"
                >
                <div className="flex-1">
                    <Input
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pr-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            type="button"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                </motion.div>
            </AnimatePresence>

            {/* Loading and Error States */}
            {(apiLoading || dashboardLoading) && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-muted-foreground">Loading modules and progress...</div>
                </div>
            )}
            {(error || dashboardError || data?.error) && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-red-500">Error loading modules.</div>
                    {(error?.message || data?.error) && (
                        <div className="mt-2 text-sm text-muted-foreground max-w-md text-center">
                            {error?.message || data?.error || "Unknown error occurred"}
                        </div>
                    )}
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
            {!apiLoading && !dashboardLoading && !error && !dashboardError && !data?.error && sortedModules.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={emptyAnimation} loop style={{ width: 180, height: 180 }} />
                    <div className="mt-4 text-muted-foreground text-lg">
                        {searchQuery 
                            ? `No modules found matching "${searchQuery}". Try a different search.`
                            : "No modules found. You may not be assigned to any modules yet. Please contact your administrator."}
                    </div>
                </div>
            )}
            {!apiLoading && !dashboardLoading && !error && !dashboardError && sortedModules.length > 0 && (
                <motion.div
                    key="grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto p-4"
                >
                    <AnimatePresence>
                {(() => {
                    const pageStart = (page - 1) * itemsPerPage;
                    const pageItems = sortedModules.slice(pageStart, pageStart + itemsPerPage);
                    return pageItems;
                })().map((module: any, idx: number) => {
                    const status = module.progress?.status || "Not Started";
                    
                    // Debug the module progress data structure
                    console.log(`Module ${module.name1} progress data:`, module.progress);
                    console.log(`Module ${module.name1} completion_details:`, module.progress?.completion_details);
                    
                    // Use the progress value from the API, with fallback to completion details
                    let progress = module.progress?.overall_progress ?? module.progress?.progress ?? 0;
                    console.log(`Module ${module.name1} initial progress:`, progress);
                    
                    // If overall_progress is 0 but there are completion details, calculate progress
                    if (progress === 0 && module.progress?.completion_details) {
                        const { chapters_completed, total_lesson_chapter_items, contents_completed, total_content_items } = module.progress.completion_details;
                        
                        // Try chapter-based progress first
                        if (total_lesson_chapter_items > 0) {
                            progress = Math.round((chapters_completed / total_lesson_chapter_items) * 100);
                            console.log(`Module ${module.name1}: Calculated progress from chapters: ${progress}% (${chapters_completed}/${total_lesson_chapter_items} chapters)`);
                        }
                        // Fallback to content-based progress if chapter progress is still 0
                        else if (total_content_items > 0) {
                            progress = Math.round((contents_completed / total_content_items) * 100);
                            console.log(`Module ${module.name1}: Calculated progress from contents: ${progress}% (${contents_completed}/${total_content_items} contents)`);
                        }
                    }
                    
                    // Ensure progress is a number and within valid range, and round it
                    if (typeof progress !== 'number' || isNaN(progress)) {
                        progress = 0;
                    } else {
                        // Round progress to nearest integer
                        progress = Math.round(progress);
                    }
                    
                    // If status is "Completed" but progress is less than 100, use the actual progress
                    // This fixes the issue where completed modules show their actual progress instead of 100%
                    if (status === "Completed" && progress < 100) {
                        // Keep the actual progress value (e.g., 74%)
                        console.log(`Module ${module.name1} is completed but shows ${progress}% progress`);
                    }
                    
                    const isCompleted = status === "Completed";
                    const isInProgress = status === "In Progress";
                    const isNotStarted = status === "Not Started";
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
                            key={module.name || `module-${idx}`}
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
                                            className="absolute inset-0 w-full h-full object-cover"
                                            onError={(e) => {
                                                // If image fails to load, hide it and show fallback
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = `
                                                            <div class="w-full h-44 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30">
                                                                <span class="text-6xl font-semibold text-primary/60 dark:text-primary/70">${module.name1?.charAt(0).toUpperCase()}</span>
                                                            </div>
                                                        `;
                                                }
                                            }}
                                        />
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
                                    {/* Progress Bar and Percentage - Production Pattern */}
                                    <div className="px-6 pb-2">
                                        <div className="flex flex-col space-y-1 text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-semibold text-base">{progress}%</span>
                                        </div>
                                        <Progress value={progress} className="h-2" aria-label={`Progress: ${progress}%`} />
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
                                                    aria-label={isCompleted ? 'Completed' : isInProgress ? 'Resume' : 'Start' + ' ' + module.name1}
                                                    disabled={isLocked}
                                                >
                                                    {isCompleted ? (
                                                        modulesWithQuizQA.has(module.name) ? (
                                                            <>Check Final Score</>
                                                        ) : (
                                                            <>Completed</>
                                                        )
                                                    ) : isInProgress ? (
                                                        <>
                                                            <Clock className="h-5 w-5" />
                                                            Resume
                                                        </>
                                                    ) : (
                                                        <>
                                                            <BookOpen className="h-5 w-5" />
                                                            Start
                                                        </>
                                                    )}
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
                                className={(page >= Math.max(1, Math.ceil(filteredModules.length / itemsPerPage))) ? 'pointer-events-none opacity-50' : ''}
                                aria-label="Next page"
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
} 