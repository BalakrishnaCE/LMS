import { motion } from 'framer-motion';
import { LMS_API_BASE_URL } from '@/config/routes';

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
  contentReference: _contentReference,
  moduleId: _moduleId,
  onProgressUpdate: _onProgressUpdate,
  onComplete,
  isCompleted: _isCompleted
}: VideoContentProps) {
  
  // Debug logging
  console.log('VideoContent - Content data:', content);
  
  // Normalize URL to handle both relative and full URLs
  const getVideoUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${LMS_API_BASE_URL.replace(/\/$/, '')}${url}`;
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
          src={getVideoUrl(content.video)}
          controls
          className="w-full h-full"
          onEnded={handleEnded}
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
