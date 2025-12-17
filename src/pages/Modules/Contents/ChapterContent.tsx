import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface ChapterContentProps {
  content: any;
  contentReference: string;
  moduleId?: string;
  onProgressUpdate?: (progress: any) => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export default function ChapterContent({
  content,
  contentReference,
  moduleId,
  onProgressUpdate,
  onComplete,
  isCompleted
}: ChapterContentProps) {
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const element = contentRef.current;
      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const progress = (scrollTop / scrollHeight) * 100;
      
      setReadProgress(progress);
      
      // Update progress every 25%
      if (Math.floor(progress / 25) > Math.floor(readProgress / 25)) {
        onProgressUpdate?.({
          progress: Math.floor(progress),
          scrollTop,
          scrollHeight
        });
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [readProgress, onProgressUpdate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="chapter-content-container"
    >
      <div className="space-y-6">
        <div className="text-center">
          {content.title && !content.title.match(/^chapter-?\d*-text$/i) && !content.title.match(/^chapter-?\d*-.*text$/i) && (
            <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
          )}
          {content.subtitle && (
            <p className="text-xl text-muted-foreground">{content.subtitle}</p>
          )}
        </div>
        
        <div 
          ref={contentRef}
          className="prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground max-h-96 overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: content.content || content.body || "" }}
        />
        
        {/* Reading progress indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Chapter Progress</span>
            <span>{Math.floor(readProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${readProgress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
