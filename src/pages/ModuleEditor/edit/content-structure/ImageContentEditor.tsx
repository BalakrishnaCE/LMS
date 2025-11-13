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
  
  const [preview, setPreview] = useState(getPreviewUrl(content.attach || ''));
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create immediate local preview
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);
    setFileName(file.name);
    setUploading(true);
    
    try {
      const url = await uploadFileToFrappe(file);
      console.log('📸 Uploaded image URL:', url);
      
      // Store the relative path
      setAttach(url);
      
      // Construct full URL for preview using the same logic
      const fullImageUrl = getPreviewUrl(url);
      
      
      
      // Test if the server image loads before switching from local preview
      const testImage = new Image();
      testImage.onload = () => {
       
        // Revoke local preview and switch to server URL
        URL.revokeObjectURL(localPreview);
        setPreview(fullImageUrl);
      };
      testImage.onerror = () => {
        console.error('❌ Server image failed to load, keeping local preview');
        console.error('Failed URL:', fullImageUrl);
        // Keep local preview if server image fails
      };
      testImage.src = fullImageUrl;
      
    } catch (err) {
      // Revoke local preview on error
      URL.revokeObjectURL(localPreview);
      console.error('Upload error:', err);
      setPreview('');
      setAttach('');
      setFileName('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Image</Label>
        <Input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
        {uploading && <div className="text-sm text-muted-foreground mt-1">Uploading...</div>}
        {preview && (
          <div className="mt-2">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-xs rounded border object-contain"
              onError={(e) => {
                console.error('❌ Failed to load preview image:', e.currentTarget.src);
              }}
              onLoad={() => {
                console.log('✅ Preview image loaded successfully');
              }}
            />
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-start">
        <Button onClick={() => onSave({ title: fileName || title, attach })} disabled={!attach || uploading}>
          Save
        </Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
};

export default ImageContentEditor; 