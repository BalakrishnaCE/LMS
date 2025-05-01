import { useFrappeGetDoc } from "frappe-react-sdk";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useMemo } from "react";
import { useEffect, useState } from "react";

export function useLessonDoc(lessonName: string) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://10.80.4.72/api/resource/Lesson/${lessonName}`, {
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

function ContentRenderer({ contentType, contentReference }: { contentType: string, contentReference: string }) {
  // Only fetch if both are present
  const { data: content, error, isValidating } = useFrappeGetDoc(contentType, contentReference);

  if (isValidating) return <div>Loading content...</div>;
  if (error) return <div>Error loading content</div>;
  if (!content) return null;

  // Render based on type
  switch (contentType) {
    case "Text Content":
      return (
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: content.body || content.value || "" }}
        />
      );
    case "Image":
      return <img src={content.image || content.url} alt="Content" className="max-w-full h-auto rounded-lg" />;
    case "Video Content":
      return <video src={"http://10.80.4.72"+content.video || content.url} controls className="max-w-full rounded-lg" />;
    case "PDF":
      return <iframe src={content.pdf || content.url} className="w-full h-96 rounded-lg" />;
    // Add more cases as needed
    default:
      return <div>Unsupported content type: {contentType}</div>;
  }
}

export function LessonWithChapters({ lessonName }: { lessonName: string }) {

  const { data: lesson, loading, error } = useLessonDoc(lessonName);

  console.log("LessonWithChapters", lessonName, lesson);
  // Move useMemo BEFORE any return
  const sortedChapters = useMemo(
    () => (lesson?.chapters || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order),
    [lesson?.chapters]
  );

  if (loading) return <div>Loading lesson...</div>;
  if (error) return <div>Error loading lesson</div>;
  if (!lesson) return null;

  return (
    <AccordionItem value={lesson.name}>
      <AccordionTrigger>
        <span>{lesson.lesson_name}</span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="mb-2 text-muted-foreground">{lesson.description}</div>
        <Accordion type="single" collapsible className="w-full">
          {sortedChapters.map((chapter: { chapter: string }) => (
            <ChapterWithContents key={chapter.chapter} chapterName={chapter.chapter} />
          ))}
        </Accordion>
      </AccordionContent>
    </AccordionItem>
  );
}

// --- ChapterWithContents component ---
function ChapterWithContents({ chapterName }: { chapterName: string }) {
  const { data: chapter, error, isValidating } = useFrappeGetDoc("Chapter", chapterName, {
    fields: ["name", "title", "scoring", "contents"],
  });

  if (isValidating) return <div>Loading chapter...</div>;
  if (error) return <div>Error loading chapter</div>;
  if (!chapter) return null;

  const sortedContents = (chapter.contents || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order);

  return (
    <AccordionItem value={chapter.name}>
      <AccordionTrigger>
        <span>{chapter.title}</span>
        {chapter.scoring ? <span className="ml-2 text-xs text-primary">{chapter.scoring} pts</span> : null}
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          {sortedContents.map((content: any) => (
            <div key={content.content_reference} >
              <ContentRenderer
                contentType={content.content_type}
                contentReference={content.content_reference}
              />
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export default LessonWithChapters;