import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Presentation, MoveUp, MoveDown } from 'lucide-react';
import RichEditor from '@/components/RichEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SlideShowItem {
  option_text: string;
  slide_content: string;
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
  const [slideShowItems, setSlideShowItems] = useState<SlideShowItem[]>(
    Array.isArray(safeContent.slide_show_items) ? safeContent.slide_show_items : []
  );

  useEffect(() => {
    setTitle(safeContent.title);
    setDescription(safeContent.description);
    setProgressEnabled(safeContent.progress_enabled);
    setIsActive(safeContent.is_active);
    setSlideShowItems(Array.isArray(safeContent.slide_show_items) ? safeContent.slide_show_items : []);
  }, [safeContent]);

  const addSlide = () => {
    const newSlide: SlideShowItem = {
      option_text: '',
      slide_content: ''
    };
    setSlideShowItems([...slideShowItems, newSlide]);
  };

  const updateSlide = (index: number, field: keyof SlideShowItem, value: string) => {
    const updatedSlides = [...slideShowItems];
    updatedSlides[index] = { ...updatedSlides[index], [field]: value };
    setSlideShowItems(updatedSlides);
  };

  const deleteSlide = (index: number) => {
    setSlideShowItems(slideShowItems.filter((_, i) => i !== index));
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slideShowItems.length) return;

    const updatedSlides = [...slideShowItems];
    [updatedSlides[index], updatedSlides[newIndex]] = [updatedSlides[newIndex], updatedSlides[index]];
    setSlideShowItems(updatedSlides);
  };

  const handleSave = () => {
    const payload = {
      title,
      description,
      progress_enabled: progressEnabled,
      is_active: isActive,
      slide_show_items: slideShowItems
    };
    onSave(payload);
  };

  return (
    <div className="space-y-6">
      {/* Slide Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            Slide Presentation Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Presentation Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter presentation title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <RichEditor 
              content={description} 
              onChange={setDescription}
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="progressEnabled"
                checked={progressEnabled}
                onCheckedChange={(checked) => setProgressEnabled(checked === true)}
              />
              <Label htmlFor="progressEnabled">Enable Progress Tracking</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slides */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Slides ({slideShowItems.length})</h3>
          <Button onClick={addSlide} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        </div>

        {slideShowItems.map((slide, slideIndex) => (
          <Card key={slideIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Slide {slideIndex + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(slideIndex, 'up')}
                    disabled={slideIndex === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSlide(slideIndex, 'down')}
                    disabled={slideIndex === slideShowItems.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteSlide(slideIndex)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Slide Title</Label>
                <Input
                  value={slide.option_text}
                  onChange={(e) => updateSlide(slideIndex, 'option_text', e.target.value)}
                  placeholder="Enter slide title"
                />
              </div>

              <div>
                <Label>Slide Content</Label>
                <RichEditor
                  content={slide.slide_content}
                  onChange={(value) => updateSlide(slideIndex, 'slide_content', value)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={!title || slideShowItems.length === 0}>
          Save Presentation
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
} 