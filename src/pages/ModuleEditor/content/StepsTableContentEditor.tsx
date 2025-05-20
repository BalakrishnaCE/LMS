import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import RichEditor from '@/components/RichEditor';

interface StepItem {
  item_name: string;
  item_content: string;
}

interface StepsTableContentEditorProps {
  content: { title: string; steps_table: StepItem[] };
  onSave: (content: { title: string; steps_table: StepItem[] }) => void;
  onCancel?: () => void;
}

const StepsTableContentEditor: React.FC<StepsTableContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title || '');
  const [steps, setSteps] = useState<StepItem[]>(content.steps_table || []);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newStep, setNewStep] = useState<StepItem>({ item_name: '', item_content: '' });

  const handleStepChange = (idx: number, field: keyof StepItem, value: string) => {
    setSteps(prev => prev.map((step, i) => i === idx ? { ...step, [field]: value } : step));
  };

  const handleAddStep = () => {
    if (!newStep.item_name.trim() && !newStep.item_content.trim()) return;
    setSteps(prev => [...prev, newStep]);
    setNewStep({ item_name: '', item_content: '' });
  };

  const handleRemoveStep = (idx: number) => {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  };

  const handleReorderStep = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= steps.length) return;
    const updated = [...steps];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setSteps(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter steps table title" />
      </div>
      <div>
        <Label>Steps</Label>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="space-y-2 border rounded p-4">
              <div className="flex items-center gap-2">
                <Input
                  value={step.item_name}
                  onChange={e => handleStepChange(idx, 'item_name', e.target.value)}
                  placeholder="Step name"
                  className="w-1/4"
                />
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => handleReorderStep(idx, idx - 1)} disabled={idx === 0}>↑</Button>
                  <Button size="icon" variant="ghost" onClick={() => handleReorderStep(idx, idx + 1)} disabled={idx === steps.length - 1}>↓</Button>
                  <Button size="icon" variant="destructive" onClick={() => handleRemoveStep(idx)}>✕</Button>
                </div>
              </div>
              <div>
                <Label>Content</Label>
                <RichEditor
                  content={step.item_content}
                  onChange={value => handleStepChange(idx, 'item_content', value)}
                />
              </div>
            </div>
          ))}
          <div className="space-y-2 border rounded p-4">
            <div className="flex items-center gap-2">
              <Input
                value={newStep.item_name}
                onChange={e => setNewStep(s => ({ ...s, item_name: e.target.value }))}
                placeholder="Step name"
                className="w-1/4"
              />
              <Button size="sm" onClick={handleAddStep} disabled={!newStep.item_name && !newStep.item_content}>Add</Button>
            </div>
            <div>
              <Label>Content</Label>
              <RichEditor
                content={newStep.item_content}
                onChange={value => setNewStep(s => ({ ...s, item_content: value }))}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button onClick={() => onSave({ title, steps_table: steps })}>Save</Button>
      </div>
    </div>
  );
};

export default StepsTableContentEditor; 