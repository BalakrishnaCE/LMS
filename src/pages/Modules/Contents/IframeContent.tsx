import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface IframeContentProps {
  content: any;
  contentReference: string;
  moduleId?: string;
  onProgressUpdate?: (progress: any) => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export default function IframeContent({
  content,
  contentReference,
  moduleId,
  onProgressUpdate,
  onComplete,
  isCompleted
}: IframeContentProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    onProgressUpdate?.({
      progress: 100,
      loaded: true
    });
    onComplete?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="iframe-content-container"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">{content.title}</h3>
        
        <div className="relative aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={content.url}
            className="w-full h-full rounded-lg"
            onLoad={handleIframeLoad}
            title={content.title || "Embedded Content"}
            allowFullScreen
          />
          
          {!iframeLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        {content.description && (
          <p className="text-muted-foreground text-center">{content.description}</p>
        )}
      </div>
    </motion.div>
  );
}
