import { motion } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { LMS_API_BASE_URL } from '@/config/routes';
import { useMediaManager } from '@/contexts/MediaManagerContext';

interface AudioContentProps {
  content: any;
  contentReference?: string;
  onComplete?: () => void;
}

export default function AudioContent({
  content,
  contentReference = '',
  onComplete
}: AudioContentProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { registerMedia, unregisterMedia, pauseAllExcept } = useMediaManager();
  const mediaId = `audio-${contentReference || content?.attach || 'default'}`;

  // Register/unregister audio element
  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      registerMedia(mediaId, audioElement);
    }
    return () => {
      unregisterMedia(mediaId);
    };
  }, [mediaId, registerMedia, unregisterMedia]);

  // Pause other media when this audio starts playing
  const handlePlay = () => {
    pauseAllExcept(mediaId);
  };
  // Normalize URL to handle both relative and full URLs
  // Uses lms.noveloffice.org as base URL in both development and production
  const getAudioUrl = (url: string) => {
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
      <div className="audio-content-container">
        <div className="error-message">
          <h3 className="font-semibold">No Content Data</h3>
          <p>Audio content data is not available.</p>
        </div>
      </div>
    );
  }

  if (!content.attach) {
    return (
      <div className="audio-content-container">
        <div className="error-message">
          <h3 className="font-semibold">Audio not present</h3>
          <p>Audio file is not available for this content.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="audio-content-container"
    >
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-center">{content.title}</h3>
        
        <div className="relative bg-gray-50 rounded-lg p-6">
          <audio
            ref={audioRef}
            src={getAudioUrl(content.attach)}
            controls
            className="w-full"
            onEnded={handleEnded}
            onPlay={handlePlay}
          />
        </div>
        
        {content.description && (
          <p className="text-muted-foreground text-center">{content.description}</p>
        )}

        {content.audio_script && (
          <div className="mt-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Audio Script</h3>
            </div>
            <div className="p-6 pt-0">
              <div
                className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground"
              >
                {content.audio_script}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
