import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LMS_API_BASE_URL } from "@/config/routes";

export default function SlidePreview({ 
  title = "Slide Presentation", 
  description = "Interactive slideshow content",
  progress_enabled = true,
  is_active = true,
  slide_show_items = []
}: { 
  title?: string;
  description?: string;
  progress_enabled?: boolean;
  is_active?: boolean;
  slide_show_items?: any[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const hasSlides = slide_show_items && slide_show_items.length > 0;


  const nextSlide = () => {
    if (hasSlides) {
      setCurrentSlide((prev) => (prev + 1) % slide_show_items.length);
    }
  };

  const prevSlide = () => {
    if (hasSlides) {
      setCurrentSlide((prev) => (prev - 1 + slide_show_items.length) % slide_show_items.length);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      // className={cn("border border-border rounded-lg bg-background p-4 shadow-lg")}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-lg text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground mb-2" dangerouslySetInnerHTML={{ __html: description }} />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{slide_show_items.length} slides</span>
          {progress_enabled && <span>• Progress tracking</span>}
          <span>• {is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
      {/* Slide Viewer */}
      {hasSlides && (
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-lg">
          {/* Slide Content */}
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
                  {slide_show_items[currentSlide]?.url ? (
                    <a href={slide_show_items[currentSlide].url} target="_blank" rel="noopener noreferrer" className="underline">
                      {slide_show_items[currentSlide]?.heading || `Slide ${currentSlide + 1}`}
                    </a>
                  ) : (
                    slide_show_items[currentSlide]?.heading || `Slide ${currentSlide + 1}`
                  )}
                </h4>
                {slide_show_items[currentSlide]?.image && (() => {
                  // Normalize image URL - use lms.noveloffice.org as base URL
                  const getImageUrl = (url: string) => {
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
                  
                  const imageUrl = getImageUrl(slide_show_items[currentSlide].image);
                  
                  return (
                    <img
                      src={imageUrl}
                      alt={slide_show_items[currentSlide].heading || `Slide ${currentSlide + 1}`}
                      className="max-h-56 md:max-h-72 rounded-lg shadow mb-4 object-contain"
                      style={{ maxWidth: 400, width: '100%' }}
                      onError={(e) => {
                        console.error('❌ Failed to load slide image:', imageUrl, 'Original:', slide_show_items[currentSlide].image);
                      }}
                    />
                  );
                })()}
                
                <div
                  className="text-base text-muted-foreground prose dark:prose-invert max-w-none text-center"
                  dangerouslySetInnerHTML={{
                    __html: slide_show_items[currentSlide]?.description || 'Slide content...'
                  }}
                />
              </motion.div>
            </AnimatePresence>
            {/* Navigation Arrows */}
            {slide_show_items.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background hover:bg-muted"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-background hover:bg-muted"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {/* Slide Indicators */}
          {slide_show_items.length > 1 && (
            <div className="flex justify-center gap-2 p-3 bg-muted">
              {slide_show_items.map((_, index) => (
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
          <div className="absolute top-2 right-2 bg-muted text-foreground text-xs px-2 py-1 rounded shadow">
            {currentSlide + 1} / {slide_show_items.length}
          </div>
        </div>
      )}
      {/* No slides message */}
      {!hasSlides && (
        <div className="bg-muted rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">No slides added yet</p>
        </div>
      )}
    </motion.div>
  );
}