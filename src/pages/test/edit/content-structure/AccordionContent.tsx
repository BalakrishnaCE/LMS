import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichEditor from '@/components/RichEditor';
import { Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface AccordionChild {
  name?: string;
  header_title: string;
  body_content: string;
  image?: string;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  doctype?: string;
  docstatus?: number;
  idx?: number;
  creation?: string;
  modified?: string;
  modified_by?: string;
  owner?: string;
}

interface AccordionData {
  title: string;
  description?: string;
  accordion_items: AccordionChild[];
  type?: string;
  id?: string;
  reference?: string;
}

interface AccordionContentEditorProps {
  content: AccordionData;
  onSave: (data: AccordionData) => void;
  onCancel?: () => void;
}

export default function AccordionContentEditor({ content, onSave, onCancel }: AccordionContentEditorProps) {
  const [title, setTitle] = useState(content.title || '');
  const [description, setDescription] = useState(content.description || '');
  const [items, setItems] = useState<AccordionChild[]>(content.accordion_items || []);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const handleAddItem = () => {
    const newItem: AccordionChild = {
      header_title: '',
      body_content: '',
      image: '',
      doctype: 'Accordion Item Child',
      parentfield: 'accordion_items',
      parenttype: 'Accordion Content',
      docstatus: 0
    };
    setItems([...items, newItem]);
    setExpandedItem(`item-${items.length}`);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    setExpandedItem(null);
  };

  const handleItemChange = (index: number, field: keyof AccordionChild, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      accordion_items: items,
      type: 'Accordion Content'
    });
  };

  return (
    <div className="bg-background border border-border rounded-lg p-6 w-full  mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter accordion title"
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <RichEditor
              content={description}
              onChange={setDescription}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Accordion Items</Label>
            <Button 
              type="button" 
              onClick={handleAddItem} 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2  hover:text-primary"
            >
              <Plus className="w-4 h-4" />
              Add New Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-border rounded-lg">
                <p className="text-muted-foreground mb-4">No items added yet</p>
                <Button 
                  type="button" 
                  onClick={handleAddItem} 
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Item
                </Button>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="border border-border rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-4 bg-muted cursor-pointer"
                    onClick={() => setExpandedItem(expandedItem === `item-${index}` ? null : `item-${index}`)}
                  >
                    <div className="flex-1">
                      <Input
                        value={item.header_title}
                        onChange={(e) => handleItemChange(index, 'header_title', e.target.value)}
                        placeholder="Enter header title"
                        className="bg-transparent border-none p-0 focus-visible:ring-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(index);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronDown 
                        className={`w-5 h-5 transition-transform ${expandedItem === `item-${index}` ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                  
                  {expandedItem === `item-${index}` && (
                    <div className="p-4 space-y-4">
                      <div>
                        <Label>Content</Label>
                        <RichEditor
                          content={item.body_content}
                          onChange={(value) => handleItemChange(index, 'body_content', value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-start gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

interface AccordionPreviewProps {
  title: string;
  description?: string;
  accordion_items: AccordionChild[];
}

export function AccordionPreview({ title, description, accordion_items }: AccordionPreviewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set([0]));

  const toggleItem = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {title && (
        <h3 className="text-lg font-semibold">{title}</h3>
      )}
      {description && (
        <div 
          className="prose prose-sm dark:prose-invert mb-4"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
      <div className="flex flex-col gap-2">
        {accordion_items.map((item, index) => (
          <div key={item.name || index} className="border rounded-lg overflow-hidden">
            <button
              className="w-full px-4 py-3 flex items-center justify-between bg-muted hover:bg-accent transition-colors"
              onClick={() => toggleItem(index)}
            >
              <span className="font-medium">{item.header_title}</span>
              {expandedItems.has(index) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {expandedItems.has(index) && (
              <div className="p-4 bg-background">
                <div 
                  className="prose prose-sm dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: item.body_content }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 