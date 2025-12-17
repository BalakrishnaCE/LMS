import { useParams, Link, useLocation } from "wouter"
import { Progress } from "@/components/ui/progress"
import { LessonWithChapters } from "@/pages/Modules/LessonwithChapter"
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { BASE_PATH } from "@/config/routes"
import { useAPI } from "@/lib/api"
import { useNavigation, NavigationProvider } from "@/contexts/NavigationContext"


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
    const [isNavigatingLesson, setIsNavigatingLesson] = useState(false);
    const [manualChapterIndex, setManualChapterIndex] = useState<number | null>(null);
    const params = useParams();
    const moduleName = params.moduleName;
    const [location, setLocation] = useLocation();
    const { addToHistory } = useNavigation();

    const { isLMSAdmin, isLMSContentEditor } = useUser();

    useEffect(() => {
        setEnableEditing(isLMSAdmin || isLMSContentEditor);
    }, [isLMSAdmin, isLMSContentEditor]);

    // Track navigation history when module loads
    useEffect(() => {
        if (moduleName && location) {
            // Use the current location as is, since wouter already handles base path
            addToHistory(location, moduleName);
        }
    }, [moduleName, location, addToHistory]);

    const api = useAPI();
    const [module, setModule] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Handle module data when it loads
    useEffect(() => {
        if (!moduleName) return;
        
        setIsValidating(true);
        setError(null);
        
        api.getModuleWithDetails({ module_id: moduleName })
            .then((response: any) => {
                // Check for API-level errors first
                if (response.error) {
                    setError(response.error || "Failed to load module");
                    setIsValidating(false);
                    return;
                }
                
                // Handle the API response structure correctly
                const moduleData = response.data || response.message || response;
                if (!moduleData) {
                    setError("Module data not found");
                    setIsValidating(false);
                    return;
                }
                setModule(moduleData);
                setIsValidating(false);
            })
            .catch((err: any) => {
                console.error("Error loading module:", err);
                setError(err.message || "Failed to load module");
                setIsValidating(false);
            });
    }, [moduleName, api]);

    const sortedLessons = useMemo(() => {
        // Check if module and lessons exist before processing
        if (!module || !module.lessons || !Array.isArray(module.lessons)) {
            return [];
        }
        
        // Map the API response structure to what the frontend expects
        const mappedLessons = module.lessons.map((lesson: any) => ({
            lesson: lesson.name, // Map 'name' to 'lesson' for compatibility
            order: lesson.order || 0
        }));
        
        const sorted = mappedLessons.sort((a: ModuleLesson, b: ModuleLesson) => a.order - b.order);
        return sorted;
    }, [module?.lessons]);

    const currentLesson = sortedLessons[currentLessonIndex] || null;
    const isLastLesson = currentLessonIndex === sortedLessons.length - 1;
    const isFirstLesson = currentLessonIndex === 0;

    // Combine lesson data with their details
    const lessonsWithDetails = useMemo(() => {
        return sortedLessons.map((lesson: ModuleLesson) => ({
            ...lesson,
            lessonDetails: lessonDetails[lesson.lesson]
        }));
    }, [sortedLessons, lessonDetails]);

    // Process lesson details from the already loaded module data
    useEffect(() => {
        if (module?.lessons && module.lessons.length > 0) {
            const details: Record<string, any> = {};
            module.lessons.forEach((lesson: any) => {
                // Map the API response structure to what the frontend expects
                details[lesson.name] = {
                    lesson_name: lesson.lesson_name,
                    description: lesson.description,
                    chapters: lesson.chapters,
                    order: lesson.order
                };
            });
            setLessonDetails(details);
        }
    }, [module]);

    // Process chapter details from the already loaded lesson data
    useEffect(() => {
        if (!currentLesson || !currentLesson.lesson) {
            setChapterDetailsSidebar({});
            setActiveChapterId(null);
            return;
        }
        
        const lessonData = lessonDetails[currentLesson.lesson];
        if (!lessonData?.chapters) {
            setChapterDetailsSidebar({});
            setActiveChapterId(null);
            return;
        }
        
        const details: Record<string, any> = {};
        lessonData.chapters.forEach((chapter: any) => {
            details[chapter.name] = chapter;
        });
        setChapterDetailsSidebar(details);
    }, [currentLesson, lessonDetails]);

    // Auto-select first chapter when lessonDetails for selected lesson is loaded (but not during manual navigation)
    useEffect(() => {
        if (currentLesson && lessonDetails[currentLesson.lesson]?.chapters?.length > 0 && !isNavigatingLesson && manualChapterIndex === null) {
            // Only auto-select if we don't already have a selected chapter index
            if (selectedChapterIdx === null) {
                const firstChapter = lessonDetails[currentLesson.lesson].chapters[0];
                setActiveChapter(firstChapter.name, 0);
            }
        }
    }, [currentLesson, lessonDetails, isNavigatingLesson, manualChapterIndex, selectedChapterIdx]);

    // Helper to set both active chapter and selected chapter index
    const setActiveChapter = (chapterId: string, cidx: number | null = null) => {
        setActiveChapterId(chapterId);
        if (cidx !== null) setSelectedChapterIdx(cidx);
    };

    // Initialize selectedChapterIdx when lesson changes
    useEffect(() => {
        if (currentLesson && currentLesson.lessonDetails?.chapters?.length > 0) {
            // Set to first chapter when lesson changes
            setSelectedChapterIdx(0);
            setActiveChapterId(currentLesson.lessonDetails.chapters[0].name);
        }
    }, [currentLessonIndex]);

    // Sidebar chapter click handler
    const handleChapterClick = (chapterId: string, cidx: number) => {
        setActiveChapter(chapterId, cidx);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8">
                    <div className="text-6xl">⚠️</div>
                    <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
                    <p className="text-muted-foreground max-w-md">
                        We're sorry, but something unexpected happened while loading the module. 
                        Please try refreshing the page.
                    </p>
                    <div className="space-x-4">
                        <Button 
                            onClick={() => window.location.reload()} 
                            className="bg-primary hover:bg-primary/90"
                        >
                            Refresh Page
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => window.history.back()}
                        >
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (isValidating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading module...</p>
                </div>
            </div>
        );
    }
    
    if (!module) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8">
                    <div className="text-6xl">📚</div>
                    <h1 className="text-2xl font-bold text-foreground">Module not found</h1>
                    <p className="text-muted-foreground max-w-md">
                        The module you're looking for doesn't exist or you don't have permission to view it.
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={() => window.history.back()}
                    >
                        Go Back
                    </Button>
                </div>
            </div>
        );
    }

    const handleNext = () => {
        if (!isLastLesson) {
            setCurrentLessonIndex(prev => prev + 1);
            // Scroll to top when navigating to next lesson
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handlePrevious = () => {
        if (!isFirstLesson) {
            setIsNavigatingLesson(true);
            const newLessonIndex = currentLessonIndex - 1;
            setCurrentLessonIndex(newLessonIndex);
            
            // Set the chapter index to the last chapter of the previous lesson
            const previousLesson = lessonsWithDetails[newLessonIndex];
            if (previousLesson && lessonDetails[previousLesson.lesson]?.chapters?.length > 0) {
                const lastChapterIndex = lessonDetails[previousLesson.lesson].chapters.length - 1;
                setManualChapterIndex(lastChapterIndex);
                setSelectedChapterIdx(lastChapterIndex);
                setActiveChapterId(lessonDetails[previousLesson.lesson].chapters[lastChapterIndex].name);
                
                // Keep the manual chapter index until the lesson change is fully processed
                setTimeout(() => {
                    setIsNavigatingLesson(false);
                    // Don't clear manualChapterIndex immediately - let it persist
                }, 200);
                
                // Clear manual chapter index after a longer delay
                setTimeout(() => {
                    setManualChapterIndex(null);
                }, 500);
            }
            
            // Scroll to top when navigating to previous lesson
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    return (
        <NavigationProvider>
            <div className="flex h-screen bg-background w-full">
                <style>{contentStyles}</style>
                
                {/* Left Sidebar - Fixed Width */}
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-80 border-r border-border overflow-y-auto bg-card/50 backdrop-blur-sm"
            >
                <div className="p-4 space-y-6">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:bg-primary/10"
                        onClick={() => {
                            // Always navigate back to modules list to preserve search state
                            // The search state will be restored automatically by the Modules component
                            setLocation('/modules/learner');
                        }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Modules
                    </Button>

                    {/* Module Info */}
                    <div className="space-y-4">
                        <motion.h1 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-xl font-bold"
                        >
                            {module?.name1 || module?.name || 'Untitled Module'}
                        </motion.h1>
                        
                        <div className="space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between text-muted-foreground hover:bg-primary/10"
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                            >
                                Description
                                {isDescriptionExpanded ? (
                                    <motion.div
                                        initial={{ rotate: 0 }}
                                        animate={{ rotate: 180 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronUp className="h-4 w-4" />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        initial={{ rotate: 180 }}
                                        animate={{ rotate: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronDown className="h-4 w-4" />
                                    </motion.div>
                                )}
                            </Button>
                            <AnimatePresence>
                                {isDescriptionExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: module?.description || "" }} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {module?.has_progress == 1 && (
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

                        {module?.has_scoring == 1 && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center gap-2 text-sm"
                            >
                                <span className="text-muted-foreground">Total Score:</span>
                                <span className="font-medium">{module?.total_score || 0}</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Edit Module Button - Moved to top for better accessibility */}
                    {enableEditing && (
                        <Link href={`${BASE_PATH}/edit/${module?.id || module?.name}`} className="block">
                            <Button variant="outline" className="w-full hover:bg-primary/10">
                                Edit Module
                            </Button>
                        </Link>
                    )}

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
                                            {lesson.lessonDetails.chapters.map((chapter: any, cidx: number) => {
                                                const isSelected = cidx === selectedChapterIdx;
                                                return (
                                                    <div
                                                        key={chapter.name}
                                                        className={cn(
                                                            "text-sm p-2 rounded-md cursor-pointer transition-all duration-200",
                                                            isSelected
                                                                ? "bg-primary/20 text-primary font-medium"
                                                                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                                                        )}
                                                        onClick={() => handleChapterClick(chapter.name, cidx)}
                                                    >
                                                        {chapterDetailsSidebar[chapter.name]?.title || `Chapter ${cidx + 1}`}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
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
                                moduleId={module?.name || module?.id}
                                lessonData={currentLesson ? lessonDetails[currentLesson.lesson] : null}
                                onChapterIndexChange={(chapterIndex) => {
                                    // Only update if we're not in the middle of a lesson navigation
                                    // This prevents the callback from overriding our manual chapter index setting
                                    if (!isNavigatingLesson) {
                                        setSelectedChapterIdx(chapterIndex);
                                    }
                                }}
                            />
                        </motion.div>
                    )}
                </div>
            </motion.div>
            </div>
        </NavigationProvider>
    );
} 