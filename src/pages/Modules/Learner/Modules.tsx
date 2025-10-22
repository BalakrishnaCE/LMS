import {
    Card,
    CardContent,
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
import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { ROUTES, LMS_API_BASE_URL } from "@/config/routes"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Progress } from "@/components/ui/progress"
import { useFrappeGetCall } from "frappe-react-sdk"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle, Clock, MinusCircle, ChevronDown, ChevronUp, Calendar, AlertTriangle } from 'lucide-react';
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { toast } from "sonner";

interface ModulesProps {
    itemsPerPage?: number;
}

const STATUS_COLORS = {
    "Completed": "var(--accent)",
    "In Progress": "var(--primary)",
    "Not Started": "var(--muted)"
};

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
    const [searchQuery, setSearchQuery] = useState("")
    const { user } = useUser()
    const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

    const offset = (page - 1) * itemsPerPage

    // Fetch modules with optimized learner API using frappe-react-sdk
    const { data, error, isLoading } = useFrappeGetCall<any>("novel_lms.novel_lms.api.module_management.LearnerModuleData", {
        user: user?.email,
        limit: itemsPerPage,
        offset,
    })

    const modules = data?.data?.modules || []
    const meta = data?.data?.meta || {}
    const totalPages = Math.ceil((meta.total_count || 0) / itemsPerPage)

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

    // Calculate stats and average progress on the frontend for reliability
    const completedCount = filteredModules.filter((m: any) => m.progress?.status === "Completed").length;
    const inProgressCount = filteredModules.filter((m: any) => m.progress?.status === "In Progress").length;
    const notStartedCount = filteredModules.filter((m: any) => !m.progress || m.progress.status === "Not Started").length;
    const progressValues = filteredModules.map((m: any) => {
        if (m.progress?.status === "Completed") return 100;
        if (m.progress?.status === "In Progress") return m.progress?.progress || 0;
        return 0;
    });
    const averageProgress = progressValues.length > 0 ? (progressValues.reduce((a: number, b: number) => a + b, 0) / progressValues.length) : 0;

    // Bar chart data for status breakdown (frontend counts)
    const barData = [
        { name: "Completed", value: completedCount, color: '#22c55e', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
        { name: "In Progress", value: inProgressCount, color: '#0ea5e9', icon: <Clock className="w-5 h-5 text-blue-500" /> },
        { name: "Yet to Start", value: notStartedCount, color: '#9ca3af', icon: <MinusCircle className="w-5 h-5 text-gray-400" /> },
    ];
    const filteredBarData = barData.filter(d => d.value > 0);

    const [colors, setColors] = useState({
        primary: '#0ea5e9', // fallback Tailwind blue-500
        published: '#22c55e', // fallback Tailwind green-500 for published/completed
        draft: '#9ca3af',    // Tailwind gray-400 for draft/yet to start
        pending: '#f59e0b'   // Tailwind amber-500 for approval pending
    });

    useEffect(() => {
        setColors({
            primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#0ea5e9',
            published: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#22c55e',
            draft: '#9ca3af',
            pending: '#f59e0b'
        });
    }, []);

    // Custom Tooltip for clarity
    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white rounded shadow px-3 py-2 text-xs text-foreground border border-border">
                    <span className="font-semibold">{payload[0].name}:</span> {payload[0].value}
                </div>
            );
        }
        return null;
    };

    // Donut chart data for status breakdown (from meta)
    const donutChartData = [
        { name: "Completed", value: meta.completed_modules || 0, color: "#22c55e" },
        { name: "In Progress", value: meta.in_progress_modules || 0, color: "#0ea5e9" },
        { name: "Yet to Start", value: meta.not_started_modules || 0, color: "#9ca3af" },
    ];

    return (
        <div className="space-y-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center w-full"
                >
                    <Card className="mx-auto w-full max-w-4xl bg-white/60 dark:bg-white/10 backdrop-blur-md shadow-2xl rounded-3xl p-6 md:p-10 flex flex-col gap-6 items-center border border-border">
                        {/* Card Title */}
                        <div className="w-full text-center text-2xl font-extrabold tracking-tight mb-2 text-foreground">Your Learning Stats</div>
                        {/* Stats Row - stack vertically on mobile */}
                        <div className="flex flex-col md:flex-row w-full justify-center items-center gap-6 md:gap-10">
                            {barData.map((stat, idx) => (
                                <div key={stat.name} className="flex flex-col items-center gap-2">
                                    <div className="flex items-center justify-center w-16 h-16 rounded-full shadow-lg" style={{ background: stat.color + '22' }}>
                                        <span className="text-3xl font-extrabold" style={{ color: stat.color }}>{stat.value}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-muted-foreground mt-1 flex items-center gap-1">
                                        {stat.icon}
                                        {stat.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* Multi-segment Donut Chart for Module Status */}
                        <div className="w-full flex flex-col items-center mt-2">
                            <span className="text-xs text-muted-foreground font-medium">Module Status Breakdown</span>
                            <div className="relative flex items-center justify-center w-full" style={{ minHeight: 180 }}>
                                <ResponsiveContainer width={180} height={180}>
                                    <PieChart>
                                        <Pie
                                            data={donutChartData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            labelLine={false}
                                        >
                                            {donutChartData.map((entry, idx) => (
                                                <Cell key={entry.name} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value, name) => [`${value} module${value === 1 ? '' : 's'}`, name]} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center label for average progress */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-bold" style={{ color: '#0ea5e9' }}>{meta.average_progress?.toFixed(2) || '0.00'}%</span>
                                    <span className="text-xs text-muted-foreground">Avg. Progress</span>
                                </div>
                            </div>
                            {/* Legend below chart */}
                            <div className="flex justify-center gap-6 mt-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 rounded" style={{ background: '#22c55e' }} /> Completed
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 rounded" style={{ background: '#0ea5e9' }} /> In Progress
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-4 h-4 rounded" style={{ background: '#9ca3af' }} /> Yet to Start
                                </div>
                            </div>
                        </div>
                    </Card>
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-background border-input"
                        aria-label="Search modules"
                    />
                </div>
                </motion.div>
            </AnimatePresence>

            {/* Loading and Error States */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-muted-foreground">Loading modules...</div>
                </div>
            )}
            {error && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-red-500">Error loading modules.</div>
                </div>
            )}

            {/* Modules Grid */}
            {!isLoading && !error && sortedModules.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8">
                    <Lottie animationData={emptyAnimation} loop style={{ width: 180, height: 180 }} />
                    <div className="mt-4 text-muted-foreground text-lg">No modules found. Try a different search or check back later!</div>
                </div>
            )}
            {!isLoading && !error && sortedModules.length > 0 && (
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
                    
                    // Use the overall_progress from the API response
                    let progress = module.progress?.overall_progress || 0;
                    if (status === "Completed") {
                        progress = 100;
                    }
                    
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