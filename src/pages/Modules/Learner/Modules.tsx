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
import { motion } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { ROUTES } from "@/config/routes"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Progress } from "@/components/ui/progress"
import { useFrappeGetCall } from "frappe-react-sdk"

interface ModulesProps {
    itemsPerPage?: number;
}

const STATUS_COLORS = {
    "Completed": "var(--accent)",
    "In Progress": "var(--primary)",
    "Not Started": "var(--muted)"
};

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

    // Pie chart data for status breakdown
    const pieData = [
        { name: "Completed", value: meta.completed_modules || 0 },
        { name: "In Progress", value: meta.in_progress_modules || 0 },
        { name: "Not Started", value: meta.not_started_modules || 0 },
    ]
    const filteredPieData = pieData.filter(d => d.value > 0);

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

    return (
        <div className="space-y-8">
            {/* Stats and Pie Chart Card */}
            <div className="flex justify-center w-full">
                <Card className="flex flex-col md:flex-row items-center gap-8 p-6 shadow-lg rounded-2xl w-full max-w-4xl bg-card">
                    <div className="flex-1 flex flex-col gap-2 text-base text-card-foreground min-w-[180px]">
                        <div className="text-lg font-bold mb-2">Your Learning Stats</div>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Total Modules</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.primary }}>{meta.total_modules ?? 0}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.published }}>{meta.completed_modules ?? 0}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">In Progress</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.primary }}>{meta.in_progress_modules ?? 0}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Yet to Start</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.draft }}>{meta.not_started_modules ?? 0}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Average Progress</h3>
                                <p className="text-2xl font-bold" style={{ color: colors.primary }}>{meta.average_progress ?? 0}%</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-56 h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 24, right: 0, left: 0, bottom: 24 }}>
                                <Pie
                                    data={filteredPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={filteredPieData.length > 1
                                        ? ({ name, percent }) => percent > 0 ? `${name} (${Math.round(percent * 100)}%)` : ''
                                        : undefined
                                    }
                                >
                                    {filteredPieData.map((entry, idx) => (
                                        <Cell key={`cell-${idx}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} layout="horizontal" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            <div className="flex gap-4 p-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-background border-input"
                    />
                </div>
            </div>

            {isLoading && <div className="p-8 text-center">Loading modules...</div>}
            {error && <div className="p-8 text-center text-red-500">Error loading modules.</div>}

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl mx-auto p-4">
                {filteredModules.map((module: any) => {
                    const status = module.progress?.status || "Not Started";
                    const progress = module.progress?.progress || 0;
                    const isCompleted = status === "Completed";
                    const isInProgress = status === "In Progress";
                    const isNotStarted = status === "Not Started";
                    const showScore = isCompleted && module.has_scoring && module.progress?.score != null;
                    let buttonText = "Start";
                    if (isInProgress) buttonText = "Continue";
                    if (isCompleted && module.has_scoring) buttonText = "Results";
                    if (isCompleted && !module.has_scoring) buttonText = "Completed";
                    const hasImage = !!module.image;

                    return (
                        <motion.div
                            key={module.name}
                            whileHover={{ 
                                scale: 1.03,
                                transition: { duration: 0.18 }
                            }}
                            className="h-full"
                        >
                            <Card className={`relative h-full shadow-2xl rounded-2xl overflow-hidden border-0 ${hasImage ? 'min-h-[260px]' : ''} ${hasImage ? 'bg-black' : 'bg-card'}`}>
                                {hasImage && (
                                    <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${module.image.startsWith('http') ? module.image : `http://10.80.4.72${module.image}`})` }}>
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/80 z-10" />
                                    </div>
                                )}
                                <div className={`relative z-20 h-full flex flex-col justify-between ${hasImage ? 'text-white' : ''}`}>
                                    <CardHeader className={`pb-2 ${hasImage ? 'text-white' : ''}`}>
                                        <CardTitle className={`text-2xl font-bold mb-2 ${hasImage ? 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : 'text-card-foreground'}`}>
                                            {module.name1}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 flex flex-col justify-end">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-2 items-center mb-2">
                                                {module.has_scoring ? (
                                                    <Badge variant="outline" className={`${hasImage ? 'border-white text-white bg-white/10' : 'border-accent text-accent-foreground bg-accent/30'}`}>Scored</Badge>
                                                ) : null}
                                                {isCompleted && <Badge variant="secondary" className={`${hasImage ? 'bg-white/80 text-black' : 'bg-accent text-accent-foreground'}`}>Completed</Badge>}
                                                {isInProgress && <Badge variant="outline" className={`${hasImage ? 'border-primary text-primary bg-primary/20' : 'border-primary text-primary-foreground bg-primary/30'}`}>In Progress</Badge>}
                                                {isNotStarted && <Badge variant="outline" className={`${hasImage ? 'border-muted text-muted bg-muted/20' : 'border-muted text-muted-foreground bg-muted/30'}`}>Yet to Start</Badge>}
                                                {showScore && (
                                                    <span className={`ml-2 font-bold ${hasImage ? 'text-white' : 'text-accent'}`}>Score: {module.progress.score}</span>
                                                )}
                                            </div>
                                            {module.has_progress && (
                                                <div className="space-y-2">
                                                    <div className={`flex justify-between text-sm ${hasImage ? 'text-white' : 'text-card-foreground'}`}>
                                                        <span>Progress</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <Progress value={progress} className={`h-3 ${hasImage ? 'bg-white/20' : 'bg-muted'}`} />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex flex-col gap-2 pt-2">
                                        <Link href={ROUTES.LEARNER_MODULE_DETAIL(module.name)} className="w-full">
                                            <Button 
                                                variant={isCompleted ? "secondary" : "default"}
                                                className={`w-full text-lg font-semibold py-2 rounded-xl shadow-md ${hasImage ? 'bg-primary text-white hover:bg-primary/90 border-0' : ''}`}
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
            </div>

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