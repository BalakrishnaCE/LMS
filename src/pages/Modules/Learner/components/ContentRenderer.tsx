import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/hooks/use-user';
import { LMS_API_BASE_URL } from '@/config/routes';
import { CONTENT_TYPES, ContentType } from '@/config/contentTypes';
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';

// Import existing content components
import Quiz from '@/pages/Modules/Contents/Quiz';
import QuestionAnswer from '@/pages/Modules/Contents/QuestionAnswer';
import SlideContent from '@/pages/Modules/Contents/SlideContent';
import AccordionContent from '@/pages/Modules/Contents/AccordionContent';
import StepsContent from '@/pages/Modules/Contents/StepsContent';
import CheckListContent from '@/pages/Modules/Contents/CheckListContent';
import FileAttachContent from '@/pages/Modules/Contents/FileAttachContent';

// Lazy load new content components
const VideoContent = React.lazy(() => import('@/pages/Modules/Contents/VideoContent'));
const TextContent = React.lazy(() => import('@/pages/Modules/Contents/TextContent'));
const ImageContent = React.lazy(() => import('@/pages/Modules/Contents/ImageContent'));
const AudioContent = React.lazy(() => import('@/pages/Modules/Contents/AudioContent'));
const IframeContent = React.lazy(() => import('@/pages/Modules/Contents/IframeContent'));
const ChapterContent = React.lazy(() => import('@/pages/Modules/Contents/ChapterContent'));

// Content component mapping
const CONTENT_COMPONENTS: Record<ContentType, React.ComponentType<any>> = {
  "Video Content": VideoContent,
  "Text Content": TextContent,
  "Image Content": ImageContent,
  "Audio Content": AudioContent,
  "Quiz": Quiz,
  "Question Answer": QuestionAnswer,
  "Slide Content": SlideContent,
  "Accordion Content": AccordionContent,
  "Steps": StepsContent,
  "Check List": CheckListContent,
  "File Attach": FileAttachContent,
  "Iframe Content": IframeContent,
  "Chapter Content": ChapterContent
} as Record<ContentType, React.ComponentType<any>>;

interface ContentRendererProps {
  contentType: string;
  contentReference: string;
  moduleId?: string;
  contentData?: any;
  onProgressUpdate?: (progress: any) => void;
  onContentComplete?: (contentRef: string) => void;
}

