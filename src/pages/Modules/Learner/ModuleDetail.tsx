import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleSidebar } from "@/pages/Modules/Learner/components/ModuleSidebar";
import { CompletionScreen } from "@/pages/Modules/Learner/components/CompletionScreen";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ContentRenderer } from "@/pages/Modules/Learner/components/ContentRenderer";
import { BookOpen, ArrowLeft, ArrowRight, Edit } from "lucide-react";
import { Link } from "wouter";

// TypeScript interfaces
interface Content {
    name: string;
    content_type: string;
    progress?: "Not Started" | "In Progress" | "Completed";
}

interface Chapter {
    name: string;
    title: string;
    contents: Content[];
    progress?: "Not Started" | "In Progress" | "Completed";
}

interface Lesson {
    name: string;
    lesson_name: string;
    chapters: Chapter[];
    progress?: "Not Started" | "In Progress" | "Completed";
}

interface ModuleProgress {
    status: "Not Started" | "In Progress" | "Completed";
    current_lesson: string;
    current_chapter: string;
}

interface Module {
    name: string;
    name1: string;
    description: string;
    lessons: Lesson[];
    progress?: ModuleProgress;
}

interface ApiResponse<T> {
    data: T;
}

const initialModule: Module = {
    name: "",
    name1: "",
    description: "",
    lessons: []
};

function getInitialProgress(module: Module): ModuleProgress {
    if (!module.lessons?.length) {
        return {
            status: "Not Started",
            current_lesson: "",
            current_chapter: ""
        };
    }
    return {
        status: "Not Started",
        current_lesson: module.lessons[0]?.name || "",
        current_chapter: module.lessons[0]?.chapters[0]?.name || ""
    };
}

