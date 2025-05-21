import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import RichEditor from '@/components/RichEditor';
import { Trash2 } from 'lucide-react';

interface Step {
  item_name: string;
  item_content: string;
}

interface StepsData {
  title: string;
  steps_item: Step[];
  type?: string;
}

interface StepsTableContentEditorProps {
  content: StepsData;
  onSave: (data: StepsData) => void;
  onCancel?: () => void;
}

interface StepsPreviewProps {
  title: string;
  steps_item: Step[];
}

export function StepsPreview({ title, steps_item }: StepsPreviewProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="flex flex-col gap-4 w-full min-h-[300px]">
      {title && (
        <h3 className="text-lg font-semibold max-w-lg">{title}</h3>
      )}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="flex flex-col border-r border-border min-w-[160px] max-w-[200px] bg-muted">
          {steps_item.map((step, idx) => (
            <div
              key={idx}
              className={`px-4 py-2 cursor-pointer border-l-4 ${
                selectedIndex === idx
                  ? 'border-primary bg-background font-semibold text-primary' 
                  : 'border-transparent text-muted-foreground'
              } flex items-center group`}
              onClick={() => setSelectedIndex(idx)}
            >
              <span className={`text-base font-medium w-full ${
                selectedIndex === idx ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {step.item_name}
              </span>
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-4">
          {steps_item[selectedIndex] && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: steps_item[selectedIndex].item_content || '' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StepsTableContentEditor({ content, onSave, onCancel }: StepsTableContentEditorProps) {
  const safeContent = content || { title: '', steps_item: [] };
  const [title, setTitle] = useState(safeContent.title);
  const [steps, setSteps] = useState<Step[]>(
    Array.isArray(safeContent.steps_item) 
      ? safeContent.steps_item.map((item: any) => ({
          item_name: item.item_name || '',
          item_content: item.item_content || '',
        }))
      : []
  );
  const [selected, setSelected] = useState<number>(0);

  useEffect(() => {
    setTitle(safeContent.title);
    const normalizedSteps = Array.isArray(safeContent.steps_item) 
      ? safeContent.steps_item.map((item: any) => ({
          item_name: item.item_name || '',
          item_content: item.item_content || '',
        }))
      : [];
    setSteps(normalizedSteps);
    setSelected(0);
  }, [safeContent]);

  const addStep = () => {
    const newStep: Step = {
      item_name: `Step ${steps.length + 1}`,
      item_content: '',
    };
    setSteps([...steps, newStep]);
    setSelected(steps.length);
  };

  const updateStepName = (index: number, name: string) => {
    setSteps(steps.map((step, idx) => 
      idx === index ? { ...step, item_name: name } : step
    ));
  };

  const updateStepContent = (index: number, content: string) => {
    setSteps(steps.map((step, idx) => 
      idx === index ? { ...step, item_content: content } : step
    ));
  };

  const deleteStep = (index: number) => {
    const newSteps = steps.filter((_, idx) => idx !== index);
    setSteps(newSteps);
    if (newSteps.length) {
      setSelected(Math.max(0, index - 1));
    }
  };

  const selectedStep = steps[selected];

  const handleSave = () => {
    onSave({ 
      title, 
      steps_item: steps,
      type: 'Steps'
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full min-h-[300px]">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Steps Title"
        className="text-lg font-semibold max-w-lg"
      />
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="flex flex-col border-r border-border min-w-[160px] max-w-[200px] bg-muted">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className={`px-4 py-2 cursor-pointer border-l-4 ${
                selected === idx 
                  ? 'border-primary bg-background font-semibold text-primary' 
                  : 'border-transparent text-muted-foreground'
              } flex items-center group`}
              onClick={() => setSelected(idx)}
            >
              <Input
                value={step.item_name}
                onChange={e => updateStepName(idx, e.target.value)}
                className={`bg-transparent border-none p-0 m-0 text-base font-medium w-full focus:ring-0 focus-visible:ring-0 ${
                  selected === idx ? 'text-primary' : 'text-muted-foreground'
                }`}
                style={{ minWidth: 0 }}
              />
              {steps.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 opacity-60 hover:opacity-100"
                  onClick={e => { 
                    e.stopPropagation(); 
                    deleteStep(idx); 
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            className="m-2 border-dashed text-muted-foreground"
            onClick={addStep}
          >
            + Add step
          </Button>
        </div>
        {/* Main content */}
        <div className="flex-1 p-4">
          {selectedStep && (
            <div className="mb-6">
            <RichEditor
                key={selected}
                content={selectedStep.item_content}
                onChange={content => updateStepContent(selected, content)}
            />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <Button onClick={handleSave}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
} 