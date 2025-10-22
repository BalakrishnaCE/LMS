import { useMemo } from "react";
import { useEffect, useState } from "react";
import { useFrappeGetDoc } from "frappe-react-sdk";
import Quiz from "@/pages/Modules/Contents/Quiz";
import QuestionAnswer from "@/pages/Modules/Contents/QuestionAnswer";
import SlideContent from "@/pages/Modules/Contents/SlideContent";
import FileAttachContent from "@/pages/Modules/Contents/FileAttachContent";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import StepsContent from './Contents/StepsContent';
import CheckListContent from './Contents/CheckListContent';
import AccordionContent from './Contents/AccordionContent';
import { useAPI } from "../../lib/api";
import { LMS_API_BASE_URL } from "@/config/routes";

// Video player component with fallback for failed loads
function VideoPlayerWithFallback({ videoUrl }: { videoUrl: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative aspect-video bg-gray-900 rounded-lg shadow-lg flex items-center justify-center"
      >
        <div className="text-center text-white">
          <div className="text-sm opacity-75">Video not available</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative aspect-video"
    >
      <video
        src={videoUrl}
        controls
        className="w-full h-full rounded-lg shadow-lg bg-gray-900"
        onError={() => {
          console.error('Video failed to load:', videoUrl);
          setHasError(true);
        }}
      />
    </motion.div>
  );
}
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
  onPrevious?: (targetChapterIndex?: number) => void;
  isFirst?: boolean;
  isLast?: boolean;
  activeChapterId?: string | null;
  moduleId?: string;
  lessonData?: any;
  onChapterIndexChange?: (chapterIndex: number) => void;
}

export function useLessonDoc(lessonName: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const api = useAPI();

  useEffect(() => {
    setLoading(true);
    api.getModuleDetails()
      .then((res: any) => {
        setData(res.message || res);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      });
  }, [lessonName, api]);

  return { data, loading, error };
}

export function useChapterDoc(chapterName: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const api = useAPI();

  useEffect(() => {
    setLoading(true);
    api.getModuleDetails()
      .then((res: any) => {
        setData(res.message || res);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      });
  }, [chapterName, api]);

  return { data, loading, error };
}

