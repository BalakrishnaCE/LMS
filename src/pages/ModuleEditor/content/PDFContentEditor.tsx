import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface PDFContentEditorProps {
  content: { title: string; pdf: string };
  onSave: (content: { title: string; pdf: string }) => void;
  onCancel?: () => void;
}

const PDFContentEditor: React.FC<PDFContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title || '');
  const [pdf, setPdf] = useState(content.pdf || '');
  const [fileName, setFileName] = useState(content.pdf ? content.pdf.split('/').pop() : '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setPdf(file.name); // Placeholder
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter PDF title" />
      </div>
      <div>
        <Label>PDF File</Label>
        <Input type="file" accept="application/pdf" onChange={handleFileChange} />
        {fileName && <div className="mt-2 text-sm">Selected: {fileName}</div>}
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button onClick={() => onSave({ title, pdf })} disabled={!pdf}>Save</Button>
      </div>
    </div>
  );
};

export default PDFContentEditor; 