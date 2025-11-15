import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { LMS_API_BASE_URL } from '@/config/routes';
import { useMediaManager } from '@/contexts/MediaManagerContext';

interface VideoContentProps {
  content: any;
  contentReference: string;
  moduleId?: string;
  onProgressUpdate?: (progress: any) => void;
  onComplete?: () => void;
  isCompleted?: boolean;
}

export default function VideoContent({
  content,
  contentReference,
  moduleId: _moduleId,
  onProgressUpdate: _onProgressUpdate,
  onComplete,
  isCompleted: _isCompleted
}: VideoContentProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { registerMedia, unregisterMedia, pauseAllExcept } = useMediaManager();
  const mediaId = `video-${contentReference}`;

  // Register/unregister video element
  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      registerMedia(mediaId, videoElement);
    }
    return () => {
      unregisterMedia(mediaId);
    };
  }, [mediaId, registerMedia, unregisterMedia]);

  // Pause other media when this video starts playing
  const handlePlay = () => {
    pauseAllExcept(mediaId);
  };
  
  // Debug logging
  console.log('VideoContent - Content data:', content);
  
  // Normalize URL to handle both relative and full URLs
  // Uses lms.noveloffice.org as base URL in both development and production
  const getVideoUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    
    // If already a full URL, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // Ensure path starts with / if it doesn't already
    const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    
    // Determine base URL
    // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
    // In development: use http://lms.noveloffice.org
    const baseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    return `${cleanBaseUrl}${relativePath}`;
  };
  
  const handleEnded = () => {
    onComplete?.();
  };

  if (!content) {
    return (
      <div className="video-content-container">
        <div className="error-message">
          <h3 className="font-semibold">No Content Data</h3>
          <p>Video content data is not available.</p>
        </div>
      </div>
    );
  }

  if (!content.video) {
    return (
      <div className="video-content-container">
        <div className="error-message">
          <h3 className="font-semibold">No Video File</h3>
          <p>Video file is not available for this content.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="video-content-container"
    >
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={getVideoUrl(content.video)}
          controls
          className="w-full h-full"
          onEnded={handleEnded}
          onPlay={handlePlay}
        />
      </div>
      
      {/* Video info */}
      <div className="mt-4 space-y-2">
        {content.title && !content.title.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i) && (
          <h3 className="text-lg font-semibold">{content.title}</h3>
        )}
        {content.description && (
          <p className="text-muted-foreground">{content.description}</p>
        )}
      </div>
    </motion.div>
  );
}
