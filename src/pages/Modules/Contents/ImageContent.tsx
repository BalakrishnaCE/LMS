import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LMS_API_BASE_URL } from '@/config/routes';

interface ImageContentProps {
  content: any;
  contentReference: string;
  moduleId?: string;
  onProgressUpdate?: (progress: any) => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export default function ImageContent({
  content,
  contentReference,
  moduleId,
  onProgressUpdate,
  onComplete,
  isCompleted
}: ImageContentProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Debug logging
  console.log('ImageContent - Content data:', content);

  // Normalize URL to handle both relative and full URLs
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${LMS_API_BASE_URL.replace(/\/$/, '')}${url}`;
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    onProgressUpdate?.({
      progress: 100,
      loaded: true
    });
    onComplete?.();
  };

  if (!content) {
    return (
      <div className="image-content-container">
        <div className="error-message">
          <h3 className="font-semibold">No Content Data</h3>
          <p>Image content data is not available.</p>
        </div>
      </div>
    );
  }

  if (!content.attach) {
    return (
      <div className="image-content-container">
        <div className="error-message">
          <h3 className="font-semibold">Image not present</h3>
          <p>Image file is not available for this content.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="image-content-container"
    >
      <div className="space-y-4">
        {content.title && !content.title.match(/\.(jfif|jpg|jpeg|png|gif|webp|bmp)$/i) && (
          <h3 className="text-lg font-semibold">{content.title}</h3>
        )}
        
        <div className="relative">
          <motion.img
            src={getImageUrl(content.attach)}
            alt={content.title || "Content"}
            className="max-w-full h-auto rounded-lg shadow-lg"
            onLoad={handleImageLoad}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0.5 }}
            transition={{ duration: 0.3 }}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        {content.description && (
          <p className="text-muted-foreground">{content.description}</p>
        )}
      </div>
    </motion.div>
  );
}
