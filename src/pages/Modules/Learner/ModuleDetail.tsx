import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { useLearnerCompletionData, CompletionData } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ModuleSidebar } from "@/pages/Modules/Learner/components/ModuleSidebar";
import { CompletionScreen } from "@/pages/Modules/Learner/components/CompletionScreen";
import { Button } from "@/components/ui/button";
import { ContentRenderer } from "@/pages/Modules/Learner/components/ContentRenderer";
import { BookOpen, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { ROUTES, LMS_API_BASE_URL } from "@/config/routes";
import Lottie from "lottie-react";
import learningAnimation from "@/assets/learning-bg.json"; // Place your Lottie JSON here
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { toast } from "sonner";

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
    image?: string;
}

interface ApiResponse<T> {
    data: T;
}

interface ModuleApiResponse {
    message: {
        modules: Module[];
        meta: any;
    };
}


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

// Utility: Check for Quiz/QA content and completion
function getQuizQAContents(module: Module) {
    const quizQAContents: { content: Content; lessonIdx: number; chapterIdx: number; }[] = [];
    module.lessons.forEach((lesson, lessonIdx) => {
        lesson.chapters.forEach((chapter, chapterIdx) => {
            chapter.contents.forEach((content) => {
                if (content.content_type === "Quiz" || content.content_type === "Question Answer") {
                    quizQAContents.push({ content, lessonIdx, chapterIdx });
                }
            });
        });
    });
    return quizQAContents;
}

// Utility: Get incomplete Quiz/QA titles (fetch all progress for user, filter in JS)
async function getIncompleteQuizQATitles(module: Module, user: any) {
    const quizQAContents = getQuizQAContents(module);
    const incompleteTitles: string[] = [];
    // Fetch all quiz progress for user
    let quizProgressList: any[] = [];
    let qaProgressList: any[] = [];
    try {
        const quizRes = await fetch(`${LMS_API_BASE_URL}/api/resource/Quiz Progress?filters=[[\"user\",\"=\",\"${user?.name}\"]]&fields=[\"score\",\"max_score\",\"name\",\"quiz_id\"]`, { credentials: 'include' });
        quizProgressList = (await quizRes.json())?.data || [];
    } catch {}
    try {
        const qaRes = await fetch(`${LMS_API_BASE_URL}/api/resource/Question Answer Progress?filters=[[\"user\",\"=\",\"${user?.name}\"]]&fields=[\"score\",\"max_score\",\"score_added\",\"name\",\"question_answer\"]`, { credentials: 'include' });
        qaProgressList = (await qaRes.json())?.data || [];
    } catch {}
    for (const { content } of quizQAContents) {
        let displayTitle = content.name;
        if ((content as any).title) {
            displayTitle = (content as any).title;
        } else if ((content as any).content_type) {
            displayTitle = `${content.content_type}`;
        }
        if (content.content_type === "Quiz") {
            const progress = quizProgressList.find(p => p.quiz_id === content.name);
            if (!progress || typeof progress.score !== 'number') {
                incompleteTitles.push(displayTitle);
            }
        } else if (content.content_type === "Question Answer") {
            // Only require a progress record to exist, not score_added
            const progress = qaProgressList.find(p => p.question_answer === content.name);
            if (!progress) {
                incompleteTitles.push(displayTitle);
            }
        }
    }
    return incompleteTitles;
}

// Utility: Check Quiz/QA completion (fetch all progress for user, filter in JS)
async function checkQuizQACompletion(module: Module, user: any) {
    const quizQAContents = getQuizQAContents(module);
    if (quizQAContents.length === 0) return { allCompleted: true, scores: [] };
    let quizProgressList: any[] = [];
    let qaProgressList: any[] = [];
    try {
        const quizRes = await fetch(`${LMS_API_BASE_URL}/api/resource/Quiz Progress?filters=[[\"user\",\"=\",\"${user?.name}\"]]&fields=[\"score\",\"max_score\",\"name\",\"quiz_id\"]`, { credentials: 'include' });
        quizProgressList = (await quizRes.json())?.data || [];
    } catch {}
    try {
        const qaRes = await fetch(`${LMS_API_BASE_URL}/api/resource/Question Answer Progress?filters=[[\"user\",\"=\",\"${user?.name}\"]]&fields=[\"score\",\"max_score\",\"score_added\",\"name\",\"question_answer\"]`, { credentials: 'include' });
        qaProgressList = (await qaRes.json())?.data || [];
    } catch {}
    const scores: Array<{title: string, score: number, maxScore: number, type: string}> = [];
    let allCompleted = true;
    for (const { content } of quizQAContents) {
        let displayTitle = content.name;
        if ((content as any).title) {
            displayTitle = (content as any).title;
        } else if ((content as any).content_type) {
            displayTitle = `${content.content_type}`;
        }
        if (content.content_type === "Quiz") {
            const progress = quizProgressList.find(p => p.quiz_id === content.name);
            if (!progress || typeof progress.score !== 'number') {
                allCompleted = false;
            } else {
                scores.push({ title: displayTitle, score: progress.score, maxScore: progress.max_score || 0, type: 'Quiz' });
            }
        } else if (content.content_type === "Question Answer") {
            // Only require a progress record to exist, not score_added
            const progress = qaProgressList.find(p => p.question_answer === content.name);
            if (!progress) {
                allCompleted = false;
            } else {
                // Only show score if score_added is set
                if (progress.score_added === 1) {
                    scores.push({ title: displayTitle, score: progress.score, maxScore: progress.max_score || 0, type: 'Question Answer' });
                }
            }
        }
    }
    return { allCompleted, scores };
}

