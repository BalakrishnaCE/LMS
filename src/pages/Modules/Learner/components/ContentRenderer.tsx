import { motion } from "framer-motion";
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
  moduleId?: string;
  contentData?: any; // Pre-fetched content data
  isParentLoading?: boolean; // NEW: Track if parent is still loading
}

// Dedicated component props interface
interface DedicatedComponentProps {
  contentType: string;
  contentReference: string;
  moduleId?: string;
  contentData?: any;
}

// Component for content types that need API fetching
function FetchableContent({ 
  contentType, 
  content, 
  error, 
  isValidating 
}: { 
  contentType: string; 
  content: any; 
  error: any; 
  isValidating: boolean;
}) {
  console.log('🔹 FetchableContent state:', {
    contentType,
    isValidating,
    hasContent: !!content,
    hasError: !!error,
    errorDetails: error
  });
  
  if (isValidating) {
    console.log('⏳ FetchableContent: Still loading...');
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    console.log('❌ FetchableContent: Error state -', {
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorType: error?.exc_type
    });
    
    // For 404 errors (content not found), hide silently
    if (error?.exc_type === 'DoesNotExistError' || error?.httpStatus === 404) {
      console.log('🔇 FetchableContent: Silently ignoring 404 error (content not found)');
      return null;
    }
    
    return (
      <div className="text-red-500 p-4 text-center">
        Content temporarily unavailable
      </div>
    );
  }
  
  if (!content) {
    console.log('⚠️ FetchableContent: No content data');
    return null;
  }
  
  console.log('✅ FetchableContent: Rendering content');

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

// Separate components to avoid conditional hook usage
function DedicatedComponentRenderer({ 
  contentType, 
  contentReference, 
  moduleId,
  contentData
}: DedicatedComponentProps) {
  // Debug logging for render tracking
  console.log('🎨 DedicatedComponentRenderer render:', {
    contentType,
    contentReference,
    hasContentData: !!contentData,
    timestamp: new Date().toISOString()
  });
  
  switch (contentType) {
    case "Quiz":
      return <Quiz quizReference={contentReference} moduleId={moduleId} contentData={contentData} />;
    case "Question Answer":
      return <QuestionAnswer questionAnswerId={contentReference} moduleId={moduleId} contentData={contentData} />;
    case "Slide Content":
      return <SlideContent slideContentId={contentReference} contentData={contentData} />;
    default:
      return <div>Unsupported content type: {contentType}</div>;
  }
}

function FetchableComponentRenderer({ 
  contentType, 
  contentReference,
  contentData,
  isParentLoading
}: { 
  contentType: string; 
  contentReference: string;
  contentData?: any;
  isParentLoading?: boolean;
}) {
  console.log('🎨 FetchableComponentRenderer render:', {
    contentType,
    contentReference,
    hasContentData: !!contentData,
    isParentLoading
  });
  
  // CRITICAL FIX: Wait for parent to finish loading before attempting to fetch
  // If parent is still loading and we don't have contentData yet, show loading state
  if (isParentLoading && !contentData) {
    console.log('⏳ Parent still loading, waiting...');
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // CRITICAL FIX: Never make API calls - only use pre-fetched contentData
  // If content data is provided, use it directly
  if (contentData) {
    console.log('✅ Using pre-fetched content data');
    return (
      <FetchableContent 
        contentType={contentType}
        content={contentData}
        error={null}
        isValidating={false}
      />
    );
  }
  
  // If no contentData is provided, it means the backend didn't return it
  // This could be a missing/deleted content - silently handle it
  console.log('⚠️ No content data provided for:', contentType, contentReference);
  return null;
}

// Main ContentRenderer component
export function ContentRenderer({ 
  contentType, 
  contentReference, 
  moduleId, 
  contentData,
  isParentLoading = false 
}: ContentRendererProps) {
  // Content types that have their own components and don't need to be fetched
  const hasDedicatedComponent = ["Quiz", "Question Answer", "Slide Content"].includes(contentType);
  
  console.log('🎨 ContentRenderer render:', {
    contentType,
    contentReference,
    hasDedicatedComponent,
    hasContentData: !!contentData,
    isParentLoading
  });
  
  // CRITICAL FIX: Don't render anything if we don't have a contentReference yet
  if (!contentReference) {
    console.log('⚠️ ContentRenderer: No contentReference, showing loading state');
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // CRITICAL FIX: Don't render anything if contentData is null (content doesn't exist in backend)
  if (contentData === null) {
    console.log('⚠️ ContentRenderer: contentData is null, content does not exist, hiding component');
    return null;
  }

  // For content types with dedicated components, render them without calling useFrappeGetDoc
  if (hasDedicatedComponent) {
    return (
      <DedicatedComponentRenderer 
        contentType={contentType}
        contentReference={contentReference}
        moduleId={moduleId}
        contentData={contentData}
      />
    );
  }

  // For other content types, fetch and render
  return (
    <FetchableComponentRenderer
      contentType={contentType}
      contentReference={contentReference}
      contentData={contentData}
      isParentLoading={isParentLoading}
    />
  );
} 