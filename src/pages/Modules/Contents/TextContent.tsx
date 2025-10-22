import React from 'react';
import { motion } from 'framer-motion';

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
  contentReference,
  moduleId,
  onProgressUpdate,
  onComplete,
  isCompleted
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-content-container"
    >
      <div className="space-y-4">
        {content.title && !content.title.match(/^chapter-?\d*-text$/i) && !content.title.match(/^chapter-?\d*-.*text$/i) && (
          <h2 className="text-2xl font-bold">{content.title}</h2>
        )}
        
        <div 
          className="prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground"
          dangerouslySetInnerHTML={{ __html: content.body || content.value || "" }}
        />
      </div>
    </motion.div>
  );
}
