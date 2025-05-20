import React from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, PlayCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/config/routes";

interface ModuleSidebarProps {
  module: any;
  progress: any;
  started: boolean;
  overallProgress: number;
  onLessonClick?: (lessonName: string) => void;
  onChapterClick?: (lessonName: string, chapterName: string) => void;
}

export function ModuleSidebar({
  module,
  progress,
  started,
  overallProgress,
  onLessonClick,
  onChapterClick
}: ModuleSidebarProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = React.useState(false);

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="w-full border-r border-border overflow-y-auto bg-card/50 backdrop-blur-sm"
    >
      <div className="p-4 space-y-6">
        <Link href={ROUTES.LEARNER_MODULES} className="inline-block">
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
            {module?.name1}
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
                  <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: module?.description || "" }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {started && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </motion.div>
          )}
        </div>

        {/* Lesson Navigation */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Lessons</h2>
          <div className="space-y-2">
            {module?.lessons?.map((lesson: any, index: number) => (
              <motion.div
                key={lesson.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "rounded-lg transition-all duration-200",
                  lesson.name === progress?.current_lesson
                    ? "bg-primary/10"
                    : "hover:bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "text-sm p-2 rounded-lg cursor-pointer font-medium",
                    lesson.name === progress?.current_lesson
                      ? "text-primary"
                      : "text-foreground"
                  )}
                  onClick={() => onLessonClick?.(lesson.name)}
                >
                  <div className="flex items-center gap-2">
                    {lesson.progress === "Completed" ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : lesson.name === progress?.current_lesson ? (
                      <PlayCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground" />
                    )}
                    {lesson.lesson_name}
                  </div>
                </div>
                {lesson.name === progress?.current_lesson && lesson.chapters && (
                  <div className="pl-4 pb-2 space-y-1">
                    {lesson.chapters.map((chapter: any, cidx: number) => (
                      <div
                        key={chapter.name}
                        className={cn(
                          "text-sm p-2 rounded-md cursor-pointer transition-all duration-200",
                          chapter.name === progress?.current_chapter
                            ? "bg-primary/20 text-primary font-medium"
                            : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
                        )}
                        onClick={() => onChapterClick?.(lesson.name, chapter.name)}
                      >
                        <div className="flex items-center gap-2">
                          {chapter.progress === "Completed" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : chapter.name === progress?.current_chapter ? (
                            <PlayCircle className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          {chapter.title}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 