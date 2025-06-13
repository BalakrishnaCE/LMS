import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { uploadFileToFrappe } from '@/lib/uploadFileToFrappe';
import { LMS_API_BASE_URL } from "@/config/routes";
import Lottie from 'lottie-react';
import LoadingAnimation from '@/assets/Loading.json';
import ErrorAnimation from '@/assets/Error.json';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // set loading to true
        setLoading(true);
        const url = await uploadFileToFrappe(file);
        setPreview(LMS_API_BASE_URL + url);
        setVideo(url);
        setFileName(file.name);
        // set loading to false
        setLoading(false);
      } catch (err) {
        // handle error, e.g. show toast
        setLoading(false);
        setError(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Video</Label>
        {loading && <Lottie animationData={LoadingAnimation} loop={true} className="w-20 h-20" />}
        {error && <Lottie animationData={ErrorAnimation} loop={true} className="w-20 h-20" />}
        {!loading && !error && <Input type="file" accept="video/*" onChange={handleFileChange} disabled={loading} />}
        {preview && <video src={preview} controls className="max-w-xs mt-2 rounded" />}
      </div>
      <div className="flex gap-2 justify-start">
        <Button onClick={() => onSave({ title: fileName, video })} disabled={!video || loading}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default VideoContentEditor; 