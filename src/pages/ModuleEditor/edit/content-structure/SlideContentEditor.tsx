import { useState, useEffect } from 'react';
import { Trash2, Plus, ChevronLeft, ChevronRight, MoveUp, MoveDown } from 'lucide-react';
import { uploadFileToFrappe } from '@/lib/uploadFileToFrappe';
import { toast } from 'sonner';
import { LMS_API_BASE_URL } from "@/config/routes";

interface SlideShowItem {
  image: string;
  heading: string;
  description: string;
  url: string;
}

interface SlideContentEditorProps {
  content: { 
    title: string; 
    description: string;
    progress_enabled: boolean;
    is_active: boolean;
    slide_show_items: SlideShowItem[];
  };
  onSave: (data: any) => void;
  onCancel?: () => void;
}

export default function SlideContentEditor({ content, onSave, onCancel }: SlideContentEditorProps) {
  const safeContent = content || { 
    title: '', 
    description: '', 
    progress_enabled: true, 
    is_active: true, 
    slide_show_items: []
  };

  const [title, setTitle] = useState(safeContent.title);
  const [description, setDescription] = useState(safeContent.description);
  const [progressEnabled, setProgressEnabled] = useState(safeContent.progress_enabled);
  const [isActive, setIsActive] = useState(safeContent.is_active);
  
  // Initialize with at least one empty slide if no slides exist
  const initialSlides = Array.isArray(safeContent.slide_show_items) && safeContent.slide_show_items.length > 0
    ? safeContent.slide_show_items
    : [{ image: '', heading: '', description: '', url: '' }];
  
  const [slideShowItems, setSlideShowItems] = useState<SlideShowItem[]>(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [editingHeading, setEditingHeading] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    setTitle(safeContent.title);
    setDescription(safeContent.description);
    setProgressEnabled(safeContent.progress_enabled);
    setIsActive(safeContent.is_active);
    const slides = Array.isArray(safeContent.slide_show_items) && safeContent.slide_show_items.length > 0
      ? safeContent.slide_show_items
      : [{ image: '', heading: '', description: '', url: '' }];
    console.log('Loading slides:', { 
      safeContent: safeContent.slide_show_items, 
      processedSlides: slides,
      currentSlide: currentSlide 
    });
    setSlideShowItems(slides);
    // Ensure currentSlide is valid
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [safeContent]);

  const addSlide = () => {
    const newSlide: SlideShowItem = {
      image: '',
      heading: '',
      description: '',
      url: ''
    };
    setSlideShowItems([...slideShowItems, newSlide]);
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slideShowItems.length) return;

    const updatedSlides = [...slideShowItems];
    [updatedSlides[index], updatedSlides[newIndex]] = [updatedSlides[newIndex], updatedSlides[index]];
    setSlideShowItems(updatedSlides);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const updateSlide = (index: number, field: keyof SlideShowItem, value: string) => {
    const updatedSlides = [...slideShowItems];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setSlideShowItems(updatedSlides);
    console.log('Updated slides:', updatedSlides);
  };

  const deleteSlide = (index: number) => {
    const newSlides = slideShowItems.filter((_, i) => i !== index);
    // Ensure at least one slide remains
    if (newSlides.length === 0) {
      setSlideShowItems([{ image: '', heading: '', description: '', url: '' }]);
      setCurrentSlide(0);
    } else {
      setSlideShowItems(newSlides);
      // Adjust currentSlide if needed
      if (currentSlide >= newSlides.length) {
        setCurrentSlide(newSlides.length - 1);
      } else if (currentSlide === index && index > 0) {
        setCurrentSlide(index - 1);
      }
    }
  };

  const nextSlide = () => {
    if (slideShowItems.length > 0) {
      const newIndex = (currentSlide + 1) % slideShowItems.length;
      console.log('Next slide:', { from: currentSlide, to: newIndex, total: slideShowItems.length });
      setCurrentSlide(newIndex);
    }
  };
  const prevSlide = () => {
    if (slideShowItems.length > 0) {
      const newIndex = (currentSlide - 1 + slideShowItems.length) % slideShowItems.length;
      console.log('Prev slide:', { from: currentSlide, to: newIndex, total: slideShowItems.length });
      setCurrentSlide(newIndex);
    }
  };

  const handleSave = () => {
    // Filter out only completely empty slides (no content at all)
    const filteredSlides = slideShowItems.filter(
      slide =>
        (slide.image && slide.image.trim()) ||
        (slide.heading && slide.heading.trim()) ||
        (slide.description && slide.description.trim()) ||
        (slide.url && slide.url.trim())
    );
    
    console.log('Original slides:', slideShowItems);
    console.log('Filtered slides:', filteredSlides);
    
    const payload = {
      title,
      description,
      progress_enabled: progressEnabled,
      is_active: isActive,
      slide_show_items: filteredSlides
    };
    console.log('Saving payload:', payload);
    onSave(payload);
  };

  async function handleImageUpload(file: File) {
    setImageUploading(true);
    try {
      const url = await uploadFileToFrappe(file);
      updateSlide(currentSlide, 'image', url);
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
        {/* Top-level Title and Description */}
        <div className="w-full mb-8">
          <label className="block text-lg font-semibold text-foreground mb-2" htmlFor="slide-block-title">Presentation Title</label>
          <input
            id="slide-block-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Enter presentation title"
            className="w-full px-4 py-3 rounded border border-border bg-background text-foreground text-md font-bold focus:outline-none focus:border-primary mb-4"
          />
          <label className="block text-base font-medium text-foreground mb-2" htmlFor="slide-block-description">Presentation Description</label>
          <textarea
            id="slide-block-description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Enter presentation description"
            className="w-full px-4 py-2 rounded border border-border bg-background text-foreground text-base focus:outline-none focus:border-primary min-h-[60px]"
          />
        </div>
        {/* Slide Card */}
        <div
          className="relative flex flex-col items-center justify-start bg-white shadow-2xl rounded-3xl mx-auto transition-all duration-300"
          style={{
            minWidth: 320,
            width: '100%',
            maxWidth: 900,
            minHeight: 500,
            maxHeight: 600,
            padding: '2rem 3rem',
            boxSizing: 'border-box',
            margin: '0 auto',
            overflow: 'hidden'
          }}
        >
          {/* Remove Slide (bottom left, subtle) */}
          {slideShowItems.length > 1 && (
            <button
              className="absolute bottom-4 left-4 text-destructive bg-white/80 hover:bg-destructive/10 rounded-full p-2 shadow-sm transition"
              onClick={() => deleteSlide(currentSlide)}
              title="Delete Slide"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          {/* Add Slide (bottom right, subtle) */}
          <button
            className="absolute bottom-4 right-4 text-primary bg-white/80 hover:bg-primary/10 rounded-full p-2 shadow-sm transition"
            onClick={() => {
              addSlide();
              setCurrentSlide(slideShowItems.length); // Go to the new slide
            }}
            title="Add Slide"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          {/* Move Slide Up (if not first slide) */}
          {currentSlide > 0 && (
            <button
              className="absolute top-4 left-4 text-primary bg-white/80 hover:bg-primary/10 rounded-full p-2 shadow-sm transition"
              onClick={() => moveSlide(currentSlide, 'up')}
              title="Move Slide Up"
            >
              <MoveUp className="w-4 h-4" />
            </button>
          )}

          {/* Move Slide Down (if not last slide) */}
          {currentSlide < slideShowItems.length - 1 && (
            <button
              className="absolute top-4 right-4 text-primary bg-white/80 hover:bg-primary/10 rounded-full p-2 shadow-sm transition"
              onClick={() => moveSlide(currentSlide, 'down')}
              title="Move Slide Down"
            >
              <MoveDown className="w-4 h-4" />
            </button>
          )}
          {/* Heading (inline edit) */}
          <div className="w-full flex justify-center mb-8">
            {(() => {
              const currentSlideData = slideShowItems[currentSlide];
              const isValidSlide = currentSlide >= 0 && currentSlide < slideShowItems.length;
              console.log('Heading display:', { 
                currentSlide, 
                totalSlides: slideShowItems.length, 
                isValidSlide,
                slideData: currentSlideData 
              });
              
              if (!isValidSlide) {
                return <div className="text-red-500">Invalid slide index: {currentSlide}</div>;
              }
              
              return editingHeading ? (
                <input
                  type="text"
                  value={currentSlideData?.heading || ''}
                  autoFocus
                  onBlur={() => setEditingHeading(false)}
                  onKeyDown={e => { if (e.key === 'Enter') setEditingHeading(false); }}
                  onChange={e => updateSlide(currentSlide, 'heading', e.target.value)}
                  className="text-4xl md:text-xl font-extrabold text-center w-full bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 px-4 transition"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                  placeholder="Add Slide Title"
                />
              ) : (
                <h2
                  className={`text-4xl md:text-xl font-extrabold text-center w-full cursor-pointer select-text ${!currentSlideData?.heading ? 'text-muted-foreground italic' : ''}`}
                  onClick={() => setEditingHeading(true)}
                  style={{ minHeight: 56 }}
                >
                  {currentSlideData?.heading || 'Click to add title'}
                </h2>
              );
            })()}
          </div>
          {/* Image (centered, overlay for upload/remove) */}
          <div
            className="relative flex flex-col items-center justify-center w-full mb-6"
            style={{ 
              minHeight: 100, 
              maxHeight: 180, 
              maxWidth: 500, 
              margin: '0 auto',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            {slideShowItems[currentSlide]?.image ? (() => {
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
              
              const imageUrl = getImageUrl(slideShowItems[currentSlide].image);
              
              return (
                <div className="relative group w-full h-full flex flex-col items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Slide"
                    className="rounded-xl shadow object-contain transition"
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      width: 'auto', 
                      height: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                {imageUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-xl">
                    <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                  </div>
                )}
                <button
                  className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 shadow hover:bg-destructive/80 opacity-80 group-hover:opacity-100 transition"
                  onClick={e => { e.stopPropagation(); updateSlide(currentSlide, 'image', ''); }}
                  title="Remove Image"
                >
                  ×
                </button>
                </div>
              );
            })() : (
              <div
                className="flex flex-col items-center justify-center w-full h-full cursor-pointer group"
                onClick={() => document.getElementById('slide-image-upload')?.click()}
                onDrop={async e => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) await handleImageUpload(file);
                }}
                onDragOver={e => e.preventDefault()}
                style={{ 
                  border: '2px dashed #e5e7eb', 
                  borderRadius: 16, 
                  background: 'rgba(0,0,0,0.02)',
                  minHeight: 120
                }}
              >
                {imageUploading ? (
                  <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-muted-foreground group-hover:text-primary transition" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4m0 0l2 2m-2-2v6" /></svg>
                    <span className="text-muted-foreground text-base group-hover:text-primary transition">Click or drag to add image</span>
                  </>
                )}
                <input
                  id="slide-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    if (file) await handleImageUpload(file);
                  }}
                />
              </div>
            )}
          </div>
          {/* Description (inline edit) */}
          <div className="w-full flex justify-center mt-4 flex-1 min-h-[80px]">
            {(() => {
              const currentSlideData = slideShowItems[currentSlide];
              const isValidSlide = currentSlide >= 0 && currentSlide < slideShowItems.length;
              console.log('Description display:', { 
                currentSlide, 
                totalSlides: slideShowItems.length, 
                isValidSlide,
                slideData: currentSlideData,
                hasDescription: !!currentSlideData?.description 
              });
              
              if (!isValidSlide) {
                return <div className="text-red-500">Invalid slide index: {currentSlide}</div>;
              }
              
              return editingDescription ? (
                <textarea
                  value={currentSlideData?.description || ''}
                  autoFocus
                  onBlur={() => setEditingDescription(false)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) setEditingDescription(false); }}
                  onChange={e => updateSlide(currentSlide, 'description', e.target.value)}
                  className="text-lg md:text-xl text-center w-full bg-transparent border-b-2 border-border focus:border-primary outline-none transition resize-none min-h-[60px] p-2"
                  style={{ background: 'rgba(255,255,255,0.7)' }}
                  placeholder="Add description..."
                />
              ) : (
                <div
                  className={`text-lg md:text-xl text-center w-full cursor-pointer select-text ${!currentSlideData?.description ? 'text-muted-foreground italic' : ''}`}
                  onClick={() => setEditingDescription(true)}
                  style={{ minHeight: 60, maxHeight: 120, overflow: 'auto' }}
                >
                  {currentSlideData?.description || 'Click to add description'}
                </div>
              );
            })()}
          </div>
        </div>
        {/* Navigation Arrows and Slide Count (below slide) */}
        <div className="flex justify-center gap-12 mt-8 items-center">
          <button
            className="bg-primary/80 hover:bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transition"
            onClick={prevSlide}
            aria-label="Previous Slide"
            disabled={slideShowItems.length <= 1}
          >
            <ChevronLeft className="h-7 w-7" />
          </button>
          <span className="text-muted-foreground text-lg font-medium">Slide {currentSlide + 1} of {slideShowItems.length}</span>
          <button
            className="bg-primary/80 hover:bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl shadow-lg transition"
            onClick={nextSlide}
            aria-label="Next Slide"
            disabled={slideShowItems.length <= 1}
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </div>
        {/* Actions (Save/Cancel) */}
        <div className="flex gap-4 pt-8 justify-center">
          <button onClick={handleSave} className="bg-primary text-white px-8 py-3 rounded shadow font-semibold text-lg">Save Presentation</button>
          {onCancel && (
            <button onClick={onCancel} className="bg-gray-200 text-gray-800 px-8 py-3 rounded shadow font-semibold text-lg">Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
} 