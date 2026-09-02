import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { LMS_API_BASE_URL, LMS_FILE_BASE_URL } from '@/config/routes';
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

  const [currentVideo, setCurrentVideo] = useState<string>('');

  useEffect(() => {
    setCurrentVideo(content?.video || content?.video_url || '');
  }, [content]);

  // Register/unregister media element with context
  useEffect(() => {
    if (videoRef.current) {
      registerMedia(mediaId, videoRef.current);
    }
    return () => {
      unregisterMedia(mediaId);
    };
  }, [mediaId, registerMedia, unregisterMedia, currentVideo]);

  const handlePlay = () => {
    pauseAllExcept(mediaId);
  };

  const handleEnded = () => {
    onComplete?.();
  };

  // Normalize URL to handle both relative and full URLs
  const getVideoUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }

    const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    const baseUrl = LMS_API_BASE_URL || LMS_FILE_BASE_URL;
    const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/$/, '') : '';

    return `${cleanBaseUrl}${relativePath}`;
  };

  if (!content) {
    return (
      <div className="video-content-container">
        <div className="error-message p-6 text-center text-slate-500">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">No Content Data</h3>
          <p className="text-sm mt-1">Video content data is not available.</p>
        </div>
      </div>
    );
  }

  if (!currentVideo) {
    return (
      <div className="video-content-container">
        <div className="error-message p-6 text-center text-slate-500">
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">No Video File Available</h3>
          <p className="text-sm mt-1">The MP4 video lesson file is currently generating or not available.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="video-content-container w-full space-y-5"
    >
      {/* MP4 Video Player */}
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
        <video
          ref={videoRef}
          src={getVideoUrl(currentVideo)}
          controls
          className="w-full h-full"
          onEnded={handleEnded}
          onPlay={handlePlay}
        />
      </div>

      {/* Video title, description & script info */}
      <div className="space-y-4">
        {content.title && !content.title.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i) && (
          <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{content.title}</h3>
        )}
        {content.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{content.description}</p>
        )}

        {content.video_script && (
          <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-slate-900/80">
              <h4 className="text-sm font-bold tracking-wide uppercase text-slate-700 dark:text-slate-300">Video Narration Script</h4>
            </div>
            <div className="p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-600 dark:text-slate-300 leading-relaxed">
                {content.video_script}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
