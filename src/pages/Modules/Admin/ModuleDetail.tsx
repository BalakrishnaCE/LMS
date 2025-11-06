import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { useFrappeGetCall, useFrappeAuth } from "frappe-react-sdk";
import { ModuleSidebar } from "@/pages/Modules/Learner/components/ModuleSidebar";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/pages/Modules/Learner/components/ContentRenderer";
import { BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import Lottie from "lottie-react";
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

// TypeScript interfaces
interface Content {
    name: string;
    content_type: string;
    content_reference: string;
    data?: any; // Content data already fetched by the API
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

interface Module {
    name: string;
    name1: string;
    description: string;
    lessons: Lesson[];
    image?: string;
}

interface ModuleApiResponse {
    message: {
        modules: Module[];
        meta: any;
    };
}

export default function AdminModuleDetail() {
    const params = useParams<{ moduleName: string }>();
    const moduleName = params.moduleName;
    const { currentUser } = useFrappeAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [module, setModule] = useState<Module | null>(null);
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);

    const userIdentifier = useMemo(() => {
        // Use currentUser directly - it's available immediately
        return currentUser || null;
    }, [currentUser]);

    const { data: moduleListData, error: moduleListError, isLoading: moduleDataLoading } = useFrappeGetCall<ModuleApiResponse>(
        'novel_lms.novel_lms.api.module_management.LearnerModuleData', {
        user: userIdentifier,
        limit: 1,
        offset: 0,
        filters: [["name", "=", moduleName]]
    }, {
        enabled: !!(userIdentifier && moduleName)
    });

    useEffect(() => {
        if (moduleListData && !moduleDataLoading && !module) {
            const response = moduleListData as any;
            let moduleData = null;
            
            if (response?.message?.message?.modules && Array.isArray(response.message.message.modules) && response.message.message.modules.length > 0) {
                moduleData = response.message.message.modules[0];
            } else if (response?.message?.modules && Array.isArray(response.message.modules) && response.message.modules.length > 0) {
                moduleData = response.message.modules[0];
            } else if (response?.modules && Array.isArray(response.modules) && response.modules.length > 0) {
                moduleData = response.modules[0];
            }
            
            if (moduleData) {
                setModule(moduleData);
            }
        }
    }, [moduleListData, moduleDataLoading, module]);

    useEffect(() => {
        if (moduleListData || moduleListError) {
            setIsLoading(false);
        }
    }, [moduleListData, moduleListError]);

    // --- ADMIN: UI-only navigation, no progress, no welcome, no completion ---
    // Admin detail page logic
        if (isLoading || moduleDataLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-muted-foreground">Loading module details...</div>
                </div>
            );
        }
        if (moduleListError) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
                    <div className="mt-4 text-red-500">Error loading module details.</div>
                </div>
            );
        }
        if (!module) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Lottie animationData={emptyAnimation} loop style={{ width: 180, height: 180 }} />
                    <div className="mt-4 text-muted-foreground">Module not found</div>
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
                        mode='admin'
                        completionData={undefined} // no completion data for admin
                        isAccessible={() => true} // admin can access everything
                    />
                </div>
                {/* Main Content */}
                <div className="flex-1 flex justify-center items-start p-8">
                    <div className="w-full rounded-xl shadow p-8 bg-card">
                        {currentLesson && currentChapter && module && (
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
                                     </div>
                                 </div>
                                
                                {/* Chapter Contents */}
                                {currentChapter.contents && currentChapter.contents.length > 0 && (
                                    <div className="space-y-6">
                                        {currentChapter.contents.map((content, idx) => {
                                            // Debug the actual content structure
                                            if (idx === 0) {
                                                console.log('🔍 FIRST CONTENT OBJECT DETAILED INSPECTION:', {
                                                    content,
                                                    allKeys: Object.keys(content),
                                                    hasContent_reference: 'content_reference' in content,
                                                    content_reference_value: content.content_reference,
                                                    name: content.name,
                                                    contentType: content.content_type,
                                                    hasData: !!content.data
                                                });
                                            }
                                            console.log('📄 Rendering content:', {
                                                name: content.name,
                                                contentType: content.content_type,
                                                contentReference: content.content_reference,
                                                hasData: !!content.data,
                                                dataKeys: content.data ? Object.keys(content.data) : []
                                            });
                                            return (
                                                <ContentRenderer
                                                    key={content.name}
                                                    contentType={content.content_type}
                                                    contentReference={content.content_reference || content.name}
                                                    moduleId={module.name}
                                                    contentData={content.data}
                                                    isParentLoading={moduleDataLoading}
                                                />
                                            );
                                        })}
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
