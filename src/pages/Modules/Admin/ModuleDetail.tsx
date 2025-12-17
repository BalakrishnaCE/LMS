import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useFrappeGetCall } from "frappe-react-sdk";
import { LMS_API_BASE_URL } from "@/config/routes";
import { ModuleSidebar } from "@/pages/Modules/Learner/components/ModuleSidebar";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/pages/Modules/Learner/components/ContentRenderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { BookOpen, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Lottie from "lottie-react";
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { ROUTES } from "@/config/routes";

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


export default function AdminModuleDetail() {
    const params = useParams<{ moduleName: string }>();
    const [, setLocation] = useLocation();
    const moduleName = params.moduleName;
    const [isLoading, setIsLoading] = useState(true);
    const [module, setModule] = useState<Module | null>(null);
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Use get_module_with_details API for admin users instead of LearnerModuleData
    const { data: moduleDataResponse, error: moduleListError, isLoading: moduleDataLoading } = useFrappeGetCall<any>(
        'novel_lms.novel_lms.api.module_management.get_module_with_details', {
        module_id: moduleName
    }, {
        enabled: !!moduleName
    });

    // Reset module state when moduleName changes
    useEffect(() => {
        setModule(null);
        setCurrentLessonIdx(0);
        setCurrentChapterIdx(0);
        setIsLoading(true);
    }, [moduleName]);

    useEffect(() => {
        if (moduleDataResponse && !moduleDataLoading) {
            const response = moduleDataResponse as any;
            let moduleData = null;
            
            // Handle get_module_with_details response format
            // The API returns data in frappe.response["data"], which frappe-react-sdk wraps
            // Try multiple response paths
            let data = null;
            if (response?.message) {
                data = response.message;
            } else if (response?.data) {
                data = response.data;
            } else if (response?.lessons) {
                data = response;
            }
            
            // Process data if it exists - the API should return the correct module based on module_id parameter
            // But verify it matches the requested moduleName for safety
            if (data) {
                if (data.lessons && Array.isArray(data.lessons)) {
                    // Transform the response to match the expected Module interface
                    moduleData = {
                        name: data.id || moduleName,
                        name1: data.name || '',
                        description: data.description || '',
                        lessons: data.lessons.map((lesson: any) => ({
                            name: lesson.id || lesson.name,
                            lesson_name: lesson.lesson_name || lesson.name || lesson.title || '',
                            chapters: (lesson.chapters || []).map((chapter: any) => ({
                                name: chapter.id || chapter.name,
                                title: chapter.title || chapter.name || '',
                                contents: (chapter.contents || []).map((content: any) => ({
                                    name: content.id || content.name || content.content_reference,
                                    content_type: content.content_type || content.type,
                                    content_reference: content.content_reference || content.id || content.name,
                                    data: content.data || content
                                }))
                            }))
                        })),
                        image: data.image
                    };
                }
            }
            
            if (moduleData) {
                console.log('AdminModuleDetail - Successfully parsed module data:', moduleData);
                setModule(moduleData);
                setIsLoading(false);
            } else {
                console.error('AdminModuleDetail - Could not parse module data. Response structure:', {
                    response,
                    hasMessage: !!response?.message,
                    hasData: !!response?.data,
                    hasLessons: !!response?.lessons,
                    messageLessons: response?.message?.lessons,
                    dataLessons: response?.data?.lessons,
                    moduleName,
                    dataId: data?.id,
                    dataName: data?.name
                });
                setIsLoading(false);
            }
        }
    }, [moduleDataResponse, moduleDataLoading, moduleName]);

    useEffect(() => {
        if (moduleDataResponse || moduleListError) {
            setIsLoading(false);
        }
    }, [moduleDataResponse, moduleListError]);

    // Handle module deletion
    const handleDeleteModule = async () => {
        if (!moduleName) return;
        
        setIsDeleting(true);
        try {
            // Use direct fetch with correct base URL to ensure it uses lms.noveloffice.org
            const apiBaseUrl = LMS_API_BASE_URL || '';
            const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
            const apiUrl = cleanBaseUrl 
                ? `${cleanBaseUrl}/api/method/novel_lms.novel_lms.api.module_management.delete_module_with_cascade`
                : `/api/method/novel_lms.novel_lms.api.module_management.delete_module_with_cascade`;
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    module_name: moduleName
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.exc || `HTTP error! status: ${response.status}`);
            }

            await response.json();
            
            toast.success("Module deleted successfully", {
                description: "All related data (lessons, chapters, contents, and progress) has been removed."
            });
            
            // Navigate back to modules list
            setLocation(ROUTES.MODULES);
        } catch (error: any) {
            console.error("Error deleting module:", error);
            
            // Extract error message from various possible error formats
            let errorMessage = "An error occurred while deleting the module.";
            if (error?.message) {
                errorMessage = error.message;
            } else if (error?.exc) {
                errorMessage = error.exc;
            } else if (typeof error === 'string') {
                errorMessage = error;
            } else if (error?.response?.message) {
                errorMessage = error.response.message;
            } else if (error?.exception) {
                errorMessage = error.exception;
            }
            
            toast.error("Failed to delete module", {
                description: errorMessage,
                duration: 5000
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    // Loading state
    if (isLoading || moduleDataLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-muted-foreground">Loading module details...</div>
            </div>
        );
    }

    // Error state
    if (moduleListError) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-red-500">Error loading module details.</div>
            </div>
        );
    }

    // Module not found
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
    
    // Main render
    return (
        <>
            <div className="flex min-h-screen bg-muted gap-6 w-full">
                {/* Sidebar on the left */}
                <div className="w-80 border-r flex-shrink-0">
                    <ModuleSidebar
                        module={module}
                        progress={null}
                        started={true}
                        overallProgress={0}
                        onLessonClick={handleLessonClick}
                        onChapterClick={handleChapterClick}
                        currentLessonName={currentLesson?.name}
                        currentChapterName={currentChapter?.name}
                        mode='admin'
                        completionData={undefined}
                        isAccessible={() => true}
                    />
                </div>
                {/* Main Content */}
                <div className="flex-1 flex justify-center items-start p-8">
                    <div className="w-full rounded-xl shadow p-8 bg-card">
                        <div className="space-y-8">
                            {/* Admin Preview Indicator and Delete Button - Always Visible */}
                            <div className="flex items-center justify-between">
                                <div>
                                    {currentLesson && currentChapter ? (
                                        <>
                                            <h2 className="text-2xl font-bold mb-2">{currentLesson.lesson_name}</h2>
                                            <h3 className="text-xl font-semibold">{currentChapter.title}</h3>
                                        </>
                                    ) : (
                                        <div>
                                            <h2 className="text-2xl font-bold mb-2">{module.name1}</h2>
                                            <h3 className="text-xl font-semibold text-muted-foreground">
                                                {module.lessons?.length === 0 
                                                    ? "No lessons or chapters yet" 
                                                    : "Select a lesson and chapter to view content"}
                                            </h3>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-md">
                                        <BookOpen className="h-4 w-4" />
                                        <span>Admin Preview</span>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setShowDeleteDialog(true)}
                                        className="gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Module
                                    </Button>
                                </div>
                            </div>
                            
                            {/* Chapter Contents - Only show if lesson and chapter exist */}
                            {currentLesson && currentChapter && (
                                <>
                                    {currentChapter.contents && currentChapter.contents.length > 0 && (
                                        <div className="space-y-6">
                                            {currentChapter.contents.map((content) => (
                                                <ContentRenderer
                                                    key={content.name}
                                                    contentType={content.content_type}
                                                    contentReference={content.content_reference || content.name}
                                                    moduleId={module.name}
                                                    contentData={content.data}
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Module</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this module? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-semibold text-destructive">Warning: This will permanently delete:</p>
                            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                <li>All lessons and chapters</li>
                                <li>All content (Quiz, Question Answer, Text, Image, Video, etc.)</li>
                                <li>All progress tracking records (if published)</li>
                                <li>All learner assignments</li>
                            </ul>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Module: <span className="font-semibold">{module.name1 || moduleName}</span>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDeleteDialog(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteModule}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Module"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