export function ContentRenderer({
  contentType,
  contentReference,
  moduleId,
  contentData,
  onProgressUpdate,
  onContentComplete
}: ContentRendererProps) {
  const [content, setContent] = useState(contentData);
  const [loading, setLoading] = useState(!contentData);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { user } = useUser();
  
  // WebSocket progress tracking - disabled for now
  // const webSocketProgress = useWebSocketProgress({ 
  //   moduleId: moduleId || "", 
  //   autoSubscribe: false 
  // });
  
  // WebSocket progress update function - disabled until hook is available
  const updateWSProgress = null as ((data: any) => Promise<void>) | null;

  // Get content type configuration
  const typeConfig = CONTENT_TYPES[contentType as ContentType];

  // Fetch content if not provided
  useEffect(() => {
    if (contentData) {
      setContent(contentData);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      if (!contentReference || !contentType) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use content_access.get_content_with_permissions API (allows guest access and bypasses permissions)
        // Determine API base URL
        // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
        // In development: use http://lms.noveloffice.org
        const apiBaseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
        const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
        const apiUrl = `${cleanApiBaseUrl}/api/method/novel_lms.novel_lms.api.content_access.get_content_with_permissions?content_type=${encodeURIComponent(contentType)}&content_reference=${contentReference}`;
        
        console.log('📡 Fetching content:', { contentReference, contentType, apiUrl });
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API request failed:', {
            status: response.status,
            statusText: response.statusText,
            url: apiUrl,
            errorText
          });
          throw new Error(`Failed to fetch content: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📦 API response:', { contentType, contentReference, data });
        
        let contentData = null;
        if (data.message && data.message.message && data.message.message.success === true) {
          contentData = data.message.message.data;
        } else if (data.message && data.message.success === true) {
          contentData = data.message.data;
        } else if (data.message && data.message.data) {
          contentData = data.message.data;
        } else if (data.data) {
          contentData = data.data;
        } else if (data.message) {
          contentData = data.message;
        }
        
        if (contentData) {
          setContent(contentData);
        } else {
          const errorMessage = data.message?.message?.message || data.message?.message || data.message || 'Failed to load content';
          console.error("API Error - No content data found:", JSON.stringify(data, null, 2));
          throw new Error(errorMessage || 'Content data not found in response');
        }
      } catch (err) {
        console.error("Error fetching content:", err instanceof Error ? err.message : JSON.stringify(err, null, 2));
        const errorMessage = err instanceof Error ? err.message : 
          (typeof err === 'object' && err !== null) ? JSON.stringify(err) : 'Failed to load content';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [contentReference, contentType, contentData]);

  const trackContentStart = useCallback(async () => {
    if (!user || !moduleId || !contentReference || !updateWSProgress) return;
    
    try {
      await updateWSProgress({
        content: contentReference,
        contentType: contentType,
        status: "In Progress"
      });
    } catch (error) {
      console.error("Failed to track content start:", error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, [user, moduleId, contentReference, updateWSProgress, contentType]);

  const trackContentCompletion = useCallback(async () => {
    if (!user || !moduleId || !contentReference || isCompleted || !updateWSProgress) return;
    
    try {
      await updateWSProgress({
        content: contentReference,
        contentType: contentType,
        status: "Completed"
      });
      
      setIsCompleted(true);
      onContentComplete?.(contentReference);
    } catch (error) {
      console.error("Failed to track content completion:", error instanceof Error ? error.message : JSON.stringify(error, null, 2));
    }
  }, [user, moduleId, contentReference, isCompleted, updateWSProgress, contentType, onContentComplete]);

  // Track content start
  useEffect(() => {
    if (content && user && moduleId && typeConfig?.requiresProgress && updateWSProgress) {
      trackContentStart();
    }
  }, [content, user, moduleId, updateWSProgress, trackContentStart, typeConfig?.requiresProgress]);

  // Auto-complete content based on configuration
  useEffect(() => {
    if (content && typeConfig?.autoComplete && typeConfig.completionTime) {
      const timer = setTimeout(() => {
        if (updateWSProgress) {
          trackContentCompletion();
        } else {
          // Fallback: just mark as completed locally
          setIsCompleted(true);
          onContentComplete?.(contentReference);
        }
      }, typeConfig.completionTime * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [content, typeConfig, updateWSProgress, contentReference, onContentComplete, trackContentCompletion]);

  const handleProgressUpdate = (progressData: any) => {
    onProgressUpdate?.(progressData);
  };

  // Loading state
  if (loading) {
    return (
      <div className="content-container">
        <div className="flex flex-col items-center justify-center p-8">
          <Lottie 
            animationData={loadingAnimation} 
            loop 
            style={{ width: 120, height: 120 }} 
          />
          <p className="mt-4 text-muted-foreground text-center">
            Loading {typeConfig?.displayName || 'content'}...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="content-container">
        <div className="error-message">
          <h3 className="font-semibold text-red-600">Error Loading Content</h3>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  // No content state
  if (!content) {
    return (
      <div className="content-container">
        <div className="error-message">
          <h3 className="font-semibold">Content Not Found</h3>
          <p>The requested content could not be found.</p>
          <div className="mt-2 text-sm text-gray-600">
            <p>Debug info:</p>
            <p>Content Reference: {contentReference}</p>
            <p>Content Type: {contentType}</p>
            <p>Has Content Data: {contentData ? 'Yes' : 'No'}</p>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Get the appropriate component
  const ContentComponent = contentType in CONTENT_COMPONENTS 
    ? CONTENT_COMPONENTS[contentType as ContentType]
    : undefined;
  
  
  if (!ContentComponent) {
    return (
      <div className="content-container">
        <div className="error-message">
          <h3 className="font-semibold">Unsupported Content Type</h3>
          <p>Content type "{contentType}" is not supported.</p>
        </div>
      </div>
    );
  }

  // Render content with progress tracking
  const baseProps = {
    content,
    contentReference: String(contentReference || ''),
    moduleId: moduleId ? String(moduleId) : undefined,
    onProgressUpdate: handleProgressUpdate,
    onComplete: trackContentCompletion,
    isCompleted
  };

  const componentProps = contentType === "Slide Content" && contentReference 
    ? { ...baseProps, slideContentId: String(contentReference) }
    : baseProps;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="content-container"
    >
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center p-4">
          <Lottie 
            animationData={loadingAnimation} 
            loop 
            style={{ width: 80, height: 80 }} 
          />
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Loading component...
          </p>
        </div>
      }>
        <ContentComponent {...(componentProps as any)} />
      </Suspense>
    </motion.div>
  );
}

export default ContentRenderer;
