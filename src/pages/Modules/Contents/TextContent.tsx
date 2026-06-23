import { motion } from 'framer-motion';
import { LMS_API_BASE_URL } from '@/config/routes';

interface TextContentProps {
  content: any;
  contentReference: string;
  moduleId?: string;
  onProgressUpdate?: (progress: any) => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export default function TextContent({
  content,
  contentReference: _contentReference,
  moduleId: _moduleId,
  onProgressUpdate: _onProgressUpdate,
  onComplete: _onComplete,
  isCompleted: _isCompleted
}: TextContentProps) {

  if (!content) {
    return (
      <div className="text-content-container">
        <div className="error-message">
          <h3 className="font-semibold">No Content Data</h3>
          <p>Text content data is not available.</p>
        </div>
      </div>
    );
  }

  // Check if content body is empty or just whitespace
  let bodyContent = content.body || content.value || "";
  
  // Fix relative image URLs to point to the backend
  if (bodyContent) {
    const apiBaseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
    const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
    bodyContent = bodyContent.replace(/src=["'](\/files\/[^"']+)["']/gi, `src="${cleanApiBaseUrl}$1"`);
    bodyContent = bodyContent.replace(/src=["'](\/private\/files\/[^"']+)["']/gi, `src="${cleanApiBaseUrl}$1"`);
  }

  const hasContent = bodyContent.trim() !== "" && bodyContent.trim() !== "<p></p>" && bodyContent.trim() !== "<p><br></p>";

  // Filter out placeholder titles like "txt", "text", etc.
  const shouldShowTitle = content.title &&
    !content.title.match(/^chapter-?\d*-text$/i) &&
    !content.title.match(/^chapter-?\d*-.*text$/i) &&
    content.title.toLowerCase().trim() !== "txt" &&
    content.title.toLowerCase().trim() !== "text" &&
    content.title.trim().length > 2;

  // Don't render if there's no actual content
  if (!hasContent && !shouldShowTitle) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-content-container"
    >
      <div className="space-y-4">
        {shouldShowTitle && (
          <h2 className="text-2xl font-bold">{content.title}</h2>
        )}

        {hasContent && (
          <>
            <style>{`
              .text-content-prose ol {
                list-style-type: decimal;
                padding-left: 1.5em;
                margin: 1em 0;
              }
              .text-content-prose ol li {
                margin-bottom: 0.5em;
                display: list-item;
              }
              .text-content-prose ul {
                list-style-type: disc;
                padding-left: 1.5em;
                margin: 1em 0;
              }
              .text-content-prose ul li {
                margin-bottom: 0.5em;
                display: list-item;
              }
              .text-content-prose p {
                margin: 1em 0;
              }
              /* Table Styles */
              .text-content-prose table {
                border-collapse: collapse;
                margin: 1em 0;
                width: 100%;
                table-layout: fixed;
              }
              .text-content-prose th,
              .text-content-prose td {
                border: 1px solid var(--primary) !important;
                padding: 8px;
                vertical-align: top;
                min-width: 1em;
              }
              .text-content-prose th {
                font-weight: bold;
                background-color: var(--muted);
                text-align: left;
                opacity: 0.9;
              }
            `}</style>
            <div
              className="prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground prose-ol:text-foreground prose-ul:text-foreground text-content-prose"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{ __html: bodyContent }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
