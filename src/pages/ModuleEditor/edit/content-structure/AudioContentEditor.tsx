import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { uploadFileToFrappe } from '@/lib/uploadFileToFrappe';
import { LMS_API_BASE_URL } from "@/config/routes";
import Lottie from 'lottie-react';
import LoadingAnimation from '@/assets/Loading.json';
import ErrorAnimation from '@/assets/Error.json';

interface AudioContentEditorProps {
  content: { title: string; attach: string };
  onSave: (content: { title: string; attach: string }) => void;
  onCancel?: () => void;
}

const AudioContentEditor: React.FC<AudioContentEditorProps> = ({ content, onSave, onCancel }) => {
  const [title, setTitle] = useState(content.title || '');
  const [attach, setAttach] = useState(content.attach || '');
  const [preview, setPreview] = useState(content.attach || '');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const url = await uploadFileToFrappe(file);
        setPreview(url);
        setAttach(url);
        setFileName(file.name);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter audio title"
          className="mt-1"
        />
      </div>
      <div>
        <Label>Audio File</Label>
        {loading && <Lottie animationData={LoadingAnimation} loop={true} className="w-20 h-20" />}
        {error && <Lottie animationData={ErrorAnimation} loop={true} className="w-20 h-20" />}
        {!loading && !error && <Input type="file" accept="audio/*" onChange={handleFileChange} disabled={loading} />}
        {preview && <audio src={LMS_API_BASE_URL + preview} controls className="w-full mt-2 rounded" />}
      </div>
      <div className="flex gap-2 justify-start">
        <Button onClick={() => onSave({ title: title || fileName, attach })} disabled={!attach || loading}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default AudioContentEditor; 