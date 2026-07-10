import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { LMS_API_BASE_URL, LMS_FILE_BASE_URL } from '@/config/routes';
import { useMediaManager } from '@/contexts/MediaManagerContext';

// Color themes mapping
const getThemeColors = (themeName: string) => {
  const name = (themeName || 'general').toLowerCase();
  switch (name) {
    case 'teal':
    case 'emerald teal':
      return {
        layoutActiveBgBorder: 'bg-teal-50/70 border-teal-500 shadow-md shadow-teal-500/10 dark:bg-slate-800/80 dark:border-teal-400 dark:shadow-teal-400/20',
        badgeActiveBg: 'bg-teal-600 text-white shadow-sm shadow-teal-600/25',
        badgePastBg: 'bg-emerald-500 text-white',
        activeHeadingText: 'text-teal-900 dark:text-teal-200',
        bulletActiveColor: 'bg-teal-600 dark:bg-teal-400',
        timelineLineActiveBg: 'bg-teal-500',
        accentText: 'text-teal-600 dark:text-teal-400',
        accentLabel: 'text-teal-800 dark:text-teal-200',
        cardBg: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
        inactiveText: 'text-slate-400 dark:text-slate-500',
        inactiveHeadingText: 'text-slate-700 dark:text-slate-400',
        playBtnBg: 'bg-teal-600 hover:bg-teal-500 hover:shadow-[0_0_15px_rgba(13,148,136,0.4)]',
        timelineSliderAccent: 'accent-teal-600 focus:accent-teal-500'
      };
    case 'purple':
    case 'royal purple':
      return {
        layoutActiveBgBorder: 'bg-purple-50/70 border-purple-500 shadow-md shadow-purple-500/10 dark:bg-slate-800/80 dark:border-purple-400 dark:shadow-purple-400/20',
        badgeActiveBg: 'bg-purple-600 text-white shadow-sm shadow-purple-600/25',
        badgePastBg: 'bg-indigo-500 text-white',
        activeHeadingText: 'text-purple-900 dark:text-purple-200',
        bulletActiveColor: 'bg-purple-600 dark:bg-purple-400',
        timelineLineActiveBg: 'bg-purple-500',
        accentText: 'text-purple-600 dark:text-purple-400',
        accentLabel: 'text-purple-800 dark:text-purple-200',
        cardBg: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
        inactiveText: 'text-slate-400 dark:text-slate-500',
        inactiveHeadingText: 'text-slate-700 dark:text-slate-400',
        playBtnBg: 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(147,51,234,0.4)]',
        timelineSliderAccent: 'accent-purple-600 focus:accent-purple-500'
      };
    case 'dark':
    case 'tech dark':
      return {
        layoutActiveBgBorder: 'bg-slate-800/80 border-sky-500 shadow-md shadow-sky-500/20',
        badgeActiveBg: 'bg-sky-500 text-slate-900 shadow-sm shadow-sky-500/25',
        badgePastBg: 'bg-emerald-500 text-slate-900',
        activeHeadingText: 'text-white',
        bulletActiveColor: 'bg-sky-400',
        timelineLineActiveBg: 'bg-sky-400',
        accentText: 'text-sky-400',
        accentLabel: 'text-sky-300',
        cardBg: 'bg-slate-900 border-slate-800',
        inactiveText: 'text-slate-500',
        inactiveHeadingText: 'text-slate-400',
        playBtnBg: 'bg-sky-500 text-slate-950 hover:bg-sky-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]',
        timelineSliderAccent: 'accent-sky-400 focus:accent-sky-300'
      };
    case 'ocean blue':
    case 'blue':
    case 'general':
    default:
      return {
        layoutActiveBgBorder: 'bg-blue-50/70 border-blue-500 shadow-md shadow-blue-500/10 dark:bg-slate-800/80 dark:border-blue-400 dark:shadow-blue-400/20',
        badgeActiveBg: 'bg-blue-600 text-white shadow-sm shadow-blue-600/25',
        badgePastBg: 'bg-emerald-500 text-white',
        activeHeadingText: 'text-blue-900 dark:text-blue-200',
        bulletActiveColor: 'bg-blue-600 dark:bg-blue-400',
        timelineLineActiveBg: 'bg-blue-500',
        accentText: 'text-blue-600 dark:text-blue-400',
        accentLabel: 'text-blue-800 dark:text-blue-200',
        cardBg: 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800',
        inactiveText: 'text-slate-400 dark:text-slate-500',
        inactiveHeadingText: 'text-slate-700 dark:text-slate-400',
        playBtnBg: 'bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]',
        timelineSliderAccent: 'accent-blue-600 focus:accent-blue-500'
      };
  }
};