export default function LearnerModuleDetail() {
    const params = useParams<{ moduleName: string }>();
    const moduleName = params.moduleName;
    const { user, isLoading: userLoading, isLMSAdmin } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [module, setModule] = useState<Module | null>(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [progress, setProgress] = useState<ModuleProgress | null>(null);
    const [completed, setCompleted] = useState(false);
    const [started, setStarted] = useState(false);
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

    // Fetch module data
    const { data: moduleListData, error: moduleListError } = useFrappeGetCall<ApiResponse<{ modules: Module[] }>>("LearnerModuleData", {
        user: user?.email,
        limit: 1,
        offset: 0,
        filters: [["name", "=", moduleName]]
    });
    const moduleData = moduleListData?.data?.modules?.[0];
    // Post call for starting module
    const { call: startModule } = useFrappePostCall('addLearnerProgress');
    // Fetch progress and module structure
    const { data: progressData } = useFrappeGetCall<ApiResponse<{ module: Module }>>("getLearnerProgress", {
        user: user?.email,
        module: moduleName
    }, {
        enabled: started && !!moduleData
    });
    // Post call for updating progress
    const { call: updateProgress, loading: updateLoading } = useFrappePostCall('updateLearnerProgress');

    // Update module data when fetched
    useEffect(() => {
        if (moduleData) {
            setModule(moduleData);
            if (moduleData.progress?.status === "In Progress" || moduleData.progress?.status === "Completed") {
                setStarted(true);
                setProgress(moduleData.progress);
            }
        }
    }, [moduleData]);

    // Update progress when fetched
    useEffect(() => {
        if (progressData?.data?.module) {
            setModule(progressData.data.module);
            if (progressData.data.module.progress) {
                setProgress(progressData.data.module.progress);
            }
        }
    }, [progressData]);

    // Safely check progress status
    useEffect(() => {
        if (progress?.status !== "Not Started") {
            setStarted(true);
        }
    }, [progress]);

    // Sync UI indices with progress
    useEffect(() => {
        if (
            progress &&
            (module?.lessons?.length ?? 0) > 0
        ) {
            let lessonIdx = progress.current_lesson
                ? module?.lessons?.findIndex(l => l.name === progress.current_lesson) ?? 0
                : 0;
            if (lessonIdx < 0) lessonIdx = 0;
            const lesson = module?.lessons[lessonIdx];
            let chapterIdx = progress.current_chapter && lesson?.chapters?.length
                ? lesson.chapters.findIndex(c => c.name === progress.current_chapter)
                : 0;
            if (chapterIdx < 0) chapterIdx = 0;
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(chapterIdx);
        }
    }, [progress, module]);

    // Calculate overall progress
    const getOverallProgress = () => {
        if (progress?.status === "Completed") return 100;
        if (!module?.lessons?.length) return 0;
        let totalChapters = 0;
        let completedChapters = 0;
        module.lessons.forEach(lesson => {
            lesson.chapters.forEach(chapter => {
                totalChapters += 1;
                if (chapter.progress === "Completed") completedChapters += 1;
            });
        });
        return totalChapters === 0 ? 0 : Math.round((completedChapters / totalChapters) * 100);
    };
    const overallProgress = getOverallProgress();

    // Navigation handlers
    const handlePrevious = async () => {
        if (!module?.lessons?.length || !user) return;
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        if (chapterIdx > 0) {
            chapterIdx -= 1;
        } else if (lessonIdx > 0) {
            lessonIdx -= 1;
            chapterIdx = module.lessons[lessonIdx].chapters.length - 1;
        }
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
        await updateProgress({
            user: user.email,
            module: moduleName,
            lesson: module.lessons[lessonIdx].name,
            chapter: module.lessons[lessonIdx].chapters[chapterIdx].name,
            status: "In Progress"
        });
        setProgress({
            ...progress!,
            current_lesson: module.lessons[lessonIdx].name,
            current_chapter: module.lessons[lessonIdx].chapters[chapterIdx].name,
            status: "In Progress"
        });
    };

    const handleNext = async () => {
        if (!module?.lessons?.length || !user) return;
        if (progress?.status === "Completed") {
            setCompleted(true);
            return;
        }
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        const currentLesson = module.lessons[lessonIdx];
        const currentChapter = currentLesson.chapters[chapterIdx];
        // Mark current chapter as completed
        await updateProgress({
            user: user.email,
            module: moduleName,
            lesson: currentLesson.name,
            chapter: currentChapter.name,
            status: "Completed"
        });
        if (chapterIdx < currentLesson.chapters.length - 1) {
            // Move to next chapter in the same lesson
            chapterIdx += 1;
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
            await updateProgress({
                user: user.email,
                module: moduleName,
                lesson: currentLesson.name,
                chapter: currentLesson.chapters[chapterIdx].name,
                status: "In Progress"
            });
            setProgress({
                ...progress!,
                current_lesson: currentLesson.name,
                current_chapter: currentLesson.chapters[chapterIdx].name,
                status: "In Progress"
            });
            return;
        }
        // At the end of the last chapter in the lesson, mark lesson as completed
            await updateProgress({
                user: user.email,
                module: moduleName,
                lesson: currentLesson.name,
                chapter: currentChapter.name,
                status: "Completed"
            });
        if (lessonIdx < module.lessons.length - 1) {
            // Move to next lesson and its first chapter
            lessonIdx += 1;
            chapterIdx = 0;
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(chapterIdx);
            await updateProgress({
                user: user.email,
                module: moduleName,
                lesson: module.lessons[lessonIdx].name,
                chapter: module.lessons[lessonIdx].chapters[chapterIdx].name,
                status: "In Progress"
            });
            setProgress({
                ...progress!,
                current_lesson: module.lessons[lessonIdx].name,
                current_chapter: module.lessons[lessonIdx].chapters[chapterIdx].name,
                status: "In Progress"
            });
            return;
        }
        // End of module: mark as completed and show CompletionScreen
        setCompleted(true);
        setProgress({
            ...progress!,
            status: "Completed"
        });
    };

    const handleStartModule = async () => {
        if (!user || !module) return;
        setIsTransitioning(true);
        try {
            const result = await startModule({
                user: user.email,
                module: moduleName
            });
            if (!result) {
                throw new Error("Failed to start module");
            }
            setTimeout(() => {
                setShowWelcome(false);
                setIsTransitioning(false);
                setStarted(true);
                setProgress(getInitialProgress(module));
            }, 500);
        } catch (e) {
            console.error("Failed to start module:", e);
            setIsTransitioning(false);
        }
    };

    const handleLessonClick = (lessonName: string) => {
        if (!module?.lessons?.length) return;
        const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
        if (lessonIdx !== -1) {
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(0);
        }
    };

    const handleChapterClick = (lessonName: string, chapterName: string) => {
        if (!module?.lessons?.length) return;
        const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
        if (lessonIdx !== -1) {
            const lesson = module.lessons[lessonIdx];
            const chapterIdx = lesson?.chapters?.findIndex(c => c.name === chapterName) ?? -1;
            if (chapterIdx !== -1) {
                setCurrentLessonIdx(lessonIdx);
                setCurrentChapterIdx(chapterIdx);
            }
        }
    };

    useEffect(() => {
        if (moduleListData || moduleListError) {
            setIsLoading(false);
        }
    }, [moduleListData, moduleListError]);

    // --- ADMIN: UI-only navigation, no progress, no welcome, no completion ---
    if (isLMSAdmin) {
        if (isLoading || userLoading) {
            return (
                <div className="flex items-center justify-center h-full">
                    <Spinner size="large" />
                </div>
            );
        }
        if (moduleListError) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-red-500">Error loading module details.</p>
                </div>
            );
        }
        if (!module) {
            return (
                <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Module not found</p>
                </div>
            );
        }
        const currentLesson = module.lessons?.[currentLessonIdx];
        const currentChapter = currentLesson?.chapters?.[currentChapterIdx];
        const isFirst = currentLessonIdx === 0 && currentChapterIdx === 0;
        const isLast = currentLessonIdx === (module.lessons?.length ?? 0) - 1 && 
                      currentChapterIdx === (currentLesson?.chapters?.length ?? 0) - 1;
        // Sidebar click handlers for admin
        const handleLessonClick = (lessonName: string) => {
            if (!module?.lessons?.length) return;
            const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
            if (lessonIdx !== -1) {
                setCurrentLessonIdx(lessonIdx);
                setCurrentChapterIdx(0);
            }
        };
        const handleChapterClick = (lessonName: string, chapterName: string) => {
            if (!module?.lessons?.length) return;
            const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
            if (lessonIdx !== -1) {
                const lesson = module.lessons[lessonIdx];
                const chapterIdx = lesson?.chapters?.findIndex(c => c.name === chapterName) ?? -1;
                if (chapterIdx !== -1) {
                    setCurrentLessonIdx(lessonIdx);
                    setCurrentChapterIdx(chapterIdx);
                }
            }
        };
        // UI-only navigation
        const handlePrevious = () => {
            if (!module?.lessons?.length) return;
            let lessonIdx = currentLessonIdx;
            let chapterIdx = currentChapterIdx;
            if (chapterIdx > 0) {
                chapterIdx -= 1;
            } else if (lessonIdx > 0) {
                lessonIdx -= 1;
                chapterIdx = module.lessons[lessonIdx].chapters.length - 1;
            }
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(chapterIdx);
        };
        const handleNext = () => {
            if (!module?.lessons?.length) return;
            let lessonIdx = currentLessonIdx;
            let chapterIdx = currentChapterIdx;
            const currentLesson = module.lessons[lessonIdx];
            if (chapterIdx < currentLesson.chapters.length - 1) {
                chapterIdx += 1;
            } else if (lessonIdx < module.lessons.length - 1) {
                lessonIdx += 1;
                chapterIdx = 0;
            }
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(chapterIdx);
        };
        return (
            <div className="flex min-h-screen bg-muted gap-6 w-full">
                {/* Sidebar on the left */}
                <div className="w-80 border-r flex-shrink-0">
                    <ModuleSidebar
                        module={module}
                        progress={null} // no progress for admin
                        started={true}
                        overallProgress={0}
                        onLessonClick={handleLessonClick}
                        onChapterClick={handleChapterClick}
                        currentLessonName={currentLesson?.name}
                        currentChapterName={currentChapter?.name}
                    />
                </div>
                {/* Main Content */}
                <div className="flex-1 flex justify-center items-start p-8">
                    <div className="w-full rounded-xl shadow p-8 bg-card">
                        {currentLesson && currentChapter && (
                            <div className="space-y-8">
                                {/* Admin Preview Indicator */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">{currentLesson.lesson_name}</h2>
                                        <h3 className="text-xl font-semibold">{currentChapter.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-md">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Admin Preview</span>
                                        </div>
                                        <Link href={`/edit/${module.name}`}>
                                            <Button variant="outline" size="sm" className="gap-2">
                                                <Edit className="h-4 w-4" />
                                                Edit Module
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                                
                                {/* Chapter Contents */}
                                {currentChapter.contents && currentChapter.contents.length > 0 && (
                                    <div className="space-y-6">
                                        {currentChapter.contents.map((content, idx) => (
                                            <ContentRenderer
                                                key={content.name}
                                                contentType={content.content_type}
                                                contentReference={content.name}
                                            />
                                        ))}
                                    </div>
                                )}
                                
                                {/* Navigation */}
                                <div className="flex justify-between items-center mt-8 pt-6 border-t">
                                    <Button 
                                        onClick={handlePrevious} 
                                        disabled={isFirst}
                                        variant="outline"
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <div className="text-sm text-muted-foreground">
                                        Lesson {currentLessonIdx + 1} of {module.lessons.length} • 
                                        Chapter {currentChapterIdx + 1} of {currentLesson.chapters.length}
                                    </div>
                                    <Button 
                                        onClick={handleNext} 
                                        disabled={isLast}
                                        className="gap-2"
                                    >
                                        Next
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    // --- END ADMIN LOGIC ---

    // --- LEARNER LOGIC (default, as before) ---
    if (isLoading || userLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spinner size="large" />
            </div>
        );
    }
    if (moduleListError) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Error loading module details.</p>
            </div>
        );
    }
    if (!module) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Module not found</p>
            </div>
        );
    }
    const currentLesson = module.lessons?.[currentLessonIdx];
    const currentChapter = currentLesson?.chapters?.[currentChapterIdx];
    const isFirst = currentLessonIdx === 0 && currentChapterIdx === 0;
    const isLast = currentLessonIdx === (module.lessons?.length ?? 0) - 1 && 
                  currentChapterIdx === (currentLesson?.chapters?.length ?? 0) - 1;
    return (
        <AnimatePresence mode="wait">
            {progress?.status === "Not Started" && showWelcome ? (
                <motion.div
                    key="welcome"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="flex min-h-screen bg-muted items-center justify-center"
                >
                    <Card className="w-full max-w-2xl">
                        <CardContent className="p-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-center space-y-6"
                            >
                                <h1 className="text-4xl font-bold">{module.name1}</h1>
                                <p className="text-xl text-muted-foreground" dangerouslySetInnerHTML={{ __html: module.description }} />
                                <div className="pt-6">
                                    <Button
                                        size="lg"
                                        className="text-lg px-8 py-6"
                                        onClick={handleStartModule}
                                        disabled={isTransitioning}
                                    >
                                        Start Learning
                                    </Button>
                                </div>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <div className="flex min-h-screen bg-muted gap-6 w-full">
                    {/* Sidebar on the left */}
                    <div className=" w-80 border-r flex-shrink-0">
                        <ModuleSidebar
                            module={module}
                            progress={progress}
                            started={started}
                            overallProgress={overallProgress}
                            onLessonClick={handleLessonClick}
                            onChapterClick={handleChapterClick}
                        />
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 flex justify-center items-start p-8">
                        <div className="w-full  rounded-xl shadow p-8">
                            {started && !completed && currentLesson && currentChapter && (
                                <div className="space-y-8">
                                    {/* Lesson and Chapter Header */}
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">{currentLesson.lesson_name}</h2>
                                        <h3 className="text-xl font-semibold mb-6">{currentChapter.title}</h3>
                                    </div>
                                    {/* Chapter Contents */}
                                    {currentChapter.contents && currentChapter.contents.length > 0 && (
                                        <div className="space-y-6">
                                    {currentChapter.contents.map((content, idx) => (
                                                <ContentRenderer
                                            key={content.name}
                                                    contentType={content.content_type}
                                                    contentReference={content.name}
                                        />
                                    ))}
                                        </div>
                                    )}
                                    {/* Navigation */}
                                    <div className="flex justify-between items-center mt-8 pt-6 border-t">
                                        <Button 
                                            onClick={handlePrevious} 
                                            disabled={isFirst}
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <div className="text-sm text-muted-foreground">
                                            Lesson {currentLessonIdx + 1} of {module.lessons.length} • 
                                            Chapter {currentChapterIdx + 1} of {currentLesson.chapters.length}
                                        </div>
                                        <Button 
                                            onClick={handleNext} 
                                            disabled={completed || updateLoading}
                                            className="gap-2"
                                        >
                                            {updateLoading ? "Updating..." : "Next"}
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {completed && (
                                <CompletionScreen
                                    onReview={() => {
                                        if (!module?.lessons?.length) return;
                                        setProgress(getInitialProgress(module));
                                        setCompleted(false);
                                        setCurrentLessonIdx(0);
                                        setCurrentChapterIdx(0);
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
} 