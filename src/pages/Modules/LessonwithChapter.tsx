import { useMemo } from "react";
import { useEffect, useState } from "react";
import Quiz from "@/pages/Modules/Contents/Quiz";
import QuestionAnswer from "@/pages/Modules/Contents/QuestionAnswer";
import SlideContent from "@/pages/Modules/Contents/SlideContent";
import FileAttachContent from "@/pages/Modules/Contents/FileAttachContent";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StepsContent from './Contents/StepsContent';
import CheckListContent from './Contents/CheckListContent';
import AccordionContent from './Contents/AccordionContent';
import { LMS_API_BASE_URL } from "@/config/routes";
const contentStyles = `
    .prose ul {
        list-style-type: disc;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose ol {
        list-style-type: disc;
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

export interface LessonWithChaptersProps {
  lessonName: string;
  onNext?: () => void;
  onPrevious?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  activeChapterId?: string | null;
  moduleId?: string;
}

export function useLessonDoc(lessonName: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${LMS_API_BASE_URL}/api/resource/Lesson/${lessonName}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      });
  }, [lessonName]);

  return { data, loading, error };
}

export function useChapterDoc(chapterName: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${LMS_API_BASE_URL}/api/resource/Chapter/${chapterName}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      });
  }, [chapterName]);

  return { data, loading, error };
}

function ContentRenderer({ contentType, contentReference, moduleId }: { 
  contentType: string; 
  contentReference: string; 
  moduleId?: string;
}) {
  const { data: content, error, isValidating } = useFrappeGetDoc(contentType, contentReference);

  if (isValidating) return <div>Loading content...</div>;
  if (error) return <div>Error loading content</div>;
  if (!content) return null;

  const renderContent = () => {
    switch (contentType) {
      case "Text Content":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("text-sm prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground")}
            dangerouslySetInnerHTML={{ __html: content.body || content.value || "" }}
          />
        );
      case "Image Content":
        return (
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={LMS_API_BASE_URL+content.attach}
            alt="Content"
            className="max-w-full h-auto rounded-lg shadow-lg"
          />
        );
      case "Video Content":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative aspect-video"
          >
            <video
              src={LMS_API_BASE_URL+content.video}
              controls
              className="w-full h-full rounded-lg shadow-lg"
            />
          </motion.div>
        );
      case "Audio Content":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="font-semibold text-lg mb-2 text-center">{content.title}</div>
            <audio
              src={LMS_API_BASE_URL+content.attach}
              controls
              className="w-full rounded-lg shadow-lg"
            />
          </motion.div>
        );
      case "Quiz":
        return <Quiz quizReference={contentReference} moduleId={moduleId} />;
      case "Slide Content":
        return <SlideContent slideContentId={contentReference} />;
      case "Question Answer":
        return <QuestionAnswer questionAnswerId={contentReference} moduleId={moduleId} />;
      case "Steps":
        return <StepsContent content={content} />;
      case "Check List":
        return <CheckListContent content={content} />;
      case "File Attach":
        return <FileAttachContent content={content} />;
      case "Iframe Content":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative aspect-[4/3]"
          >
            <div className="font-semibold text-lg mb-2 text-center">{content.title}</div>
            <iframe
              src={content.url}
              className="w-full h-full rounded-lg shadow-lg"
            />
          </motion.div>
        );
      case "Accordion Content":
        return <AccordionContent content={content} />;
      default:
        return <div>Unsupported content type: {contentType}</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {renderContent()}
    </motion.div>
  );
}

export function LessonWithChapters({ lessonName, onNext, onPrevious, isFirst, isLast, activeChapterId, moduleId }: LessonWithChaptersProps) {
  const { data: lesson, loading, error } = useLessonDoc(lessonName);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  const sortedChapters = useMemo(
    () => (lesson?.chapters || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    [lesson?.chapters]
  );

  useEffect(() => {
    if (activeChapterId && sortedChapters) {
      const index = sortedChapters.findIndex((chapter: any) => chapter.chapter === activeChapterId);
      if (index !== -1) {
        setCurrentChapterIndex(index);
      }
    }
  }, [activeChapterId, sortedChapters]);

  if (loading) return <div>Loading lesson...</div>;
  if (error) return <div>Error loading lesson</div>;
  if (!lesson) return null;

  const currentChapter = sortedChapters[currentChapterIndex];
  const isLastChapter = currentChapterIndex === sortedChapters.length - 1;
  const isFirstChapter = currentChapterIndex === 0;

  const handleNextChapter = () => {
    if (!isLastChapter) {
      setCurrentChapterIndex(prev => prev + 1);
    } else if (onNext) {
      onNext();
    }
  };

  const handlePreviousChapter = () => {
    if (!isFirstChapter) {
      setCurrentChapterIndex(prev => prev - 1);
    } else if (onPrevious) {
      onPrevious();
    }
  };

  return (
    <div className="space-y-6">
      <style>{contentStyles}</style>
      
      {/* Lesson Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">{lesson.lesson_name}</CardTitle>
            <div className="prose prose-sm mt-2 text-muted-foreground" dangerouslySetInnerHTML={{ __html: lesson.description }} />
          </CardHeader>
        </Card>
      </motion.div>

      {/* Current Chapter */}
      <AnimatePresence>
        {currentChapter && (
          <motion.div
            key={currentChapter.chapter}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ChapterWithContents 
              chapterName={currentChapter.chapter} 
              moduleId={moduleId}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mt-6"
      >
        <Button
          variant="outline"
          onClick={handlePreviousChapter}
          disabled={isFirstChapter && isFirst}
          className="gap-2 hover:bg-primary/10"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          Chapter {currentChapterIndex + 1} of {sortedChapters.length}
        </div>
        <Button
          variant="outline"
          onClick={handleNextChapter}
          disabled={isLastChapter && isLast}
          className="gap-2 hover:bg-primary/10"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </div>
  );
}

function ChapterWithContents({ chapterName, moduleId }: { chapterName: string; moduleId?: string }) {
  const { data: chapter, loading, error } = useChapterDoc(chapterName);

  if (loading) return <div>Loading chapter...</div>;
  if (error) return <div>Error loading chapter</div>;
  if (!chapter) return null;

  const sortedContents = (chapter.contents || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order);

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {chapter.title}
          {/* {chapter.scoring && (
            <span className="ml-2 text-sm text-primary ">{chapter.scoring} pts</span>
          )} */}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AnimatePresence>
          {sortedContents.map((content: any, index: number) => (
            <motion.div
              key={content.content_reference}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg overflow-hidden"
            >
              <ContentRenderer
                contentType={content.content_type}
                contentReference={content.content_reference}
                moduleId={moduleId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default LessonWithChapters;