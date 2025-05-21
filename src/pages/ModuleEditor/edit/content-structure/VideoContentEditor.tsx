import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { uploadFileToFrappe } from '@/lib/uploadFileToFrappe';

interface VideoContentEditorProps {
  content: { title: string; video: string };
  onSave: (content: { title: string; video: string }) => void;
  onCancel?: () => void;
}

const VideoContentEditor: React.FC<VideoContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title || '');
  const [video, setVideo] = useState(content.video || '');
  const [preview, setPreview] = useState(content.video || '');
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFileToFrappe(file);
        setPreview("http://10.80.4.72" + url);
        setVideo(url);
        setFileName(file.name);
      } catch (err) {
        // handle error, e.g. show toast
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Video</Label>
        <Input type="file" accept="video/*" onChange={handleFileChange} />
        {preview && <video src={"http://10.80.4.72" + preview} controls className="max-w-xs mt-2 rounded" />}
      </div>
      <div className="flex gap-2 justify-start">
        <Button onClick={() => onSave({ title: fileName, video })} disabled={!video}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default VideoContentEditor; 