import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import RichEditor from '@/components/RichEditor';

interface TextContentEditorProps {
  content: { title: string; body: string;};
  onSave: (content: { body: string;}) => void;
  onCancel?: () => void;
}

const TextContentEditor: React.FC<TextContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [body, setBody] = useState(content.body || '');
  // const [alignment, setAlignment] = useState<Alignment>(content.alignment || 'left');

  const handleSave = () => {
    onSave({ body });
  };

  return (
    <div className="space-y-4">
      <div >
        <RichEditor content={body} onChange={setBody} />
      </div>
      <div className="flex gap-2 justify-start mt-4">
        <Button onClick={handleSave} disabled={!body}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default TextContentEditor; 