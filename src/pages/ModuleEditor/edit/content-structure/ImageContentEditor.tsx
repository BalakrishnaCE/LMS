import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { uploadFileToFrappe } from '@/lib/uploadFileToFrappe';
import { LMS_API_BASE_URL } from "@/config/routes";

interface ImageContentEditorProps {
  content: { title: string; attach: string };
  onSave: (content: { title: string; attach: string }) => void;
  onCancel?: () => void;
}

const ImageContentEditor: React.FC<ImageContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title || '');
  const [attach, setAttach] = useState(content.attach || '');
  const [preview, setPreview] = useState(content.attach || '');
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFileToFrappe(file);
        setPreview(LMS_API_BASE_URL + url);
        setAttach(url);
        setFileName(file.name);
      } catch (err) {
        // handle error, e.g. show toast
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Image</Label>
        <Input type="file" accept="image/*" onChange={handleFileChange} />
        {preview && <img src={preview} alt="Preview" className="max-w-xs mt-2 rounded" />}
      </div>
      <div className="flex gap-2 justify-start">
        <Button onClick={() => onSave({ title: fileName, attach })} disabled={!attach}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default ImageContentEditor; 