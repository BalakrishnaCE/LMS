import { motion } from 'framer-motion';
import { LMS_API_BASE_URL } from '@/config/routes';

interface AudioContentProps {
  content: any;
  onComplete?: () => void;
}

export default function AudioContent({
  content,
  onComplete
}: AudioContentProps) {
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
            src={getAudioUrl(content.attach)}
            controls
            className="w-full"
            onEnded={handleEnded}
          />
        </div>
        
        {content.description && (
          <p className="text-muted-foreground text-center">{content.description}</p>
        )}
      </div>
    </motion.div>
  );
}