function getAllQuizQAItems(module: Module) { 
    const items: Array<{title: string, type: string}> = [];
    if (!module || !Array.isArray(module.lessons)) return items;
    module.lessons.forEach((lesson) => {
        if (!lesson || !Array.isArray(lesson.chapters)) return
        lesson.chapters.forEach((chapter) => {
            if (!chapter || !Array.isArray(chapter.contents)) return;
            chapter.contents.forEach((content) => {
                if (content.content_type === "Quiz" || content.content_type === "Question Answer") {
                    let displayTitle = content.name;
                    if ((content as any).title) {
                        displayTitle = (content as any).title;
                    } else if ((content as any).content_type) {
                        displayTitle = `${content.content_type}`;
                    }
                    items.push({ title: displayTitle, type: content.content_type });
                }
            });
        });
    });
    return items;
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
    // Initialize current position based on user's actual progress
    const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
    const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
    const [reviewing, setReviewing] = useState(false);
    const [quizQAScores, setQuizQAScores] = useState<Array<{title: string, score: number, maxScore: number, type: string}>>([]);

    // Phase 2: Completion data state management
    const [completionData, setCompletionData] = useState<CompletionData>({
        completed_lessons: [],
        completed_chapters: [],
        in_progress_chapters: [],
        current_position: null,
        total_lessons: 0,
        total_chapters: 0,
        overall_progress: 0
    });

    // Get user identifier with multiple fallbacks for Administrator compatibility
    const getUserIdentifier = () => {
        if (!user) return null;
        return user.email || user.name || (user as any).user || (user as any).user_id || (user as any).id || user;
    };

    const userIdentifier = getUserIdentifier();

    // Fetch module data with retry mechanism - only when user and moduleName are available
    const { data: moduleListData, error: moduleListError, isLoading: moduleDataLoading, mutate: refetchModuleData } = useFrappeGetCall<ModuleApiResponse>("novel_lms.novel_lms.api.module_management.LearnerModuleData", {
        user: userIdentifier, // Use robust user identifier extraction
        limit: 1,
        offset: 0,
        filters: [["name", "=", moduleName]]
    }, {
        enabled: !!(userIdentifier && moduleName && !userLoading && userIdentifier !== '') // Only call API when user is loaded and moduleName exists
    });
    
    // Simplified retry mechanism - only retry on actual errors, not empty results
    useEffect(() => {
        if (moduleListError && userIdentifier && moduleName) {
            console.log('🔄 API call failed, retrying in 1 second...', moduleListError);
            const retryTimeout = setTimeout(() => {
                refetchModuleData();
            }, 1000);
            return () => clearTimeout(retryTimeout);
        }
    }, [moduleListError, userIdentifier, moduleName, refetchModuleData]);

    // Retry API call when user becomes available (fixes timing issue)
    useEffect(() => {
        if (userIdentifier && moduleName && !userLoading && !moduleListData && !moduleDataLoading && !moduleListError) {
            console.log('🔄 User became available, triggering module data fetch...', { userIdentifier, moduleName });
            refetchModuleData();
        }
    }, [userIdentifier, moduleName, userLoading, moduleListData, moduleDataLoading, moduleListError, refetchModuleData]);

    // Debug API call state
    useEffect(() => {
        console.log('🔍 API CALL STATE:', {
            moduleName,
            userEmail: user?.email,
            userName: user?.name,
            userIdentifier: userIdentifier,
            fullUserObject: user,
            userKeys: user ? Object.keys(user) : [],
            isLoading: moduleDataLoading,
            hasData: !!moduleListData,
            hasError: !!moduleListError,
            timestamp: new Date().toISOString()
        });
    }, [moduleName, userIdentifier, moduleDataLoading, moduleListData, moduleListError]);
    
    
    // Extract module data only when API call is complete - Fixed extraction paths
    let moduleData = null;
    if (moduleListData && !moduleDataLoading) {
        console.log('🔍 EXTRACTION START:', new Date().toISOString());
        console.log('🔍 API Call completed, extracting module data...');
        
        const response = moduleListData as any;
        console.log('🔍 Full response keys:', Object.keys(response));
        console.log('🔍 Response.message keys:', response?.message ? Object.keys(response.message) : 'no message');
        
        // Replace lines 300-322 with this:
        // Try direct modules path first (unwrapped response)
        if (response?.modules && Array.isArray(response.modules) && response.modules.length > 0) {
            moduleData = response.modules[0];
            console.log('✅ Module data extracted via direct path (modules[0])');
        }
        // Try message.modules (wrapped by frappe-react-sdk)
        else if (response?.message?.modules && Array.isArray(response.message.modules) && response.message.modules.length > 0) {
            moduleData = response.message.modules[0];
            console.log('✅ Module data extracted via message path (message.modules[0])');
        }
        // Try message.message.modules (double-wrapped response) - NEW FIX
        else if (response?.message?.message?.modules && Array.isArray(response.message.message.modules) && response.message.message.modules.length > 0) {
            moduleData = response.message.message.modules[0];
            console.log('✅ Module data extracted via double-wrapped path (message.message.modules[0])');
        }
        else {
            console.log('❌ Failed to extract module data - no modules found in response');
            console.log('🔍 Response structure:', {
                hasModules: !!response?.modules,
                hasMessage: !!response?.message,
                hasMessageModules: !!response?.message?.modules,
                hasMessageMessageModules: !!response?.message?.message?.modules, // Add this
                modulesLength: response?.modules?.length || 0,
                messageModulesLength: response?.message?.modules?.length || 0,
                messageMessageModulesLength: response?.message?.message?.modules?.length || 0, // Add this
                topLevelKeys: Object.keys(response || {}),
                messageKeys: response?.message ? Object.keys(response.message) : [],
                messageMessageKeys: response?.message?.message ? Object.keys(response.message.message) : [], // Add this
                fullResponse: JSON.stringify(response).substring(0, 500)
            });
        }
        
        // Log extracted data for debugging
        if (moduleData) {
            console.log('🔍 Extracted moduleData:', {
                name: moduleData.name,
                name1: moduleData.name1,
                hasLessons: !!moduleData.lessons,
                lessonsLength: moduleData.lessons?.length || 0
            });
            
            // Check if contents have data
            if (moduleData.lessons?.[0]?.chapters?.[0]?.contents?.[0]) {
                const firstContent = moduleData.lessons[0].chapters[0].contents[0];
                console.log('🔍 First content sample:', {
                    name: firstContent.name,
                    contentType: firstContent.content_type,
                    contentReference: firstContent.content_reference,
                    hasData: !!firstContent.data,
                    dataKeys: firstContent.data ? Object.keys(firstContent.data) : []
                });
            }
        }
    }

    // Administrator-specific: Force immediate data display
    useEffect(() => {
        if (isLMSAdmin && moduleData && !module) {
            console.log('🔧 Admin mode: Force setting module data immediately');
            setModule(moduleData);
            setStarted(true);
        }
    }, [isLMSAdmin, moduleData, module]);

    // Post call for starting module
    const { call: startModule } = useFrappePostCall('novel_lms.novel_lms.api.progress_tracking.add_learner_progress');
    // Fetch progress and module structure
    const shouldFetchProgress = started && !!moduleData && !!userIdentifier && userIdentifier !== '' && !!moduleName && !userLoading;
    const { data: progressData } = useFrappeGetCall<ApiResponse<{ module: Module }>>("novel_lms.novel_lms.api.progress_tracking.get_learner_progress", {
        user: userIdentifier,
        module: moduleName
    }, {
        enabled: shouldFetchProgress
    });

    
    // Post call for updating progress
    const { call: updateProgress, loading: updateLoading } = useFrappePostCall('novel_lms.novel_lms.api.progress_tracking.update_learner_progress');
    
    // Phase 2: Completion data API hook with refetch capability - Only enabled when user is available
    const { data: completionDataResponse, error: completionDataError, mutate: refetchCompletionData } = useLearnerCompletionData(
        userIdentifier || '',
        moduleName || '',
        { enabled: !!(userIdentifier && userIdentifier !== '' && moduleName && !userLoading) } // Only enabled when user is properly loaded
    );

    // Phase 2: Update completion data when fetched - Proper State Management
    useEffect(() => {
        try {
            if (completionDataResponse?.message) {
                // Handle the case where the API returns a different structure
                const data = completionDataResponse.message;
                if (data.completed_lessons !== undefined) {
                    // This is the correct structure from our API
                    setCompletionData(data);
                    
                } else {
                    // This might be from a different API call, ignore it
                 
                }
            }
        } catch (error) {
            
        }
    }, [completionDataResponse]);

    // Phase 2: Force completion data refresh when resuming
    useEffect(() => {
        if (started && userIdentifier && moduleName && !isLMSAdmin) {
            
            refetchCompletionData();
        }
    }, [started, userIdentifier, moduleName, isLMSAdmin, refetchCompletionData]);
    
    // Force refresh completion data when module changes (navigation back from dashboard)
    useEffect(() => {
        if (moduleName && userIdentifier && !isLMSAdmin) {
           
            refetchCompletionData();
        }
    }, [moduleName, userIdentifier, isLMSAdmin, refetchCompletionData]);

    // Fix resume bug: Set current position based on user's actual progress
    useEffect(() => {
        if (module?.lessons && !isLMSAdmin) {
            
            // If module is completed, don't set position - let completion screen show
            if (module.progress?.status === "Completed") {
                
                return;
            }
            
            // PRIORITY 1: Use module data's current_position (MOST RELIABLE)
            if ((module.progress as any)?.current_position?.chapter) {
                const currentChapterName = (module.progress as any).current_position.chapter;
                
                // Find the lesson containing this chapter
                const lessonIdx = module.lessons.findIndex(lesson => 
                    lesson.chapters?.some(chapter => chapter.name === currentChapterName)
                );
                
                if (lessonIdx !== -1) {
                    // Find the chapter index within that lesson
                    const chapterIdx = module.lessons[lessonIdx].chapters?.findIndex(
                        chapter => chapter.name === currentChapterName
                    ) ?? 0;
                    
                   
                    setCurrentLessonIdx(lessonIdx);
                    setCurrentChapterIdx(chapterIdx);
                    return;
                }
            }
            
            // PRIORITY 2: Use completion data's in_progress_chapters as fallback
            if (completionData?.in_progress_chapters?.length > 0) {
                const currentChapterName = completionData.in_progress_chapters[0];
                
                
                // Find the lesson containing this chapter
                const lessonIdx = module.lessons.findIndex(lesson => 
                    lesson.chapters?.some(chapter => chapter.name === currentChapterName)
                );
                
                if (lessonIdx !== -1) {
                    // Find the chapter index within that lesson
                    const chapterIdx = module.lessons[lessonIdx].chapters?.findIndex(
                        chapter => chapter.name === currentChapterName
                    ) ?? 0;
                    
                    console.log('🎯 Resume position found (completion data):', { lessonIdx, chapterIdx, currentChapterName });
                    setCurrentLessonIdx(lessonIdx);
                    setCurrentChapterIdx(chapterIdx);
                    return;
                }
            }
            
            // PRIORITY 3: Use completion data's current_position as final fallback
            if (completionData?.current_position) {
                
                
                if (completionData.current_position.type === 'Chapter') {
                    const currentChapterName = completionData.current_position.reference_id;
                    
                    // Find the lesson containing this chapter
                    const lessonIdx = module.lessons.findIndex(lesson => 
                        lesson.chapters?.some(chapter => chapter.name === currentChapterName)
                    );
                    
                    if (lessonIdx !== -1) {
                        // Find the chapter index within that lesson
                        const chapterIdx = module.lessons[lessonIdx].chapters?.findIndex(
                            chapter => chapter.name === currentChapterName
                        ) ?? 0;
                        
                        console.log('🎯 Resume position found (completion data fallback):', { lessonIdx, chapterIdx, currentChapterName });
                        setCurrentLessonIdx(lessonIdx);
                        setCurrentChapterIdx(chapterIdx);
                        return;
                    }
                }
            }
            
            
        }
    }, [module?.progress, module?.lessons, completionData, isLMSAdmin]);

    // Phase 2: Immediate API call on mount to prevent 0% progress
    useEffect(() => {
        if (userIdentifier && moduleName && !isLMSAdmin) {
            
            refetchCompletionData();
        }
    }, [userIdentifier, moduleName, isLMSAdmin, refetchCompletionData]);

    // Retry completion data API when user becomes available (fixes timing issue)
    useEffect(() => {
        if (userIdentifier && userIdentifier !== '' && moduleName && !userLoading && !completionDataResponse && !completionDataError && !isLMSAdmin) {
           
            refetchCompletionData();
        }
    }, [userIdentifier, moduleName, userLoading, completionDataResponse, completionDataError, isLMSAdmin, refetchCompletionData]);

    // Phase 2: Handle completion data error
    useEffect(() => {
        if (completionDataError) {
            console.warn('⚠️ Completion data fetch error:', completionDataError);
            // Keep default completion data state - don't break the page
        }
    }, [completionDataError]);

    // Phase 2: Debug logging for hook dependencies
    useEffect(() => {
        console.log('🔍 Hook dependencies debug:', {
            userEmail: user?.email,
            userName: user?.name,
            userIdentifier: userIdentifier,
            moduleName: moduleName,
            isLMSAdmin: isLMSAdmin,
            reviewing: reviewing,
            started: started,
            completionDataResponse: !!completionDataResponse,
            completionDataError: !!completionDataError
        });
    }, [userIdentifier, moduleName, isLMSAdmin, reviewing, started, completionDataResponse, completionDataError]);

    // Phase 2: Helper function to check if a lesson is completed based on its chapters
    const isLessonCompletedByChapters = (lessonName: string, completedChapters: string[]) => {
        if (!module?.lessons) return false;
        
        const lesson = module.lessons.find(l => l.name === lessonName);
        if (!lesson?.chapters || lesson.chapters.length === 0) return false;
        
        // Check if all chapters in the lesson are completed
        return lesson.chapters.every(chapter => completedChapters.includes(chapter.name));
    };

    // Phase 3: Frontend-only locking using calculated completionData
    const buildIsAccessible = (completionData: CompletionData | null, moduleData: Module | null) => {
        if (!moduleData?.lessons?.length) return () => false;
    
        // Check if module is completed - if so, allow access to everything (especially for review mode)
        if (moduleData.progress?.status === "Completed" || progress?.status === "Completed") {
            
            return () => true; // Allow access to all lessons and chapters
        }
    
        // Use calculated data from getSidebarCompletionData (not empty API arrays)
        const completedLessons = new Set(completionData?.completed_lessons ?? []);
        const completedChapters = new Set(completionData?.completed_chapters ?? []);
        
        console.log('🔍 buildIsAccessible using calculated data:', {
            completedLessons: Array.from(completedLessons),
            completedChapters: Array.from(completedChapters),
            inProgressChapters: completionData?.in_progress_chapters
        });
        
        // Get current position from completionData OR from in_progress_chapters OR from UI state as fallback
        const currentChapter = completionData?.current_position?.type === 'Chapter'
            ? completionData.current_position.reference_id
            : (completionData?.in_progress_chapters?.[0] || module?.lessons?.[currentLessonIdx]?.chapters?.[currentChapterIdx]?.name || null);

        const firstLesson = moduleData.lessons[0]?.name;
        const firstChapter = moduleData.lessons[0]?.chapters?.[0]?.name || null;

        // Find next lesson (first not in completed_lessons)
        const nextLesson = moduleData.lessons.find(l => !completedLessons.has(l.name))?.name || null;
        const nextLessonFirstChapter = nextLesson
            ? (moduleData.lessons.find(l => l.name === nextLesson)?.chapters?.[0]?.name || null)
            : null;

        // Quick mapping chapter -> lesson
        const chapterToLesson = new Map<string, string>();
        for (const l of moduleData.lessons) {
            for (const c of l.chapters || []) {
                chapterToLesson.set(c.name, l.name);
            }
        }

        return (lessonName: string, chapterName?: string) => {
            // 1) First lesson/first chapter
            if (!chapterName) {
                if (lessonName === firstLesson) return true;
                if (completedLessons.has(lessonName)) return true;
                if (nextLesson && lessonName === nextLesson) return true; // lesson-level access (first chapter visible)
                // Current chapter's lesson access
                if (currentChapter && chapterToLesson.get(currentChapter) === lessonName) return true;
                return false;
            }

            // Chapter-level
            if (chapterName === firstChapter) return true;
            if (completedChapters.has(chapterName)) return true;
            if (currentChapter === chapterName) return true;
            if (nextLesson && lessonName === nextLesson && chapterName === nextLessonFirstChapter) return true;
            // Any chapter in a completed lesson is allowed
            if (completedLessons.has(lessonName)) return true;

            return false;
        };
    };

    // Note: isAccessible function moved to sidebarIsAccessible after sidebarCompletionData is created

    // Phase 2: Function to track chapter start (In Progress)
    const trackChapterStart = async (lessonName: string, chapterName: string) => {
        if (!user || !moduleName) return;
        
        try {
            // Check if chapter is already completed
            const isChapterCompleted = completionData?.completed_chapters?.includes(chapterName) || false;
            const isChapterInProgress = completionData?.in_progress_chapters?.includes(chapterName) || false;
            
            if (!isChapterCompleted && !isChapterInProgress) {
                // Track as "In Progress"
                await updateProgress({
                    user: userIdentifier,
                    module: moduleName,
                    lesson: lessonName,
                    chapter: chapterName,
                    status: "In Progress"
                });
                
                // Update local completion data
                setCompletionData(prev => ({
                    ...prev,
                    in_progress_chapters: [...(prev?.in_progress_chapters || []), chapterName]
                }));
                
                // Force refresh completion data to get latest progress
                refetchCompletionData();
                
                
            }
        } catch (error) {
            
        }
    };

    // Update module data when fetched - Consolidated state setting with Admin priority
    useEffect(() => {
        
        if (moduleData && !module) { // Only set if module is not already set to prevent race conditions
            
            setModule(moduleData);
            
            // For Administrator, immediately set started to true to bypass welcome screen
            if (isLMSAdmin) {
                setStarted(true);
                
            } else if (moduleData.progress?.status === "In Progress" || moduleData.progress?.status === "Completed") {
                setStarted(true);
                setProgress(moduleData.progress);
            }
        }
    }, [moduleData, isLMSAdmin, module]);

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

    // Sync UI indices with progress (only when progress has valid current_lesson/chapter)
    useEffect(() => {
        if (
            progress &&
            (module?.lessons?.length ?? 0) > 0 &&
            progress.current_lesson && // Only run if progress has valid current_lesson
            progress.current_chapter    // Only run if progress has valid current_chapter
        ) {
            let lessonIdx = module?.lessons?.findIndex(l => l.name === progress.current_lesson) ?? 0;
            if (lessonIdx < 0) lessonIdx = 0;
            const lesson = module?.lessons[lessonIdx];
            let chapterIdx = lesson?.chapters?.length
                ? lesson.chapters.findIndex(c => c.name === progress.current_chapter)
                : 0;
            if (chapterIdx < 0) chapterIdx = 0;
            
            console.log('🔄 Syncing UI indices with progress:', { lessonIdx, chapterIdx, current_lesson: progress.current_lesson, current_chapter: progress.current_chapter });
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(chapterIdx);
        }
    }, [progress, module]);

    // Force progress recalculation when completion data changes
    useEffect(() => {
        // This will trigger a re-render and recalculate overallProgress
        console.log('🔄 Progress recalculation triggered - completionData changed');
    }, [completionData, currentLessonIdx, currentChapterIdx, module]);

    // Unified Progress Calculation - Single Source of Truth
    const getUnifiedProgress = () => {
        // If module is completed, return 100%
        if (progress?.status === "Completed") return 100;
        
        // PRIORITY 1: Use module progress data (most reliable when completion data is incomplete)
        if (module?.progress && (module.progress as any)?.overall_progress !== undefined) {
            
            return (module.progress as any).overall_progress;
        }
        
        // PRIORITY 2: Use completion data only if it's valid and not 0
        if (completionData?.overall_progress !== undefined && completionData.overall_progress > 0) {
            
            return completionData.overall_progress;
        }
        
        // Fallback: Calculate from completion data arrays
        if (completionData?.total_chapters && completionData.total_chapters > 0) {
            const completedCount = completionData.completed_chapters?.length || 0;
            const progressPercentage = Math.round((completedCount / completionData.total_chapters) * 100 * 100) / 100;
           
            return progressPercentage;
        }
        
        // Final fallback: Use module progress data if available, otherwise 0
        if (module?.progress && (module.progress as any)?.overall_progress !== undefined) {
           
            return (module.progress as any).overall_progress;
        }
        
        // If no progress data available, return 0
       
        return 0;
    };
    // Add this new function after getUnifiedProgress()
    const getCompletionBasedProgress = () => {
        // Check if module is completed (via progress OR module data) - works in review mode too
        if (progress?.status === "Completed" || module?.progress?.status === "Completed") {
            return 100;
        }
        
        if (!sidebarCompletionData) return getUnifiedProgress();
        
        const completedChapters = sidebarCompletionData.completed_chapters?.length || 0;
        
        // Calculate total chapters from module data instead of API data
        const totalChapters = module?.lessons?.reduce((total, lesson) => total + lesson.chapters.length, 0) || 0;
        
        // If all chapters are completed, return 100% (especially important for review mode)
        if (totalChapters > 0 && completedChapters === totalChapters) {
            return 100;
        }
        
        if (totalChapters === 0) return 0;
        
        const progressPercentage = Math.round((completedChapters / totalChapters) * 100 * 100) / 100;
        console.log('📊 Using sidebar completion data progress:', progressPercentage, `(${completedChapters}/${totalChapters})`);
        
        return progressPercentage;
    };
    // Phase 2: Use unified progress calculation - Single Source of Truth
    const overallProgress = getUnifiedProgress();
    
    // Convert completion data to sidebar-compatible format with real-time updates
    const getSidebarCompletionData = () => {
        if (isLMSAdmin) return undefined;
        
        // Use real completion data if available, but calculate completed items if arrays are empty
        if (completionData) {
            console.log('🔍 Using real completion data for sidebar:', completionData);
            
            // If completion data has empty arrays, calculate completed items from in_progress_chapters
            let completedChapters = completionData.completed_chapters || [];
            let completedLessons = completionData.completed_lessons || [];
            
            // If arrays are empty, calculate completed items from module data or in_progress_chapters
            if (completedChapters.length === 0 && completedLessons.length === 0) {
                let currentChapterName = null;
                
                // Try to get current chapter from in_progress_chapters first
                if (completionData.in_progress_chapters?.length > 0) {
                    currentChapterName = completionData.in_progress_chapters[0];
                   
                }
                // Fallback to module data current position
                else if (module?.progress && (module.progress as any)?.current_position?.chapter) {
                    currentChapterName = (module.progress as any).current_position.chapter;
                    
                }
                
                if (currentChapterName && module?.lessons) {
                    let foundCurrentChapter = false;
                    
                    module.lessons.forEach((lesson: any) => {
                        let lessonCompleted = true;
                        
                        lesson.chapters.forEach((chapter: any) => {
                            if (chapter.name === currentChapterName) {
                                foundCurrentChapter = true;
                                lessonCompleted = false;
                            } else if (!foundCurrentChapter) {
                                // Chapter is before current chapter, so it's completed
                                completedChapters.push(chapter.name);
                            } else {
                                // Chapter is after current chapter, so it's not completed
                                lessonCompleted = false;
                            }
                        });
                        
                        // If all chapters in lesson are completed, mark lesson as completed
                        if (lessonCompleted && lesson.chapters.length > 0) {
                            completedLessons.push(lesson.name);
                        }
                    });
                    
                    console.log('🔍 Calculated completed items:', {
                        completedChapters,
                        completedLessons,
                        currentChapterName
                    });
                }
            }
            
            return {
                completed_lessons: completedLessons,
                completed_chapters: completedChapters,
                in_progress_chapters: completionData.in_progress_chapters || [],
                current_position: completionData.current_position,
                total_lessons: completionData.total_lessons || 0,
                total_chapters: completionData.total_chapters || 0,
                overall_progress: completionData.overall_progress || 0
            };
        }
        
        // Fallback to module progress data
        if (!module?.progress) return undefined;
        
        const moduleProgress = module.progress as any;
        const completionDetails = moduleProgress.completion_details || {};
        const currentPosition = moduleProgress.current_position;
        
        // Calculate completed chapters based on current position
        const completedChapters: string[] = [];
        const completedLessons: string[] = [];
        const inProgressChapters: string[] = [];
        
        // Check if module is completed
        if (moduleProgress.status === "Completed") {
            // If module is completed, mark ALL chapters and lessons as completed
           
            module.lessons.forEach((lesson: any) => {
                completedLessons.push(lesson.name);
                lesson.chapters.forEach((chapter: any) => {
                    completedChapters.push(chapter.name);
                });
            });
        } else if (module?.lessons && currentPosition?.chapter) {
            // Normal logic for in-progress modules
            const currentChapterName = currentPosition.chapter;
            let foundCurrentChapter = false;
            
            // Go through all lessons and chapters to determine completion status
            module.lessons.forEach((lesson: any) => {
                let lessonCompleted = true;
                
                lesson.chapters.forEach((chapter: any) => {
                    const chapterName = chapter.name;
                    
                    if (chapterName === currentChapterName) {
                        foundCurrentChapter = true;
                        inProgressChapters.push(chapterName);
                        lessonCompleted = false;
                    } else if (!foundCurrentChapter) {
                        // Chapters before current position are completed
                        completedChapters.push(chapterName);
                    } else {
                        // Chapters after current position are not completed
                        lessonCompleted = false;
                    }
                });
                
                // If all chapters in lesson are completed, mark lesson as completed
                if (lessonCompleted && lesson.chapters.length > 0) {
                    completedLessons.push(lesson.name);
                }
            });
        }
        
        
        
        return {
            completed_lessons: completedLessons,
            completed_chapters: completedChapters,
            in_progress_chapters: inProgressChapters,
            current_position: currentPosition,
            total_lessons: module?.lessons?.length || 0,
            total_chapters: completionDetails.total_lesson_chapter_items || 0,
            overall_progress: moduleProgress.overall_progress || 0
        };
    };
    
    const sidebarCompletionData = getSidebarCompletionData();
    
    // Create the sidebar isAccessible function using sidebar completion data
    const sidebarIsAccessible = buildIsAccessible(sidebarCompletionData || null, module);
    
    // Phase 2: Show loading state only if completion data is actually loading and not available
    const isCompletionDataLoading = !completionDataResponse && !completionDataError && userIdentifier && userIdentifier !== '' && moduleName && !completionData;
    
    // Phase 2: Debug progress calculation
    
    
    // Synchronize completion data with module progress for real-time updates
    useEffect(() => {
        if (completionData && progress) {
            console.log('🔄 Syncing completion data with progress state');
            // Update progress state to match completion data
            setProgress(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: prev.status || "In Progress"
                };
            });
        }
    }, [completionData]);
    
    // Update sidebar completion data when completion data changes for real-time sidebar updates
    useEffect(() => {
        if (completionData) {
            console.log('🔄 Updating sidebar completion data for real-time updates');
            // This will trigger sidebar re-render with correct data
            // The getSidebarCompletionData function will be called again with updated completionData
        }
    }, [completionData, module?.progress]);
    
    // Debug sidebar data
    

    // Navigation handlers
    const handlePrevious = async () => {
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
        if (!reviewing && !completed && user) {
            await updateProgress({
                user: userIdentifier,
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
            
            // Update module progress to reflect current chapter
            if (module.lessons[lessonIdx]?.chapters[chapterIdx]) {
                const updatedModule = { ...module };
                if (updatedModule.lessons[lessonIdx]?.chapters[chapterIdx]) {
                    updatedModule.lessons[lessonIdx].chapters[chapterIdx].progress = "In Progress";
                }
                setModule(updatedModule);
            }
            
            // Force refresh completion data to get latest progress
            refetchCompletionData();
        }
    };

    const handleNext = async () => {
        if (!module?.lessons?.length) return;
        if (completed) {
            return;
        }
        if (reviewing) {
            let lessonIdx = currentLessonIdx;
            let chapterIdx = currentChapterIdx;
            const currentLesson = module.lessons[lessonIdx];
            if (chapterIdx < currentLesson.chapters.length - 1) {
                chapterIdx += 1;
                setCurrentLessonIdx(lessonIdx);
                setCurrentChapterIdx(chapterIdx);
            } else if (lessonIdx < module.lessons.length - 1) {
                lessonIdx += 1;
                chapterIdx = 0;
                setCurrentLessonIdx(lessonIdx);
                setCurrentChapterIdx(chapterIdx);
            } else {
                // End of review: show completion screen again
                setReviewing(false);
            }
            return;
        }
        if (!user) return;
        if (progress?.status === "Completed") {
            setCompleted(true);
            return;
        }
        
        let lessonIdx = currentLessonIdx;
        let chapterIdx = currentChapterIdx;
        const currentLesson = module.lessons[lessonIdx];
        const currentChapter = currentLesson.chapters[chapterIdx];
        
        // Phase 2: Smart completion checking - only update if not already completed
        const isCurrentChapterCompleted = completionData?.completed_chapters?.includes(currentChapter.name) || false;
        const isCurrentLessonCompleted = completionData?.completed_lessons?.includes(currentLesson.name) || false;
        
        
        
        // If this is the last chapter of the last lesson, check Quiz/QA completion
        const isLastLesson = lessonIdx === module.lessons.length - 1;
        const isLastChapter = chapterIdx === currentLesson.chapters.length - 1;
        
        if (isLastLesson && isLastChapter) {
            const { allCompleted, scores } = await checkQuizQACompletion(module, user);
            if (!allCompleted) {
                const incompleteTitles = await getIncompleteQuizQATitles(module, user);
                toast.warning(
                    <div>
                        <div>You must complete all Quiz and Question/Answer sections before completing this module.</div>
                        {incompleteTitles.length > 0 && (
                            <ul className="list-disc ml-6 mt-2">
                                {incompleteTitles.map((title, idx) => (
                                    <li key={title + idx}>{title}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
                return;
            }
            setQuizQAScores(scores);
            setCompleted(true);
            setProgress({
                ...progress!,
                status: "Completed"
            });
            
            // Only update backend if not already completed
            if (!isCurrentChapterCompleted) {
                await updateProgress({
                    user: userIdentifier,
                    module: moduleName,
                    lesson: currentLesson.name,
                    chapter: currentChapter.name,
                    status: "Completed"
                });
                
                // Optimistic Update: Immediately update UI with real-time progress calculation
                setCompletionData(prev => {
                    const newCompletedChapters = [...(prev?.completed_chapters || []), currentChapter.name];
                    const newInProgressChapters = (prev?.in_progress_chapters || []).filter(ch => ch !== currentChapter.name);
                    const newOverallProgress = prev?.total_chapters ? Math.round((newCompletedChapters.length / prev.total_chapters) * 100 * 100) / 100 : 0;
                    
                    // Check if current lesson is now completed
                    const isCurrentLessonNowCompleted = isLessonCompletedByChapters(currentLesson.name, newCompletedChapters);
                    const newCompletedLessons = [...(prev?.completed_lessons || [])];
                    
                    if (isCurrentLessonNowCompleted && !newCompletedLessons.includes(currentLesson.name)) {
                        newCompletedLessons.push(currentLesson.name);
                        
                    }
                    
                    
                    
                    return {
                        ...prev,
                        completed_chapters: newCompletedChapters,
                        completed_lessons: newCompletedLessons,
                        in_progress_chapters: newInProgressChapters,
                        overall_progress: newOverallProgress
                    };
                });
            }
            return;
        }
        
        // Mark current chapter as completed (only if not already completed)
        if (!isCurrentChapterCompleted) {
            await updateProgress({
                user: userIdentifier,
                module: moduleName,
                lesson: currentLesson.name,
                chapter: currentChapter.name,
                status: "Completed"
            });
            
            // Optimistic Update: Immediately update UI with real-time progress calculation
            setCompletionData(prev => {
                const newCompletedChapters = [...(prev?.completed_chapters || []), currentChapter.name];
                const newInProgressChapters = (prev?.in_progress_chapters || []).filter(ch => ch !== currentChapter.name);
                const newOverallProgress = prev?.total_chapters ? Math.round((newCompletedChapters.length / prev.total_chapters) * 100 * 100) / 100 : 0;
                
                // Check if current lesson is now completed
                const isCurrentLessonNowCompleted = isLessonCompletedByChapters(currentLesson.name, newCompletedChapters);
                const newCompletedLessons = [...(prev?.completed_lessons || [])];
                
                if (isCurrentLessonNowCompleted && !newCompletedLessons.includes(currentLesson.name)) {
                    newCompletedLessons.push(currentLesson.name);
                    
                }
                
                
                
                return {
                    ...prev,
                    completed_chapters: newCompletedChapters,
                    completed_lessons: newCompletedLessons,
                    in_progress_chapters: newInProgressChapters,
                    overall_progress: newOverallProgress
                };
            });
            
           
        } else {
            
        }
        
        // Force refresh completion data to get latest progress
        refetchCompletionData();
        
        // Calculate next position
        if (chapterIdx < currentLesson.chapters.length - 1) {
            // Move to next chapter in the same lesson
            chapterIdx += 1;
        } else if (lessonIdx < module.lessons.length - 1) {
            // Move to next lesson and its first chapter
            lessonIdx += 1;
            chapterIdx = 0;
        }
        
        // Navigate to next position
        setCurrentLessonIdx(lessonIdx);
        setCurrentChapterIdx(chapterIdx);
        
        // Update local progress state
        const nextLesson = module.lessons[lessonIdx];
        const nextChapter = nextLesson.chapters[chapterIdx];
        setProgress({
            ...progress!,
            current_lesson: nextLesson.name,
            current_chapter: nextChapter.name,
            status: "In Progress"
        });
        
        // Track chapter start
        trackChapterStart(nextLesson.name, nextChapter.name);
        
        console.log('🔄 Navigated to:', nextLesson.name, nextChapter.name);
    };

    const handleStartModule = async () => {
        if (!user || !module) return;
        setIsTransitioning(true);
        try {
            const result = await startModule({
                user: userIdentifier,
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

    // Sidebar click handlers (for learners)
    const handleLessonClick = (lessonName: string) => {
        if (!module?.lessons?.length) return;
        
        // Check if lesson is accessible using sidebar completion data
        const isAccessible = sidebarIsAccessible(lessonName);
       
        if (!isAccessible) {
            toast.error("Complete previous lessons to unlock this content");
            return;
        }
        
        const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
        if (lessonIdx !== -1) {
            setCurrentLessonIdx(lessonIdx);
            setCurrentChapterIdx(0);
            // Update progress state so sidebar highlight matches
            if (progress && progress.status !== "Completed") {
                setProgress({
                    ...progress,
                    current_lesson: module.lessons[lessonIdx].name,
                    current_chapter: module.lessons[lessonIdx].chapters[0]?.name || "",
                    status: "In Progress"
                });
                // Optionally, call updateProgress API here to persist
                if (user) {
                    updateProgress({
                        user: userIdentifier,
                        module: moduleName,
                        lesson: module.lessons[lessonIdx].name,
                        chapter: module.lessons[lessonIdx].chapters[0]?.name || "",
                        status: "In Progress"
                    });
                }
            }
            
            // Force refresh completion data to get latest progress
            refetchCompletionData();
        }
    };

    const handleChapterClick = (lessonName: string, chapterName: string) => {
        if (!module?.lessons?.length) return;
        
        // Check if chapter is accessible using sidebar completion data
        const isAccessible = sidebarIsAccessible(lessonName, chapterName);
        
        if (!isAccessible) {
            toast.error("Complete previous chapters to unlock this content");
            return;
        }
        
        const lessonIdx = module.lessons.findIndex(l => l.name === lessonName);
        if (lessonIdx !== -1) {
            const lesson = module.lessons[lessonIdx];
            const chapterIdx = lesson?.chapters?.findIndex(c => c.name === chapterName) ?? -1;
            if (chapterIdx !== -1) {
                setCurrentLessonIdx(lessonIdx);
                setCurrentChapterIdx(chapterIdx);
                // Update progress state so sidebar highlight matches
                if (progress && progress.status !== "Completed") {
                    setProgress({
                        ...progress,
                        current_lesson: module.lessons[lessonIdx].name,
                        current_chapter: module.lessons[lessonIdx].chapters[chapterIdx]?.name || "",
                        status: "In Progress"
                    });
                    // Track chapter start
                    trackChapterStart(lessonName, chapterName);
                }
                
                // Force refresh completion data to get latest progress
                refetchCompletionData();
            }
        }
    };

    useEffect(() => {
        if (moduleListData || moduleListError) {
            setIsLoading(false);
        }
    }, [moduleListData, moduleListError]);
    
    // Update loading state based on module data loading
    useEffect(() => {
        if (moduleDataLoading !== undefined) {
            setIsLoading(moduleDataLoading);
        }
    }, [moduleDataLoading]);

    useEffect(() => {
        if (module && user && progress?.status === "Completed") {
            (async () => {
                const { scores } = await checkQuizQACompletion(module, user);
                setQuizQAScores(scores);
            })();
        }
    }, [module, user, progress?.status]);

    // --- ADMIN: UI-only navigation, no progress, no welcome, no completion ---
    if (isLMSAdmin) {
        if (isLoading || userLoading || moduleDataLoading) {
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
    // --- END ADMIN LOGIC ---

    // --- LEARNER LOGIC (default, as before) ---
    if (isLoading || userLoading || moduleDataLoading) {
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
    
    // Additional loading check for moduleDataLoading (redundant but safe)
    if (moduleDataLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-muted-foreground">Loading module details...</div>
            </div>
        );
    }
    
    // Debug logging for module state
    console.log('🔍 Current module state:', { 
        module, 
        hasModule: !!module, 
        moduleName: module?.name,
        moduleDataLoading,
        moduleListData: !!moduleListData,
        moduleListError: !!moduleListError
    });
    
    // Show loading animation while processing module data
    if (!module && moduleListData && !moduleDataLoading && !isLoading && !moduleListError) {
        
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-muted-foreground">Loading module details...</div>
            </div>
        );
    }

    // Only show "module not found" if we have data but no module after processing
    if (!module && !moduleDataLoading && !isLoading && moduleListData && !moduleListError) {
       
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={emptyAnimation} loop style={{ width: 180, height: 180 }} />
                <div className="mt-4 text-muted-foreground">Module not found</div>
            </div>
        );
    }
    
    // Final loading state check - if we still don't have module data and we're not loading, show loading
    if (!module && !moduleDataLoading && !isLoading && !moduleListData && !moduleListError) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                <div className="mt-4 text-muted-foreground">Loading module details...</div>
            </div>
        );
    }
    const currentLesson = module?.lessons?.[currentLessonIdx];
    const currentChapter = currentLesson?.chapters?.[currentChapterIdx];
    const isFirst = currentLessonIdx === 0 && currentChapterIdx === 0;

    // If module is completed, show completion screen immediately
    if (progress?.status === "Completed" && !reviewing) {
        const allQuizQAItems = module ? getAllQuizQAItems(module) : [];
        return (
            <div className="flex min-h-screen bg-muted gap-6 w-full items-center justify-center">
                <CompletionScreen
                    onReview={() => {
                        setReviewing(true);
                        setCurrentLessonIdx(0);
                        setCurrentChapterIdx(0);
                    }}
                    quizQAScores={{
                        allItems: allQuizQAItems,
                        scores: quizQAScores
                    }}
                />
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            {progress?.status === "Not Started" && showWelcome ? (
                <motion.div
                    key="welcome"
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* Back Button */}
                    <div className="absolute left-8 top-8 z-10">
                        <Link href={ROUTES.LEARNER_MODULES}>
                            <Button variant="outline" size="icon" className="rounded-full shadow hover:bg-primary/10">
                                <ArrowLeft className="h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex flex-col items-center w-full mx-auto px-4 space-y-6 pt-8">
                        {/* Module Image or Avatar */}
                        <h1 className="text-4xl font-bold leading-tight">{module?.name1}</h1>
                        
                        {/* Lottie/Animated SVG Placeholder */}
                        <div className=" inset-0 w-full h-full flex items-center justify-center pointer-events-none z-0">
                            <Lottie
                                animationData={learningAnimation}
                                loop
                                style={{ width: "40vw", height: "40vh"}}
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex justify-center mb-2">
                                {module?.image ? (
                                    <img
                                        src={module.image.startsWith('http') ? module.image : `${LMS_API_BASE_URL}${module.image}`}
                                        alt={module.name1}
                                        className="w-32 h-32 object-cover rounded-2xl shadow-lg border border-border bg-white"
                                    />
                                ) : (
                                    <div className="w-32 h-32 flex items-center justify-center rounded-2xl shadow-lg border border-border bg-primary/10 text-primary text-6xl font-bold">
                                        {module?.name1?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {module?.description && (
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">About this module</h2>
                                    <p className="text-lg text-muted-foreground max-w-xl mx-auto" dangerouslySetInnerHTML={{ __html: module.description }} />
                                </div>
                            )}
                        </div>
                    
                        <Button
                            size="lg"
                            className="text-lg px-10 py-6 rounded-xl shadow-lg bg-primary text-white hover:bg-primary/90 transition-all duration-200 mt-2"
                            onClick={handleStartModule}
                            disabled={isTransitioning}
                        >
                            Start Learning
                        </Button>
                    </div>
                </motion.div>
            ) : (
                <div className="flex min-h-screen bg-muted gap-6 w-full">
                    {/* Sidebar on the left */}
                    <div className=" w-80 border-r flex-shrink-0">
                        <ModuleSidebar
                            module={module}
                            progress={isLMSAdmin ? null : progress}
                            started={started || reviewing}
                            overallProgress={getCompletionBasedProgress()} // Show actual progress, not loading state
                            onLessonClick={handleLessonClick}
                            onChapterClick={handleChapterClick}
                            currentLessonName={module?.lessons?.[currentLessonIdx]?.name}
                            currentChapterName={module?.lessons?.[currentLessonIdx]?.chapters?.[currentChapterIdx]?.name}
                            mode={isLMSAdmin ? 'admin' : (reviewing ? 'review' : 'learner')}
                            completionData={isLMSAdmin ? undefined : sidebarCompletionData}
                            isAccessible={isLMSAdmin ? () => true : sidebarIsAccessible} // admin can access everything, learners use locking
                        />
                    </div>
                    {/* Main Content */}
                    <div className="flex-1 flex justify-center items-start p-8">
                        <div className="w-full  rounded-xl shadow p-8">
                            {(started || reviewing) && currentLesson && currentChapter && module && (
                                <div className="space-y-8">
                                    {/* Lesson and Chapter Header */}
                                    <div>
                                        <h2 className="text-2xl font-bold mb-2">{currentLesson.lesson_name}</h2>
                                        <h3 className="text-xl font-semibold mb-6">{currentChapter.title}</h3>
                                    </div>
                                    {/* Chapter Contents */}
                                    {currentChapter.contents && currentChapter.contents.length > 0 && (
                                        <div className="space-y-6">
                                    {currentChapter.contents.map((content) => (
                                                <ContentRenderer
                                            key={content.name}
                                                    contentType={content.content_type}
                                                    contentReference={content.content_reference || content.name}
                                                    moduleId={module.name}
                                                    contentData={content.data}
                                                    isParentLoading={moduleDataLoading}
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
                        </div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}