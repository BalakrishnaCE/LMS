import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LMS_API_BASE_URL, LMS_FILE_BASE_URL } from '@/config/routes';

export default function SlidePreview({
  title = "Slide Presentation",
  description = "Interactive slideshow content",
  progress_enabled = true,
  is_active = true,
  slide_show_items = [],
  presentation_metadata = null
}: {
  title?: string;
  description?: string;
  progress_enabled?: boolean;
  is_active?: boolean;
  slide_show_items?: any[];
  presentation_metadata?: any;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);

  let parsedMetadata: any[] | null = null;
  if (presentation_metadata) {
    try {
      parsedMetadata = typeof presentation_metadata === 'string'
        ? JSON.parse(presentation_metadata)
        : presentation_metadata;
    } catch (e) {
      console.error("Failed to parse presentation_metadata:", e);
    }
  }

  const hasHtmlSlides = Array.isArray(parsedMetadata) && parsedMetadata.length > 0 && parsedMetadata.some((s: any) => s.slide_html);
  const totalSlides = hasHtmlSlides ? parsedMetadata!.length : slide_show_items.length;
  const hasSlides = totalSlides > 0;

  const nextSlide = () => {
    if (hasSlides) {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
      setIframeKey((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (hasSlides) {
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
      setIframeKey((prev) => prev + 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIframeKey((prev) => prev + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: description }} />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{totalSlides} slides</span>
          {progress_enabled && <span>• Progress tracking</span>}
          <span>• {is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>

      {hasSlides && (
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-lg relative">
          {hasHtmlSlides ? (
            <div className="relative w-full aspect-video bg-slate-950">
              <iframe
                key={iframeKey}
                srcDoc={parsedMetadata![currentSlide].slide_html}
                title={parsedMetadata![currentSlide].title || `Slide ${currentSlide + 1}`}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
              <button
                onClick={() => setIframeKey((prev) => prev + 1)}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs text-white rounded-lg backdrop-blur border border-slate-700 transition"
              >
                🔄 Replay Motion
              </button>
            </div>
          ) : (
            <div className="relative aspect-video flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 p-6 flex flex-col items-center justify-center"
                >
                  <h4 className="text-xl font-bold mb-2 text-foreground text-center">
                    {slide_show_items[currentSlide]?.heading || `Slide ${currentSlide + 1}`}
                  </h4>
                  <div
                    className="text-base text-muted-foreground prose dark:prose-invert max-w-none text-center"
                    dangerouslySetInnerHTML={{
                      __html: slide_show_items[currentSlide]?.description || 'Slide content...'
                    }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/80 hover:bg-muted backdrop-blur"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background/80 hover:bg-muted backdrop-blur"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Slide Indicators */}
          {totalSlides > 1 && (
            <div className="flex justify-center gap-2 p-3 bg-muted">
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentSlide
                      ? "bg-primary"
                      : "bg-border hover:bg-muted-foreground"
                  )}
                />
              ))}
            </div>
          )}

          {/* Slide Counter */}
          <div className="absolute top-2 right-2 bg-muted/80 backdrop-blur text-foreground text-xs px-2 py-1 rounded shadow">
            {currentSlide + 1} / {totalSlides}
          </div>
        </div>
      )}

      {!hasSlides && (
        <div className="bg-muted rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">No slides added yet</p>
        </div>
      )}
    </motion.div>
  );
}