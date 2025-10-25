import React, { useRef, useEffect } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, PlayCircle, ArrowLeft, ChevronDown, ChevronUp, BookOpen, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

interface ModuleSidebarProps {
  module: any;
  progress: any;
  started: boolean;
  overallProgress: number;
  onLessonClick?: (lessonName: string) => void;
  onChapterClick?: (lessonName: string, chapterName: string) => void;
  currentLessonName?: string;
  currentChapterName?: string;
  mode: 'admin' | 'learner' | 'review';
  // Phase 2: Completion data for smart icon display
  completionData?: {
    completed_lessons: string[];
    completed_chapters: string[];
    in_progress_chapters: string[];
    current_position: {
      type: string;
      reference_id: string;
      start_time: string;
    } | null;
    total_lessons: number;
    total_chapters: number;
    overall_progress: number;
  };
  // Phase 3: Locking mechanism
  isAccessible?: (lessonName: string, chapterName?: string) => boolean;
}

export function ModuleSidebar({
  module,
  progress,
  started,
  overallProgress,
  onLessonClick,
  onChapterClick,
  currentLessonName,
  currentChapterName,
  mode,
  completionData,
  isAccessible
}: ModuleSidebarProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);
  const [expandedLessons, setExpandedLessons] = React.useState<Set<string>>(new Set());
  const chapterRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Expand logic based on mode
  useEffect(() => {
    if (mode === 'admin' && module?.lessons) {
      setExpandedLessons(new Set(module.lessons.map((lesson: any) => lesson.name)));
    } else if (mode === 'learner' && progress?.current_lesson) {
      setExpandedLessons(new Set([progress.current_lesson]));
    } else if (mode === 'review' && currentLessonName) {
      setExpandedLessons(new Set([currentLessonName]));
    }
  }, [progress, module, mode, currentLessonName]);

  useEffect(() => {
    if ((mode === 'learner' && progress?.current_chapter && chapterRefs.current[progress.current_chapter]) ||
        (mode === 'review' && currentChapterName && chapterRefs.current[currentChapterName])) {
      const chapterKey = mode === 'learner' ? progress?.current_chapter : currentChapterName;
      chapterRefs.current[chapterKey]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [progress?.current_chapter, currentChapterName, mode]);

  const toggleLesson = (lessonName: string) => {
    if (mode === 'admin') {
      setExpandedLessons(prev => {
        const newSet = new Set(prev);
        if (newSet.has(lessonName)) {
          newSet.delete(lessonName);
        } else {
          newSet.add(lessonName);
        }
        return newSet;
      });
    }
  };

  // Phase 2: Helper function to check if a lesson is completed using completion data
  const isLessonCompleted = (lesson: any) => {
    // Use completion data if available (more reliable)
    if (completionData && completionData.completed_lessons) {
      const isCompleted = completionData.completed_lessons.includes(lesson.name);
      console.log('🔍 Lesson completion check:', {
        lessonName: lesson.name,
        completedLessons: completionData.completed_lessons,
        isCompleted: isCompleted
      });
      return isCompleted;
    }
    
    // Fallback to old logic
    if (lesson.progress === "Completed") return true;
    if (!lesson.chapters || lesson.chapters.length === 0) return false;
    
    // Check if all chapters in the lesson are completed
    return lesson.chapters.every((chapter: any) => isChapterCompleted(chapter, lesson));
  };

  // Phase 2: Helper function to check if a chapter is completed using completion data
  const isChapterCompleted = (chapter: any, lesson: any) => {
    // Use completion data if available (more reliable)
    if (completionData && completionData.completed_chapters) {
      const isCompleted = completionData.completed_chapters.includes(chapter.name);
      console.log('🔍 Chapter completion check:', {
        chapterName: chapter.name,
        lessonName: lesson.name,
        completedChapters: completionData.completed_chapters,
        isCompleted: isCompleted
      });
      return isCompleted;
    }
    
    // Fallback to old logic
    if (chapter.progress === "Completed") return true;
    
    // Check if this chapter is before the current chapter in progress
    if (progress?.current_lesson && progress?.current_chapter) {
      const currentLessonIdx = module?.lessons?.findIndex((l: any) => l.name === progress.current_lesson) ?? -1;
      const lessonIdx = module?.lessons?.findIndex((l: any) => l.name === lesson.name) ?? -1;
      
      if (lessonIdx < currentLessonIdx) {
        return true; // Lesson is before current lesson, so all chapters are completed
      } else if (lessonIdx === currentLessonIdx) {
        const currentChapterIdx = lesson.chapters?.findIndex((c: any) => c.name === progress.current_chapter) ?? -1;
        const chapterIdx = lesson.chapters?.findIndex((c: any) => c.name === chapter.name) ?? -1;
        return chapterIdx < currentChapterIdx; // Chapter is before current chapter
      }
    }
    
    return false;
  };

  // Phase 2: Helper function to check if a chapter is in progress
  const isChapterInProgress = (chapter: any) => {
    // Use completion data if available (more reliable)
    if (completionData && completionData.in_progress_chapters) {
      return completionData.in_progress_chapters.includes(chapter.name);
    }
    
    // Fallback to old logic
    return chapter.progress === "In Progress";
  };

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full border-r border-border overflow-y-auto bg-card/50 backdrop-blur-sm"
    >
      <div className="p-4 space-y-6">
        <Link href={ROUTES.LEARNER_MODULES} className="inline-block">
          <Button variant="outline" size="sm" className="gap-2 hover:bg-primary hover:text-secondary">
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
            {module?.name1}
          </motion.h1>
          
          {/* Admin Indicator and Edit Button */}
          {mode === 'admin' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
              <BookOpen className="h-4 w-4" />
              <span>Admin Preview Mode</span>
              {module?.name && (
                <Link href={`/edit/${module.name}`}>
                  <Button variant="outline" size="sm" className="gap-2 ml-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3zm0 0v3a2 2 0 002 2h3" /></svg>
                    Edit Module
                  </Button>
                </Link>
              )}
            </div>
          )}
          
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
                  <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: module?.description || "" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Progress bar - only for learners */}
          {started && mode !== 'admin' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">
                  {overallProgress === -1 ? "Loading..." : `${Math.round(overallProgress)}%`}
                </span>
              </div>
              <Progress value={overallProgress === -1 ? 0 : overallProgress} className="h-2" />
            </motion.div>
          )}
        </div>

        {/* Lesson Navigation */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Lessons</h2>
          <div className="space-y-2">
            {module?.lessons?.map((lesson: any, index: number) => {
              const isExpanded = expandedLessons.has(lesson.name);
              const isCurrentLesson = lesson.name === currentLessonName || (lesson.chapters && lesson.chapters.some((chapter: any) => chapter.name === currentChapterName));
              
              return (
                <motion.div
                  key={lesson.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "rounded-lg transition-all duration-200",
                    isCurrentLesson
                      ? "bg-primary/10"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm p-2 rounded-lg font-medium flex items-center justify-between",
                      isCurrentLesson
                        ? "text-primary"
                        : "text-foreground",
                      // Locked content styling
                      mode !== 'admin' && isAccessible && !isAccessible(lesson.name)
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    )}
                    onClick={() => {
                      // Check if lesson is accessible before allowing click
                      if (mode !== 'admin' && isAccessible && !isAccessible(lesson.name)) {
                        return; // Don't allow click for locked content
                      }
                      onLessonClick?.(lesson.name);
                      toggleLesson(lesson.name);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Progress indicators only for learners */}
                      {mode !== 'admin' && (
                        <>
                          {isLessonCompleted(lesson) ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : lesson.name === currentLessonName ? (
                            <PlayCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </>
                      )}
                      {lesson.lesson_name}
                      {/* Lock icon for inaccessible lessons */}
                      {mode !== 'admin' && isAccessible && !isAccessible(lesson.name) && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    {/* Expand/collapse indicator for admin */}
                    {mode === 'admin' && lesson.chapters && lesson.chapters.length > 0 && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Show chapters if expanded (admin) or if it's the current lesson (learner/review) */}
                  {(isExpanded || (mode !== 'admin' && isCurrentLesson)) && lesson.chapters && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="pl-4 pb-2 space-y-1 overflow-hidden"
                    >
                      {lesson.chapters.map((chapter: any, cidx: number) => {
                        let isCurrentChapter = false;
                        if (mode === 'admin') {
                          isCurrentChapter = chapter.name === currentChapterName;
                        } else if (mode === 'review') {
                          isCurrentChapter = chapter.name === currentChapterName;
                        } else {
                          isCurrentChapter = chapter.name === progress?.current_chapter;
                        }
                        return (
                          <div
                            key={chapter.name}
                            ref={el => { 
                              if (mode === 'learner' || mode === 'review') {
                                chapterRefs.current[chapter.name] = el;
                              }
                            }}
                            className={cn(
                              "text-sm p-2 rounded-md transition-all duration-200",
                              isCurrentChapter
                                ? "bg-primary/20 text-primary font-medium"
                                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground",
                              // Locked content styling
                              mode !== 'admin' && isAccessible && !isAccessible(lesson.name, chapter.name)
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Check if chapter is accessible before allowing click
                              if (mode !== 'admin' && isAccessible && !isAccessible(lesson.name, chapter.name)) {
                                return; // Don't allow click for locked content
                              }
                              onChapterClick?.(lesson.name, chapter.name);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              {/* Progress indicators only for learners */}
                              {mode !== 'admin' && (
                                <>
                                  {isChapterCompleted(chapter, lesson) ? (
                                    <CheckCircle className="h-3 w-3 text-primary" />
                                  ) : isChapterInProgress(chapter) || chapter.name === currentChapterName ? (
                                    <PlayCircle className="h-3 w-3 text-primary" />
                                  ) : (
                                    <Circle className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </>
                              )}
                              {chapter.title}
                              {/* Lock icon for inaccessible chapters */}
                              {mode !== 'admin' && isAccessible && !isAccessible(lesson.name, chapter.name) && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 