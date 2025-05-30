import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ROUTES } from "@/config/routes"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Progress } from "@/components/ui/progress"
import { useFrappeGetCall } from "frappe-react-sdk"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CheckCircle, Clock, MinusCircle } from 'lucide-react';

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

    const offset = (page - 1) * itemsPerPage

    // Fetch modules with optimized learner API using frappe-react-sdk
    const { data, error, isLoading } = useFrappeGetCall<any>("LearnerModuleData", {
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

    // Bar chart data for status breakdown
    const barData = [
        { name: "Completed", value: meta.completed_modules || 0, color: '#22c55e', icon: <CheckCircle className="w-5 h-5 text-green-500" /> },
        { name: "In Progress", value: meta.in_progress_modules || 0, color: '#0ea5e9', icon: <Clock className="w-5 h-5 text-blue-500" /> },
        { name: "Yet to Start", value: meta.not_started_modules || 0, color: '#9ca3af', icon: <MinusCircle className="w-5 h-5 text-gray-400" /> },
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
                        {/* Stats Row */}
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
                        {/* Average Progress */}
                        <div className="w-full text-center mt-2">
                            <span className="text-xs text-muted-foreground font-medium">Average Progress</span>
                            <div className="text-2xl font-bold" style={{ color: '#0ea5e9' }}>{meta.average_progress ?? 0}%</div>
                            </div>
                        {/* Bar Chart Below Stats */}
                        <div className="w-full mt-4 rounded-2xl bg-white/80 dark:bg-white/10 border border-border shadow-lg p-4">
                            <ResponsiveContainer width="100%" height={140} initialDimension={{ width: 520, height: 140 }}>
                                <BarChart
                                    data={filteredBarData}
                                    layout="vertical"
                                    margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                                    barCategoryGap={24}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                    <XAxis type="number" allowDecimals={false} hide={filteredBarData.length === 1} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={0} tick={false} axisLine={false} tickLine={false} />
                                    <Tooltip content={CustomTooltip} />
                                    <Bar
                                        dataKey="value"
                                        radius={[12, 12, 12, 12]}
                                        barSize={28}
                                        label={{ position: 'right', fontSize: 15, fill: 'var(--foreground)' }}
                                        isAnimationActive={true}
                                    >
                                        {filteredBarData.map((entry, idx) => (
                                            <Cell key={entry.name} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            </div>
                        <div className="w-full mt-2 flex justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-4 rounded bg-green-500" /> Completed
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-4 rounded bg-blue-500" /> In Progress
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-block w-4 h-4 rounded bg-gray-400" /> Yet to Start
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
                    />
                </div>
                </motion.div>
            </AnimatePresence>

            {/* Loading and Error States */}
            {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center">Loading modules...</motion.div>
            )}
            {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center text-red-500">Error loading modules.</motion.div>}

            {/* Modules Grid */}
            {!isLoading && !error && (
                <motion.div
                    key="grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto p-4"
                >
                    <AnimatePresence>
                {filteredModules.map((module: any) => {
                    const status = module.progress?.status || "Not Started";
                    const progress = module.progress?.progress || 0;
                    const isCompleted = status === "Completed";
                    const isInProgress = status === "In Progress";
                    const isNotStarted = status === "Not Started";
                    let buttonText = "Start";
                    if (isInProgress) buttonText = "Continue";
                    if (isCompleted && module.has_scoring) buttonText = "Results";
                    if (isCompleted && !module.has_scoring) buttonText = "Completed";
                    const hasImage = !!module.image;

                            // Status bar color logic
                            let statusColor = "bg-gray-200 text-gray-700";
                            if (isCompleted) statusColor = "bg-green-100 text-green-700";
                            else if (isInProgress) statusColor = "bg-blue-100 text-blue-700";
                            else if (isNotStarted) statusColor = "bg-gray-200 text-gray-700";

                            let statusDarkColor = "dark:bg-gray-800 dark:text-gray-300";
                            if (isCompleted) statusDarkColor = "dark:bg-green-900 dark:text-green-300";
                            else if (isInProgress) statusDarkColor = "dark:bg-blue-900 dark:text-blue-200";
                            else if (isNotStarted) statusDarkColor = "dark:bg-gray-800 dark:text-gray-300";

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
                                            {status}
                                        </div>
                                        {/* Image or Letter Avatar */}
                                        {hasImage ? (
                                            <div className="w-full h-44 relative" style={{ marginTop: '2rem' }}>
                                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${module.image.startsWith('http') ? module.image : `http://10.80.4.72${module.image}`})` }} />
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
                                                <CardTitle className="text-lg font-bold line-clamp-2">
                                            {module.name1}
                                        </CardTitle>
                                    </CardHeader>
                                            {/* Progress Bar and Percentage */}
                                            <div className="px-6 pb-2">
                                                <div className="flex justify-between items-center text-xs mb-1">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-semibold">{progress}%</span>
                                                </div>
                                                <Progress value={progress} className="h-2" aria-label={`Progress: ${progress}%`} />
                                        </div>
                                            <CardFooter className="flex flex-col gap-2 pb-4 px-4">
                                        <Link href={ROUTES.LEARNER_MODULE_DETAIL(module.name)} className="w-full">
                                            <Button 
                                                variant={isCompleted ? "secondary" : "default"}
                                                        className={
                                                            `w-full text-base font-semibold py-2 rounded-xl shadow-md transition-all duration-200
                                                            hover:bg-primary/90 hover:shadow-lg
                                                            dark:hover:bg-primary/80 dark:hover:shadow-lg
                                                            focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
                                                        }
                                            >
                                                {buttonText}
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </div>
                            </Card>
                        </motion.div>
                    )
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
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationLink>{page}</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => setPage(page + 1)}
                                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    )
} 