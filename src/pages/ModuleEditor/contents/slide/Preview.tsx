import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Presentation, Play, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      className={cn("border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20")}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0">
          <Presentation className="h-6 w-6 text-purple-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              <span>{slide_show_items.length} slides</span>
            </div>
            {progress_enabled && (
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                <span>Progress tracking</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span>{is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Viewer */}
      {hasSlides && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border overflow-hidden">
          {/* Slide Content */}
          <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 p-6 flex flex-col justify-center"
              >
                <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                  {slide_show_items[currentSlide]?.option_text || `Slide ${currentSlide + 1}`}
                </h4>
                <div 
                  className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: slide_show_items[currentSlide]?.slide_content || 'Slide content...' 
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                  onClick={prevSlide}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-white/80 hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
                  onClick={nextSlide}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {/* Slide Indicators */}
          {slide_show_items.length > 1 && (
            <div className="flex justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-800">
              {slide_show_items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    index === currentSlide 
                      ? "bg-purple-600" 
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  )}
                />
              ))}
            </div>
          )}

          {/* Slide Counter */}
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            {currentSlide + 1} / {slide_show_items.length}
          </div>
        </div>
      )}

      {/* No slides message */}
      {!hasSlides && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <Presentation className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No slides added yet</p>
        </div>
      )}
    </motion.div>
  );
} 