// Transition variants for Framer Motion slides
const getSlideVariants = (transitionType: string) => {
  const t = (transitionType || 'fade').toLowerCase();
  switch (t) {
    case 'slide':
      return {
        initial: { opacity: 0, x: 60 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -60 },
        transition: { duration: 0.35, ease: "easeOut" }
      };
    case 'zoom':
      return {
        initial: { opacity: 0, scale: 0.92 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 1.05 },
        transition: { duration: 0.35, ease: "easeOut" }
      };
    case 'flip':
      return {
        initial: { opacity: 0, rotateY: 75, transformPerspective: 1000 },
        animate: { opacity: 1, rotateY: 0, transformPerspective: 1000 },
        exit: { opacity: 0, rotateY: -75, transformPerspective: 1000 },
        transition: { duration: 0.45, ease: "easeInOut" }
      };
    case 'fade':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.3, ease: "easeOut" }
      };
  }
};

// Declarative Visual Primitives Helper Components
function ProcessTimelineLayout({ steps, currentSlideIndex, themeColors }: { steps: any[]; currentSlideIndex: number; themeColors: any }) {
  if (!steps || !Array.isArray(steps)) return null;

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 md:gap-5 overflow-x-auto py-2">
      {steps.map((step, idx) => {
        const isActive = step.active_on_slide === currentSlideIndex;
        const isPast = step.active_on_slide < currentSlideIndex;
        
        return (
          <div key={idx} className="flex flex-col md:flex-row items-center flex-1 min-w-[120px] relative">
            {/* Step Node */}
            <motion.div
              animate={{
                scale: isActive ? 1.04 : 0.96,
                opacity: isActive ? 1 : 0.6,
              }}
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all ${
                isActive
                  ? themeColors.layoutActiveBgBorder
                  : `${themeColors.cardBg} border-slate-200`
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-2 transition-colors ${
                  isActive
                    ? themeColors.badgeActiveBg
                    : isPast
                    ? themeColors.badgePastBg
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {isPast ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  idx + 1
                )}
              </div>
              <h5 className={`text-xs font-semibold mb-0.5 leading-tight ${isActive ? themeColors.activeHeadingText : themeColors.inactiveHeadingText}`}>
                {step.label}
              </h5>
              {step.description && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-snug line-clamp-2">
                  {step.description}
                </p>
              )}
            </motion.div>

            {/* Connecting line */}
            {idx < steps.length - 1 && (
              <div className="hidden md:block absolute top-[36px] left-[calc(100%-10px)] w-[20px] h-[2px] bg-slate-200 dark:bg-slate-800 z-0">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isPast || isActive ? '100%' : '0%' }}
                  className={`h-full ${themeColors.timelineLineActiveBg}`}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ComparisonLayout({ columns, currentSlideIndex, themeColors }: { columns: any[]; currentSlideIndex: number; themeColors: any }) {
  if (!columns || !Array.isArray(columns)) return null;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-1">
      {columns.map((col, idx) => {
        const isActive = col.active_on_slide === currentSlideIndex;
        return (
          <motion.div
            key={idx}
            animate={{
              scale: isActive ? 1.02 : 0.98,
              opacity: isActive ? 1 : 0.65,
            }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col p-4 rounded-xl border-2 transition-all h-full ${
              isActive
                ? themeColors.layoutActiveBgBorder
                : `${themeColors.cardBg} border-slate-200`
            }`}
          >
            <h5 className={`text-xs md:text-sm font-bold mb-2 border-b pb-1.5 leading-tight ${
              isActive ? `${themeColors.activeHeadingText} border-slate-200/50` : `${themeColors.inactiveHeadingText} border-slate-100 dark:border-slate-800`
            }`}>
              {col.title}
            </h5>
            <ul className="space-y-2 overflow-y-auto flex-1">
              {col.bullets && Array.isArray(col.bullets) && col.bullets.map((bullet: string, bIdx: number) => (
                <li key={bIdx} className="flex items-start text-[10px] md:text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  <span className={`mr-2 mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full ${isActive ? themeColors.bulletActiveColor : 'bg-slate-400'}`} />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}

function StatGridLayout({ metrics, currentSlideIndex, themeColors }: { metrics: any[]; currentSlideIndex: number; themeColors: any }) {
  if (!metrics || !Array.isArray(metrics)) return null;

  return (
    <div className="w-full grid grid-cols-2 gap-3.5 max-w-md">
      {metrics.map((metric, idx) => {
        const isActive = metric.active_on_slide === currentSlideIndex;
        return (
          <motion.div
            key={idx}
            animate={{
              scale: isActive ? 1.04 : 0.96,
              opacity: isActive ? 1 : 0.65,
            }}
            transition={{ duration: 0.3 }}
            className={`p-3.5 rounded-xl border-2 flex flex-col items-center text-center transition-all ${
              isActive
                ? themeColors.layoutActiveBgBorder
                : `${themeColors.cardBg} border-slate-200`
            }`}
          >
            <span className={`text-xl md:text-2xl font-extrabold tracking-tight leading-none ${isActive ? themeColors.accentText : 'text-slate-800 dark:text-slate-200'}`}>
              {metric.value}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-1.5 leading-none ${isActive ? themeColors.accentLabel : 'text-slate-500 dark:text-slate-400'}`}>
              {metric.label}
            </span>
            {metric.description && (
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-tight line-clamp-2">
                {metric.description}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function GeneralLayout({ layoutData, currentSlideIndex, themeColors }: { layoutData: any; currentSlideIndex: number; themeColors: any }) {
  if (layoutData.steps && Array.isArray(layoutData.steps)) {
    return <ProcessTimelineLayout steps={layoutData.steps} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />;
  }
  if (layoutData.columns && Array.isArray(layoutData.columns)) {
    return <ComparisonLayout columns={layoutData.columns} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />;
  }
  if (layoutData.metrics && Array.isArray(layoutData.metrics)) {
    return <StatGridLayout metrics={layoutData.metrics} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />;
  }

  return (
    <div className="text-center p-6 text-slate-400 dark:text-slate-500 italic text-xs">
      Interactive presentation graphic will load here.
    </div>
  );
}

function VisualLayoutDispatcher({ visuals, currentSlideIndex, themeColors }: { visuals: any; currentSlideIndex: number; themeColors: any }) {
  if (!visuals) return null;

  // Backwards compatibility fallback for raw HTML/SVG
  if (visuals.background_html || visuals.css_styles) {
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {visuals.css_styles && (
          <style dangerouslySetInnerHTML={{ __html: visuals.css_styles }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: visuals.background_html || '' }} />
      </div>
    );
  }

  const layoutType = visuals.layout_type;
  const layoutData = visuals.layout_data || {};
  const title = visuals.title || "";

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 md:p-3 relative z-10">
      {title && (
        <h4 className="text-[10px] md:text-xs font-bold text-slate-800 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-3 shrink-0 uppercase tracking-wide text-left">
          {title}
        </h4>
      )}
      <div className="flex-1 flex items-center justify-center min-h-0">
        {layoutType === 'process_timeline' && (
          <ProcessTimelineLayout steps={layoutData.steps} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />
        )}
        {layoutType === 'comparison' && (
          <ComparisonLayout columns={layoutData.columns} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />
        )}
        {layoutType === 'stat_grid' && (
          <StatGridLayout metrics={layoutData.metrics} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />
        )}
        {layoutType !== 'process_timeline' && layoutType !== 'comparison' && layoutType !== 'stat_grid' && (
          <GeneralLayout layoutData={layoutData} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />
        )}
      </div>
    </div>
  );
}

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
  const audioRef = useRef<HTMLAudioElement>(null);
  const { registerMedia, unregisterMedia, pauseAllExcept } = useMediaManager();
  const mediaId = `video-${contentReference}`;

  // Interactive slide states
  const [presentationData, setPresentationData] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [showScript, setShowScript] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Try parsing presentation JSON on mount/update
  useEffect(() => {
    const metaStr = content?.presentation_metadata || content?.svg_content;
    if (metaStr) {
      const scriptStr = metaStr.trim();
      if (scriptStr.startsWith('{')) {
        try {
          const parsed = JSON.parse(scriptStr);
          if (parsed && parsed.slides && Array.isArray(parsed.slides)) {
            setPresentationData(parsed);
            setCurrentSlideIndex(0);
            return;
          }
        } catch (e) {
          console.error("Failed to parse presentation JSON:", e);
        }
      }
    }
    setPresentationData(null);
  }, [content]);

  // Register/unregister media element with context
  useEffect(() => {
    const activeMediaElement = presentationData ? audioRef.current : videoRef.current;
    if (activeMediaElement) {
      registerMedia(mediaId, activeMediaElement);
    }
    return () => {
      unregisterMedia(mediaId);
    };
  }, [mediaId, registerMedia, unregisterMedia, presentationData, content]);

  // Pause other media when playback starts
  const handlePlay = () => {
    pauseAllExcept(mediaId);
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  const handleTimeUpdate = () => {
    if (presentationData) {
      const time = audioRef.current?.currentTime || 0;
      setCurrentTime(time);

      // Find current slide index based on timestamps
      const slides = presentationData.slides;
      const index = slides.findIndex(
        (slide: any) => time >= slide.start_time && time < slide.end_time
      );
      if (index !== -1 && index !== currentSlideIndex) {
        setCurrentSlideIndex(index);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    onComplete?.();
  };

  const handleEnded = () => {
    onComplete?.();
  };

  // Seek audio
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            handlePlay();
          })
          .catch(err => console.error("Audio play failed:", err));
      }
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0 && presentationData?.slides) {
      const prevSlide = presentationData.slides[currentSlideIndex - 1];
      if (audioRef.current) {
        audioRef.current.currentTime = prevSlide.start_time;
        setCurrentTime(prevSlide.start_time);
        setCurrentSlideIndex(currentSlideIndex - 1);
      }
    }
  };

  const handleNext = () => {
    if (presentationData?.slides && currentSlideIndex < presentationData.slides.length - 1) {
      const nextSlide = presentationData.slides[currentSlideIndex + 1];
      if (audioRef.current) {
        audioRef.current.currentTime = nextSlide.start_time;
        setCurrentTime(nextSlide.start_time);
        setCurrentSlideIndex(currentSlideIndex + 1);
      }
    }
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
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');

    return `${cleanBaseUrl}${relativePath}`;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePPTXExport = async () => {
    try {
      setIsExporting(true);
      const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
      const response = await fetch(
        `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.export_chapter_slides_to_pptx?content_reference=${encodeURIComponent(contentReference)}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to generate PowerPoint. Server returned status: ${response.status}`);
      }
      
      const resData = await response.json();
      if (resData.message && resData.message.file_url) {
        const fileUrl = resData.message.file_url;
        const downloadUrl = fileUrl.startsWith("http") ? fileUrl : `${cleanBaseUrl}${fileUrl}`;
        
        // Trigger download
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.setAttribute("download", `${content.title || "presentation"}.pptx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (resData.exc) {
        try {
          const parsedExc = JSON.parse(resData.exc);
          if (Array.isArray(parsedExc) && parsedExc.length > 0) {
            alert(parsedExc[0]);
            return;
          }
        } catch (_) {}
        alert(resData.exc || "Export failed.");
      } else {
        alert("Failed to export: empty response from server.");
      }
    } catch (error: any) {
      console.error("Failed to export PowerPoint presentation:", error);
      alert(error.message || "Failed to export PowerPoint presentation.");
    } finally {
      setIsExporting(false);
    }
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
          <h3 className="font-semibold">No Media File</h3>
          <p>Audio/Video file is not available for this content.</p>
        </div>
      </div>
    );
  }

  // RENDER INTERACTIVE SLIDE DECK PLAYER IF JSON METADATA EXISTS
  if (presentationData) {
    const currentSlide = presentationData.slides[currentSlideIndex] || { title: '', bullets: [], narration: '' };
    const visuals = presentationData.visuals || {};
    const isLegacy = !!(visuals.background_html || visuals.css_styles);

    // Extraction of custom theme settings
    const theme = presentationData.theme || 'general';
    const slideTransition = presentationData.slide_transition || 'fade';
    const elementEntrance = presentationData.element_entrance || 'stagger';
    
    const themeColors = getThemeColors(theme);
    const slideVariants = getSlideVariants(slideTransition);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full flex flex-col space-y-4"
      >
        {/* Core Presentation Player Canvas */}
        <div className={`relative aspect-video w-full rounded-2xl overflow-hidden shadow-xl ${
          theme === 'dark' || theme === 'tech dark' 
            ? 'bg-slate-950 border-slate-900 text-slate-100' 
            : 'bg-slate-50 border-slate-200/80'
        } border flex flex-col justify-between p-4 md:p-6 select-none`}>
          
          {/* Inject Dynamic CSS/Background styles for Legacy or custom items */}
          {isLegacy && (
            <>
              {visuals.css_styles && (
                <style dangerouslySetInnerHTML={{ __html: visuals.css_styles }} />
              )}
              {visuals.background_html && (
                <div
                  className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
                  dangerouslySetInnerHTML={{ __html: visuals.background_html }}
                />
              )}
              <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/10 via-transparent to-white/5 pointer-events-none" />
            </>
          )}

          {/* Top Panel - Slide Header & Progress Counter */}
          <div className="relative z-20 flex justify-between items-center w-full">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
              theme === 'dark' || theme === 'tech dark' 
                ? 'bg-slate-900 border-slate-800 text-slate-400' 
                : 'bg-white/90 border-slate-200 text-slate-500'
            } border shadow-sm`}>
              AI Presentation
            </span>
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
              theme === 'dark' || theme === 'tech dark' 
                ? 'bg-slate-900 border-slate-800 text-slate-400' 
                : 'bg-white/90 border-slate-200 text-slate-500'
            } border shadow-sm`}>
              Slide {currentSlideIndex + 1} of {presentationData.slides.length}
            </span>
          </div>

          {isLegacy ? (
            /* Legacy Centered Slide Layout */
            <div className={`relative z-20 m-auto max-w-2xl w-full p-6 md:p-8 rounded-xl ${
              theme === 'dark' || theme === 'tech dark' 
                ? 'bg-slate-900/90 border-slate-800' 
                : 'bg-white/80 border-slate-200/50'
            } backdrop-blur-md border shadow-lg flex flex-col justify-center text-left`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlideIndex}
                  variants={slideVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  {currentSlide.title && (
                    <h3 className={`text-xl md:text-3xl font-extrabold ${
                      theme === 'dark' || theme === 'tech dark' ? 'text-slate-100' : 'text-slate-900'
                    } mb-4 leading-tight`}>
                      {currentSlide.title}
                    </h3>
                  )}

                  {currentSlide.bullets && Array.isArray(currentSlide.bullets) && (
                    <ul className="space-y-3">
                      {currentSlide.bullets.map((bullet: string, bIdx: number) => (
                        <motion.li
                          key={bIdx}
                          initial={
                            elementEntrance === 'bounce'
                              ? { opacity: 0, scale: 0.8 }
                              : { opacity: 0, x: -10 }
                          }
                          animate={
                            elementEntrance === 'bounce'
                              ? { opacity: 1, scale: 1 }
                              : { opacity: 1, x: 0 }
                          }
                          transition={{
                            delay: elementEntrance === 'stagger' ? bIdx * 0.25 : bIdx * 0.08,
                            type: elementEntrance === 'bounce' ? 'spring' : 'tween',
                            stiffness: 260,
                            damping: 20,
                            duration: 0.3
                          }}
                          className={`flex items-start text-sm md:text-base ${
                            theme === 'dark' || theme === 'tech dark' ? 'text-slate-200 font-medium' : 'text-slate-700 font-medium'
                          }`}
                        >
                          <span className={`mr-2.5 mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full ${themeColors.bulletActiveColor}`} />
                          <span className="leading-relaxed">{bullet}</span>
                        </motion.li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          ) : (
            /* Modern Side-by-Side Split Slide Layout */
            <div className="flex-1 flex gap-4 md:gap-5 items-center min-h-0 overflow-hidden my-3 relative z-20">
              {/* Left Panel: Slide Text Cards */}
              <div className={`w-[42%] ${
                theme === 'dark' || theme === 'tech dark' 
                  ? 'bg-slate-900 border-slate-800 text-slate-100' 
                  : 'bg-white border-slate-200/60 shadow-slate-100/30'
              } rounded-xl border shadow-md p-5 h-full flex flex-col justify-center text-left overflow-y-auto`}>
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSlideIndex}
                    variants={slideVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full"
                  >
                    {currentSlide.title && (
                      <h3 className={`text-base md:text-xl font-extrabold ${
                        theme === 'dark' || theme === 'tech dark' ? 'text-slate-100' : 'text-slate-900'
                      } mb-2.5 leading-snug tracking-tight`}>
                        {currentSlide.title}
                      </h3>
                    )}

                    {currentSlide.bullets && Array.isArray(currentSlide.bullets) && (
                      <ul className="space-y-2">
                        {currentSlide.bullets.map((bullet: string, bIdx: number) => (
                          <motion.li
                            key={bIdx}
                            initial={
                              elementEntrance === 'bounce'
                                ? { opacity: 0, scale: 0.8 }
                                : { opacity: 0, x: -8 }
                            }
                            animate={
                              elementEntrance === 'bounce'
                                ? { opacity: 1, scale: 1 }
                                : { opacity: 1, x: 0 }
                            }
                            transition={{
                              delay: elementEntrance === 'stagger' ? bIdx * 0.25 : bIdx * 0.08,
                              type: elementEntrance === 'bounce' ? 'spring' : 'tween',
                              stiffness: 260,
                              damping: 20,
                              duration: 0.25
                            }}
                            className={`flex items-start text-[11px] md:text-xs ${
                              theme === 'dark' || theme === 'tech dark' ? 'text-slate-300' : 'text-slate-600'
                            } font-medium`}
                          >
                            <span className={`mr-2 mt-1.5 flex h-1.5 w-1.5 shrink-0 rounded-full ${themeColors.bulletActiveColor} shadow-sm`} />
                            <span className="leading-relaxed">{bullet}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Panel: Declarative visual widgets */}
              <div className={`w-[58%] h-full flex items-center justify-center ${
                theme === 'dark' || theme === 'tech dark' 
                  ? 'bg-slate-900/50 border-slate-800' 
                  : 'bg-white/70 border-slate-200/60 shadow-inner'
              } rounded-xl p-4 border overflow-hidden relative`}>
                <VisualLayoutDispatcher visuals={visuals} currentSlideIndex={currentSlideIndex} themeColors={themeColors} />
              </div>
            </div>
          )}

          {/* Dynamic Interactive Controls Bar */}
          <div className={`relative z-20 w-full flex flex-col space-y-3 p-4 rounded-xl ${
            theme === 'dark' || theme === 'tech dark' 
              ? 'bg-slate-900/95 border-slate-800 shadow-md' 
              : 'bg-white/95 border-slate-200/80 shadow-md'
          } backdrop-blur-md border mt-auto`}>
            
            {/* Timeline slider */}
            <div className="flex items-center space-x-3 w-full">
              <span className={`text-xs font-mono font-medium ${
                theme === 'dark' || theme === 'tech dark' ? 'text-slate-400' : 'text-slate-500'
              } shrink-0`}>
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                  theme === 'dark' || theme === 'tech dark' ? 'bg-slate-800' : 'bg-slate-200'
                } ${themeColors.timelineSliderAccent} outline-none transition-all`}
              />
              <span className={`text-xs font-mono font-medium ${
                theme === 'dark' || theme === 'tech dark' ? 'text-slate-400' : 'text-slate-500'
              } shrink-0`}>
                {formatTime(duration)}
              </span>
            </div>

            {/* Buttons Row */}
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentSlideIndex === 0}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' || theme === 'tech dark' 
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  } transition-colors disabled:opacity-40 disabled:hover:bg-transparent`}
                  title="Previous Slide"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={togglePlay}
                  className={`p-3 rounded-full ${themeColors.playBtnBg} text-white active:scale-95 transition-all`}
                  title={isPlaying ? "Pause Narration" : "Play Narration"}
                >
                  {isPlaying ? (
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 fill-current ml-0.5" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentSlideIndex === presentationData.slides.length - 1}
                  className={`p-2 rounded-lg ${
                    theme === 'dark' || theme === 'tech dark' 
                      ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  } transition-colors disabled:opacity-40 disabled:hover:bg-transparent`}
                  title="Next Slide"
                >
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                {/* Export PPTX button */}
                <button
                  type="button"
                  onClick={handlePPTXExport}
                  disabled={isExporting}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    theme === 'dark' || theme === 'tech dark' 
                      ? 'text-slate-300 border-slate-850 hover:text-slate-100 hover:bg-slate-800' 
                      : 'text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
                  } disabled:opacity-50`}
                  title="Export Slides to PowerPoint (.pptx)"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                      Export PPTX
                    </>
                  )}
                </button>

                {/* Toggle narration script drawer */}
                <button
                  type="button"
                  onClick={() => setShowScript(!showScript)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${showScript
                      ? "bg-blue-50 text-blue-600 border-blue-200"
                      : "text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                >
                  <svg className="h-4 w-4 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                  Narration Script
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden narration audio element */}
        <audio
          ref={audioRef}
          src={getVideoUrl(content.video)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          onPlay={handlePlay}
          onPause={handlePause}
        />

        {/* Narration Script Panel */}
        {showScript && currentSlide.narration && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden"
          >
            <div className="flex justify-between items-center p-4 border-b bg-muted/30">
              <h4 className="text-sm font-semibold">Active Slide Narration Script</h4>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {currentSlide.narration}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // FALLBACK TO STANDARD VIDEO PLAYER
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
      <div className="mt-4 space-y-4">
        {content.title && !content.title.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i) && (
          <h3 className="text-lg font-semibold">{content.title}</h3>
        )}
        {content.description && (
          <p className="text-muted-foreground">{content.description}</p>
        )}

        {content.video_script && (
          <div className="mt-6 rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
              <h3 className="text-xl font-semibold leading-none tracking-tight">Video Script</h3>
            </div>
            <div className="p-6 pt-0">
              <div
                className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground"
              >
                {content.video_script}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
