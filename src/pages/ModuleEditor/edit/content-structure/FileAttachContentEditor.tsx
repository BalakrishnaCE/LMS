import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { uploadFileToFrappe } from '@/lib/uploadFileToFrappe';

interface FileAttachContentEditorProps {
  content: { title: string; attachment: string };
  onSave: (content: { title: string; attachment: string }) => void;
  onCancel?: () => void;
}

const FileAttachContentEditor: React.FC<FileAttachContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [attachment, setAttachment] = useState(content.attachment || '');
  const [fileName, setFileName] = useState((content.attachment && content.attachment.split('/').pop()) || '');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFileToFrappe(file);
      setFileName(file.name);
        setAttachment(url);
      } catch (err) {
        // handle error, e.g. show toast
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>File</Label>
        <Input type="file" onChange={handleFileChange} />
        {fileName && <div className="mt-2 text-sm">Selected: {fileName}</div>}
      </div>
      <div className="flex gap-2 justify-start">
        <Button onClick={() => onSave({ title: fileName, attachment })} disabled={!attachment}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default FileAttachContentEditor; 