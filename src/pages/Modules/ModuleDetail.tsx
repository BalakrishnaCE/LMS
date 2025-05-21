import { useParams, Link } from "wouter"
import { useFrappeGetDoc } from "frappe-react-sdk"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LessonWithChapters } from "@/pages/Modules/LessonwithChapter"
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/hooks/use-user"

// Add custom styles for the content
const contentStyles = `
    .prose ul {
        list-style-type: disc;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose ol {
        list-style-type: decimal;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        overflow-x: auto;
        display: block;
    }
    .prose table th,
    .prose table td {
        border: 1px solid #e2e8f0;
        padding: 0.5em;
        word-break: break-word;
        white-space: normal;
        max-width: 300px;
    }
    .prose table th {
        background-color: #f8fafc;
        font-weight: 600;
    }
`;

interface Lesson {
    lesson: string;
    order: number;
    lessonDetails?: {
        lesson_name: string;
        chapters?: Array<{
            chapter: string;
            order: number;
        }>;
    };
}

interface ModuleLesson {
    lesson: string;
    order: number;
}

export default function ModuleDetail() {
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [enableEditing, setEnableEditing] = useState(false);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [lessonDetails, setLessonDetails] = useState<Record<string, any>>({});
    const [chapterDetailsSidebar, setChapterDetailsSidebar] = useState<Record<string, any>>({});
    const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const params = useParams();
    const moduleName = params.moduleName;

    const { isLMSAdmin, isLMSContentEditor } = useUser();

    useEffect(() => {
        setEnableEditing(isLMSAdmin || isLMSContentEditor);
    }, [isLMSAdmin, isLMSContentEditor]);

    const { data: module, error, isValidating } = useFrappeGetDoc("LMS Module", moduleName, {
        fields: ["name", "name1", "description", "is_published", "image", "lessons", "total_score", "has_scoring", "has_progress"]
    });

    const sortedLessons = useMemo(() => {
        return (module?.lessons || []).sort((a: ModuleLesson, b: ModuleLesson) => a.order - b.order);
    }, [module?.lessons]);

    const currentLesson = sortedLessons[currentLessonIndex];
    const isLastLesson = currentLessonIndex === sortedLessons.length - 1;
    const isFirstLesson = currentLessonIndex === 0;

    // Combine lesson data with their details
    const lessonsWithDetails = useMemo(() => {
        return sortedLessons.map((lesson: ModuleLesson) => ({
            ...lesson,
            lessonDetails: lessonDetails[lesson.lesson]
        }));
    }, [sortedLessons, lessonDetails]);

    // Fetch lesson details when sortedLessons changes
    useEffect(() => {
        const fetchLessonDetails = async () => {
            const details: Record<string, any> = {};
            for (const lesson of sortedLessons) {
                try {
                    const response = await fetch(`http://10.80.4.72/api/resource/Lesson/${lesson.lesson}`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    details[lesson.lesson] = data.data;
                } catch (error) {
                    console.error(`Error fetching lesson ${lesson.lesson}:`, error);
                }
            }
            setLessonDetails(details);
        };

        if (sortedLessons.length > 0) {
            fetchLessonDetails();
        }
    }, [sortedLessons]);

    // Fetch chapter details for the selected lesson
    useEffect(() => {
        let isCurrent = true;
        if (!currentLesson || !currentLesson.lesson) {
            setChapterDetailsSidebar({});
            setActiveChapterId(null);
            return;
        }
        const fetchChapterDetails = async () => {
            const chapters = lessonDetails[currentLesson.lesson]?.chapters;
            if (!chapters) {
                setChapterDetailsSidebar({});
                setActiveChapterId(null);
                return;
            }
            const details: Record<string, any> = {};
            for (const chapter of chapters) {
                try {
                    const response = await fetch(`http://10.80.4.72/api/resource/Chapter/${chapter.chapter}`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (!isCurrent) return;
                    details[chapter.chapter] = data.data;
                } catch (error) {}
            }
            if (isCurrent) setChapterDetailsSidebar(details);
        };
        fetchChapterDetails();
        return () => { isCurrent = false; };
    }, [currentLesson, lessonDetails]);

    // Auto-select first chapter when lessonDetails for selected lesson is loaded
    useEffect(() => {
        if (currentLesson && lessonDetails[currentLesson.lesson]?.chapters?.length > 0) {
            const firstChapter = lessonDetails[currentLesson.lesson].chapters[0];
            setActiveChapter(firstChapter.chapter, 0);
        }
    }, [currentLesson, lessonDetails]);

    // Helper to set both active chapter and selected chapter index
    const setActiveChapter = (chapterId: string, cidx: number | null = null) => {
        setActiveChapterId(chapterId);
        if (cidx !== null) setSelectedChapterIdx(cidx);
    };

    // Sidebar chapter click handler
    const handleChapterClick = (chapterId: string, cidx: number) => {
        setActiveChapter(chapterId, cidx);
    };

    if (error) return <div>Error loading module</div>;
    if (isValidating) return <div>Loading...</div>;
    if (!module) return <div>Module not found</div>;

    const handleNext = () => {
        if (!isLastLesson) {
            setCurrentLessonIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (!isFirstLesson) {
            setCurrentLessonIndex(prev => prev - 1);
        }
    };

    return (
        <div className="flex h-screen bg-background w-full">
            <style>{contentStyles}</style>
            
            {/* Left Sidebar - Fixed Width */}
            <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="w-80 border-r border-border overflow-y-auto bg-card/50 backdrop-blur-sm"
            >
                <div className="p-4 space-y-6">
                    <Link href="/modules" className="inline-block">
                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Modules
                        </Button>
                    </Link>

                    {/* Module Info */}
                    <div className="space-y-4">
                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-xl font-bold"
                        >
                            {module.name1}
                        </motion.h1>
                        
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between text-muted-foreground hover:bg-primary/10"
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            >
                                Description
                                <AnimatePresence mode="wait">
                                    {isDescriptionExpanded ? (
                                        <motion.div
                                            initial={{ rotate: 0 }}
                                            animate={{ rotate: 180 }}
                                            exit={{ rotate: 0 }}
                                        >
                                            <ChevronUp className="h-4 w-4" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            initial={{ rotate: 180 }}
                                            animate={{ rotate: 0 }}
                                            exit={{ rotate: 180 }}
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                            <AnimatePresence>
                                {isDescriptionExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: module.description || "" }} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {module.has_progress == 1 && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="space-y-2"
                            >
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span className="font-medium">10%</span>
                                </div>
                                <Progress value={10} className="h-2" />
                            </motion.div>
                        )}

                        {module.has_scoring == 1 && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span className="text-muted-foreground">Total Score:</span>
                                <span className="font-medium">{module.total_score}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Lesson Navigation */}
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold">Lessons</h2>
                        <div className="space-y-2">
                            {lessonsWithDetails.map((lesson: Lesson, index: number) => (
                                <motion.div
                                    key={lesson.lesson}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "rounded-lg transition-all duration-200",
                                        index === currentLessonIndex
                                            ? "bg-primary/10"
                                            : "hover:bg-muted/50"
                                    )}
                                >
                                    <div
                                        className={cn(
                                            "text-sm p-2 rounded-lg cursor-pointer font-medium",
                                            index === currentLessonIndex
                                                ? "text-primary"
                                                : "text-foreground"
                                        )}
                                        onClick={() => setCurrentLessonIndex(index)}
                                    >
                                        {lesson.lessonDetails?.lesson_name || `Lesson ${index + 1}`}
                                    </div>
                                    {index === currentLessonIndex && lesson.lessonDetails?.chapters && (
                                        <div className="pl-4 pb-2 space-y-1">
                                            {lesson.lessonDetails.chapters.map((chapter: any, cidx: number) => (
                                                <div
                                                    key={chapter.chapter}
                                                    className={cn(
                                                        "text-sm p-2 rounded-md cursor-pointer transition-all duration-200",
                                                        cidx === selectedChapterIdx
                                                            ? "bg-primary/20 text-primary font-medium"
                                                            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                                                    )}
                                                    onClick={() => handleChapterClick(chapter.chapter, cidx)}
                                                >
                                                    {chapterDetailsSidebar[chapter.chapter]?.title || `Chapter ${cidx + 1}`}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {enableEditing && (
                        <Link href={`/edit/${module.name}`} className="block">
                            <Button variant="outline" className="w-full hover:bg-primary/10">
                                Edit Module
                            </Button>
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* Right Content Area */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 overflow-y-auto"
            >
                <div className="w-full mx-auto p-6">
                    {currentLesson && (
                        <motion.div 
                            key={currentLesson.lesson}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="relative"
                        >
                            <LessonWithChapters 
                                lessonName={currentLesson.lesson} 
                                onNext={handleNext}
                                onPrevious={handlePrevious}
                                isFirst={isFirstLesson}
                                isLast={isLastLesson}
                                activeChapterId={activeChapterId}
                            />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
} 