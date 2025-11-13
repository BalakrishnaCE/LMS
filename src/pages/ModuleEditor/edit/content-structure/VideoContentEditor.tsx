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
  
  // Create preview URL from stored content (handle both relative and full URLs)
  // Uses lms.noveloffice.org as base URL in both development and production
  const getPreviewUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    
    // If already a full URL, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    
    // Ensure path starts with / if it doesn't already
    const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    
    // Determine base URL
    // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
    // In development: use http://lms.noveloffice.org
    const baseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    return `${cleanBaseUrl}${relativePath}`;
  };
  const [preview, setPreview] = useState(getPreviewUrl(content.video || ''));
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
        // Create full URL for preview using the same logic
        const fullUrl = getPreviewUrl(url);
        setPreview(fullUrl);
        // Store only the relative path
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