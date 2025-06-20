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
import { LMS_API_BASE_URL } from "@/config/routes";

const contentStyles = `
    .prose ul {
        list-style-type: disc;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose > div >ul li {
        margin-bottom: 0.5em;
    }
    .prose ol {
        list-style-type: decimal;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose > div > ol li {
        margin-bottom: 0.5em;
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
    .prose {
        max-width: 100%;
    }
    .prose img {
        max-width: 100%;
        height: auto;
    }
    .prose h1 {
        font-size: 2em;
        font-weight: 600;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    .prose h2 {
        font-size: 1.5em;
        font-weight: 500;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    .prose h3 {
        font-size: 1.25em;
        font-weight: 400;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    .prose p {
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
`;
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
    <div>
    <style>{contentStyles}</style>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full"
    >
      {renderContent()}
    </motion.div>
    </div>
  );
} 