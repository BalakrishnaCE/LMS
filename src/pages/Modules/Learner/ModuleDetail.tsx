import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleSidebar } from "@/pages/Modules/Learner/components/ModuleSidebar";
import { ModuleContent } from "@/pages/Modules/Learner/components/ModuleContent";
import { WelcomeScreen } from "@/pages/Modules/Learner/components/WelcomeScreen";
import { CompletionScreen } from "@/pages/Modules/Learner/components/CompletionScreen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BookOpen, Clock, Award, ChevronRight, Flame, Calendar, Star, Target } from "lucide-react";
import { ROUTES } from "@/config/routes";

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
    current_content: string;
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

// Initial empty module state
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
            current_chapter: "",
            current_content: ""
        };
    }
    return {
        status: "Not Started",
        current_lesson: module.lessons[0]?.name || "",
        current_chapter: module.lessons[0]?.chapters[0]?.name || "",
        current_content: module.lessons[0]?.chapters[0]?.contents[0]?.name || ""
    };
}

export default function LearnerModuleDetail() {
    const params = useParams<{ moduleName: string }>();
    const moduleName = params.moduleName;
    const { user, isLoading: userLoading } = useUser();
    const [isLoading, setIsLoading] = useState(true);
    const [module, setModule] = useState<Module | null>(null);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [progress, setProgress] = useState<ModuleProgress | null>(null);
    const [completed, setCompleted] = useState(false);
    const [started, setStarted] = useState(false);
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
    const [currentContentIdx, setCurrentContentIdx] = useState(0);

    // First fetch module data using LearnerModuleData API
    const { data: moduleListData, error: moduleListError, isLoading: moduleListLoading } = useFrappeGetCall<ApiResponse<{ modules: Module[] }>>("LearnerModuleData", {
        user: user?.email,
        limit: 1,
        offset: 0,
        filters: [["name", "=", moduleName]]
    });

    // Get the specific module from the list
    const moduleData = moduleListData?.data?.modules?.[0];

    // Post call for starting module
    const { call: startModule, error: startError, loading: startLoading } = useFrappePostCall('addLearnerProgress');

    // Fetch progress and module structure using frappe-react-sdk - only when module is started
    const { data: progressData, error: progressError, isLoading: progressLoading } = useFrappeGetCall<ApiResponse<{ module: Module }>>("getLearnerProgress", {
        user: user?.email,
        module: moduleName
    }, {
        enabled: started && !!moduleData // Only fetch progress if module is started and we have module data
    });

    // Post call for updating progress
    const { call: updateProgress, error: updateError, loading: updateLoading } = useFrappePostCall('updateLearnerProgress');

    // Update module data when fetched
    useEffect(() => {
        if (moduleData) {
            setModule(moduleData);
            // Check if module is already started based on module data
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

    // Calculate overall progress
    const calculateProgress = () => {
        if (!module?.lessons?.length) return 0;
        let totalItems = 0;
        let completedItems = 0;

        module.lessons.forEach(lesson => {
            lesson.chapters?.forEach(chapter => {
                chapter.contents?.forEach(content => {
                    totalItems++;
                    if (content.progress === "Completed") completedItems++;
                });
            });
        });

        return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    };

    const overallProgress = calculateProgress();

    // Sync UI indices with progress
    useEffect(() => {
        if (
            progress &&
            (module?.lessons?.length ?? 0) > 0
        ) {
            // Find lesson index, fallback to 0 if not found or null
            let lessonIdx = progress.current_lesson
                ? module?.lessons?.findIndex(l => l.name === progress.current_lesson) ?? 0
                : 0;
            if (lessonIdx < 0) lessonIdx = 0;
            const lesson = module?.lessons[lessonIdx];

            // Find chapter index, fallback to 0 if not found or null
            let chapterIdx = progress.current_chapter && lesson?.chapters?.length
                ? lesson.chapters.findIndex(c => c.name === progress.current_chapter)
                : 0;
            if (chapterIdx < 0) chapterIdx = 0;
            const chapter = lesson?.chapters?.[chapterIdx];

            // Find content index, fallback to 0 if not found or null
            let contentIdx = progress.current_content && chapter?.contents?.length
                ? chapter.contents.findIndex(c => c.name === progress.current_content)
                : 0;
            if (contentIdx < 0) contentIdx = 0;

            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(chapterIdx);
            setCurrentContentIdx(contentIdx);
        }
    }, [progress, module]);

    // Navigation handlers
    const sendProgressUpdate = async (lessonIdx: number, chapterIdx: number, contentIdx: number, status: "In Progress" | "Completed") => {
        if (!module?.lessons?.length || !user) return;
        const lesson = module.lessons[lessonIdx];
        const chapter = lesson?.chapters?.[chapterIdx];
        const content = chapter?.contents?.[contentIdx];
        if (!lesson || !chapter || !content) return;
        try {
            await updateProgress({
                user: user.email,
                module: moduleName,
                lesson: lesson.name,
                chapter: chapter.name,
                content: content.name,
                content_type: content.content_type,
                status
            });
        } catch (e) {
            console.error("Failed to update progress:", e);
        }
    };

    const handlePrevious = async () => {
        if (!module?.lessons?.length) return;
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        let contentIdx = currentContentIdx;
        const currentLesson = module.lessons[lessonIdx];
        const currentChapter = currentLesson?.chapters?.[chapterIdx];
        
        if (contentIdx > 0) {
            contentIdx -= 1;
        } else if (chapterIdx > 0 && currentLesson?.chapters?.length) {
            chapterIdx -= 1;
            contentIdx = currentLesson.chapters[chapterIdx].contents.length - 1;
        } else if (lessonIdx > 0) {
            lessonIdx -= 1;
            const prevLesson = module.lessons[lessonIdx];
            chapterIdx = prevLesson.chapters.length - 1;
            contentIdx = prevLesson.chapters[chapterIdx].contents.length - 1;
        }
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
        setCurrentContentIdx(contentIdx);
        await sendProgressUpdate(lessonIdx, chapterIdx, contentIdx, "In Progress");
    };

    const handleNext = async () => {
        if (!module?.lessons?.length) return;
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        let contentIdx = currentContentIdx;
        const currentLesson = module.lessons[lessonIdx];
        const currentChapter = currentLesson?.chapters?.[chapterIdx];
        
        if (contentIdx < (currentChapter?.contents?.length || 0) - 1) {
            contentIdx += 1;
        } else if (chapterIdx < (currentLesson?.chapters?.length || 0) - 1) {
            chapterIdx += 1;
            contentIdx = 0;
        } else if (lessonIdx < module.lessons.length - 1) {
            lessonIdx += 1;
            chapterIdx = 0;
            contentIdx = 0;
        }
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
        setCurrentContentIdx(contentIdx);
        await sendProgressUpdate(lessonIdx, chapterIdx, contentIdx, "In Progress");
    };

    const handleComplete = async () => {
        if (!user || !module?.lessons?.length || !currentLesson || !currentChapter || !currentContent) return;
        try {
            await updateProgress({
                user: user.email,
                module: moduleName,
                lesson: currentLesson.name,
                chapter: currentChapter.name,
                content: currentContent.name,
                content_type: currentContent.content_type,
                status: "Completed"
            });
            setCompleted(true);
        } catch (e) {
            console.error("Failed to update progress:", e);
        }
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

            // Start the animation
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
            setCurrentContentIdx(0);
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
                setCurrentContentIdx(0);
            }
        }
    };

    // Set isLoading to false when data or error is present
    useEffect(() => {
        if (moduleListData || moduleListError) {
            setIsLoading(false);
        }
    }, [moduleListData, moduleListError]);

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
    const currentContent = currentChapter?.contents?.[currentContentIdx];
    const isFirst = currentLessonIdx === 0 && currentChapterIdx === 0 && currentContentIdx === 0;
    const isLast = currentLessonIdx === (module.lessons?.length ?? 0) - 1 && 
                  currentChapterIdx === (currentLesson?.chapters?.length ?? 0) - 1 && 
                  currentContentIdx === (currentChapter?.contents?.length ?? 0) - 1;

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
                                <p className="text-xl text-muted-foreground">{module.description}</p>
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
                    <div className=" w-80 bg-white border-r flex-shrink-0">
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
                        <div className="w-full max-w-4xl bg-white rounded-xl shadow p-8">
                            {started && !completed && currentLesson && currentChapter && (
                                <div className="space-y-8">
                                    {/* Lesson and Chapter Header */}
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">{currentLesson.lesson_name}</h2>
                                        <h3 className="text-xl font-semibold mb-6">{currentChapter.title}</h3>
                                    </div>
                                    {/* All contents for the chapter */}
                                    {currentChapter.contents.map((content, idx) => (
                                        <ModuleContent
                                            key={content.name}
                                            currentLesson={currentLesson}
                                            currentChapter={currentChapter}
                                            currentContent={content}
                                            isFirst={idx === 0}
                                            isLast={idx === currentChapter.contents.length - 1}
                                            onPrevious={handlePrevious}
                                            onNext={handleNext}
                                            onComplete={handleComplete}
                                            isUpdating={updateLoading}
                                            showHeader={false}
                                            showNavigation={false}
                                        />
                                    ))}
                                    {/* Navigation (only once) */}
                                    <div className="flex justify-between mt-8">
                                        <Button onClick={handlePrevious} disabled={isFirst}>Previous</Button>
                                        <Button onClick={handleNext} disabled={isLast}>Next</Button>
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
                                        setCurrentContentIdx(0);
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