function ContentRenderer({ contentType, contentReference, moduleId }: { 
  contentType: string; 
  contentReference: string; 
  moduleId?: string;
}) {
  const { data: content, error, isValidating } = useFrappeGetDoc(contentType, contentReference);


  if (isValidating) return <div>Loading content...</div>;
  if (error) {
    console.error('ContentRenderer error:', error);
    return <div>Error loading content: {contentType}</div>;
  }
  if (!content) {
    console.warn('ContentRenderer: No content found for', contentType, contentReference);
    return null;
  }

  const renderContent = () => {
    switch (contentType) {
      case "Text Content":
        const textContent = content.body || content.value || "";
        // Clean up the content to avoid disorganized display
        const cleanContent = textContent.trim();
        if (!cleanContent) return null;
        
        return (
          <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground prose-ul:text-foreground prose-ol:text-foreground">
            <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
          </div>
        );
      case "Image Content":
        const imageUrl = content.attach ? 
          (content.attach.startsWith('http') ? content.attach : `${LMS_API_BASE_URL}${content.attach}`) : 
          null;
        
        if (!imageUrl) {
          console.warn('Image Content: No attach URL found', content);
          return null;
        }
        
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <img
              src={imageUrl}
              alt={content.title || "Content"}
              className="max-w-full h-auto rounded-lg shadow-lg"
              onError={(e) => {
                console.error('Image failed to load:', imageUrl);
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => {
                // Image loaded successfully
              }}
            />
          </motion.div>
        );
      case "Video Content":
        const videoUrl = content.video ? 
          (content.video.startsWith('http') ? content.video : `${LMS_API_BASE_URL}${content.video}`) : 
          null;
        
        if (!videoUrl) {
          console.warn('Video Content: No video URL found', content);
          return (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-video bg-gray-900 rounded-lg shadow-lg flex items-center justify-center"
            >
              <div className="text-center text-white">
                <div className="text-sm opacity-75">Video not available</div>
              </div>
            </motion.div>
          );
        }
        
        return <VideoPlayerWithFallback videoUrl={videoUrl} />;
      case "Audio Content":
        const audioUrl = content.attach ? 
          (content.attach.startsWith('http') ? content.attach : `${LMS_API_BASE_URL}${content.attach}`) : 
          null;
        
        if (!audioUrl) {
          console.warn('Audio Content: No attach URL found', content);
          return null;
        }
        
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="font-semibold text-lg mb-2 text-center">{content.title}</div>
            <audio
              src={audioUrl}
              controls
              className="w-full rounded-lg shadow-lg"
              onError={(e) => {
                console.error('Audio failed to load:', audioUrl);
                e.currentTarget.style.display = 'none';
              }}
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
        console.warn('Unsupported content type:', contentType, content);
        return (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            <p className="font-medium">Unsupported Content Type</p>
            <p className="text-sm">Content type "{contentType}" is not supported yet.</p>
          </div>
        );
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

export function LessonWithChapters({ onNext, onPrevious, isFirst, isLast, activeChapterId, moduleId, lessonData, onChapterIndexChange }: LessonWithChaptersProps) {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // Use the passed lesson data instead of fetching it
  const lesson = lessonData;
  const loading = !lessonData;
  const error = null;

  const sortedChapters = useMemo(
    () => (lesson?.chapters || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    [lesson?.chapters]
  );

  useEffect(() => {
    if (activeChapterId && sortedChapters) {
      const index = sortedChapters.findIndex((chapter: any) => chapter.name === activeChapterId);
      if (index !== -1) {
        setCurrentChapterIndex(index);
      }
    }
  }, [activeChapterId, sortedChapters]);

  // Notify parent when chapter index changes
  useEffect(() => {
    if (onChapterIndexChange) {
      onChapterIndexChange(currentChapterIndex);
    }
  }, [currentChapterIndex, onChapterIndexChange]);

  if (loading) return <div>Loading lesson...</div>;
  if (error) return <div>Error loading lesson</div>;
  if (!lesson) return null;

  const currentChapter = sortedChapters[currentChapterIndex];
  const isLastChapter = currentChapterIndex === sortedChapters.length - 1;
  const isFirstChapter = currentChapterIndex === 0;

  const handleNextChapter = () => {
    if (!isLastChapter) {
      setCurrentChapterIndex(prev => prev + 1);
      // Scroll to top when navigating to next chapter
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onNext) {
      onNext();
      // Scroll to top when navigating to next lesson
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousChapter = () => {
    if (!isFirstChapter) {
      setCurrentChapterIndex(prev => prev - 1);
      // Scroll to top when navigating to previous chapter
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onPrevious) {
      // When going to previous lesson, we need to find out how many chapters the previous lesson has
      // For now, we'll let the parent handle this by not passing a specific index
      // The parent should set the chapter index to the last chapter of the previous lesson
      onPrevious();
      // Scroll to top when navigating to previous lesson
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <CardTitle className="text-xl font-semibold flex items-center justify-between">
              {lesson.lesson_name}
              <span className="text-sm font-normal text-muted-foreground bg-primary/10 px-2 py-1 rounded-md">
                Admin Preview
              </span>
            </CardTitle>
            <div className="prose prose-sm mt-2 text-muted-foreground" dangerouslySetInnerHTML={{ __html: lesson.description }} />
          </CardHeader>
        </Card>
      </motion.div>

      {/* Current Chapter */}
      <AnimatePresence>
        {currentChapter && (
          <motion.div
            key={currentChapter.name}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ChapterWithContents 
              moduleId={moduleId}
              chapterData={currentChapter}
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

function ChapterWithContents({ moduleId, chapterData }: { moduleId?: string; chapterData?: any }) {
  // Use the passed chapter data instead of fetching it
  const chapter = chapterData;
  const loading = !chapterData;
  const error = null;

  if (loading) return <div>Loading chapter...</div>;
  if (error) return <div>Error loading chapter</div>;
  if (!chapter) return null;

  // Filter out invalid content and sort properly
  const sortedContents = (chapter.contents || [])
    .filter((content: any) => content && content.content_type && content.content_reference)
    .sort((a: { order?: number; idx?: number }, b: { order?: number; idx?: number }) => {
      // Sort by order if available, otherwise by idx, otherwise maintain original order
      const aOrder = a.order || a.idx || 0;
      const bOrder = b.order || b.idx || 0;
      return aOrder - bOrder;
    });


  return (
    <div className="space-y-6">
      {/* Chapter Header */}
      <div className="bg-card/50 backdrop-blur-sm border border-primary/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {chapter.title}
        </h2>
        {/* Temporarily removed scoring display to fix the "0" issue */}
      </div>

      {/* Chapter Contents */}
      <div className="space-y-8">
        <AnimatePresence>
          {sortedContents.map((content: any, index: number) => (
            <motion.div
              key={content.content_reference}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card/30 backdrop-blur-sm border border-border/50 rounded-lg p-6 shadow-sm"
            >
              <ContentRenderer
                contentType={content.content_type}
                contentReference={content.content_reference}
                moduleId={moduleId}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LessonWithChapters;