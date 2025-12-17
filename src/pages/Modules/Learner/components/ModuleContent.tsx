import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import ContentRenderer from "@/pages/Modules/Learner/components/ContentRenderer";

interface ModuleContentProps {
  currentLesson: any;
  currentChapter: any;
  currentContent: any;
  isFirst: boolean;
  isLast: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  isUpdating: boolean;
  showHeader?: boolean;
  showNavigation?: boolean;
  moduleId?: string;
  onContentProgressUpdate?: (contentRef: string, progress: any) => void;
}

export function ModuleContent({
  currentLesson,
  currentChapter,
  currentContent,
  isFirst,
  isLast,
  onPrevious,
  onNext,
  onComplete,
  isUpdating,
  showHeader = true,
  showNavigation = true,
  moduleId,
  onContentProgressUpdate
}: ModuleContentProps) {
  const handleContentProgressUpdate = (contentRef: string, progress: any) => {
    onContentProgressUpdate?.(contentRef, progress);
  };

  const handleContentComplete = (contentRef: string) => {
    // Content completed
  };
  return (
    <motion.div
      key={currentLesson.name + currentContent.name}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {showHeader && (
        <>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">{currentLesson.lesson_name}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{currentChapter.title}</CardTitle>
            </CardHeader>
          </Card>
        </>
      )}
      <ContentRenderer
        contentType={currentContent.content_type}
        contentReference={currentContent.name}
        moduleId={moduleId}
        onProgressUpdate={(progress) => handleContentProgressUpdate(currentContent.name, progress)}
        onContentComplete={handleContentComplete}
      />
      {showNavigation && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mt-6"
        >
          {!isFirst && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="gap-2 hover:bg-primary/10"
            >
              Previous
            </Button>
          )}
          {isLast ? (
            <Button
              onClick={onComplete}
              disabled={isUpdating}
              className="gap-2 hover:bg-primary/10"
            >
              {isUpdating ? "Updating..." : "Mark as Complete"}
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (onNext) {
                  onNext();
                } else {
                  console.error("🔍 onNext function is undefined!");
                }
              }}
              className="gap-2 hover:bg-primary/10"
            >
              Next
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
} 