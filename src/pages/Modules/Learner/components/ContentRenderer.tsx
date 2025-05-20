import React from "react";
import { motion } from "framer-motion";
import { useFrappeGetDoc } from "frappe-react-sdk";
import { cn } from "@/lib/utils";
import Quiz from "@/pages/Modules/Contents/Quiz";
import QuestionAnswer from "@/pages/Modules/Contents/QuestionAnswer";
import SlideContent from "@/pages/Modules/Contents/SlideContent";
import FileAttachContent from "@/pages/Modules/Contents/FileAttachContent";
import StepsContent from "@/pages/Modules/Contents/StepsContent";
import CheckListContent from "@/pages/Modules/Contents/CheckListContent";
import AccordionContent from "@/pages/Modules/Contents/AccordionContent";

interface ContentRendererProps {
  contentType: string;
  contentReference: string;
}

export function ContentRenderer({ contentType, contentReference }: ContentRendererProps) {
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
            src={"http://10.80.4.72"+content.attach}
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
              src={"http://10.80.4.72"+content.video}
              controls
              className="w-full h-full rounded-lg shadow-lg"
            />
          </motion.div>
        );
      case "Quiz":
        return <Quiz quizReference={contentReference} />;
      case "Slide Content":
        return <SlideContent slideContentId={contentReference} />;
      case "Question Answer":
        return <QuestionAnswer questionAnswerId={contentReference} />;
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