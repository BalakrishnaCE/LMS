import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface IframeContentEditorProps {
  content: { 
    title: string; 
    url: string;
  };
  onSave: (data: any) => void;
  onCancel?: () => void;
}

export default function IframeContentEditor({ content, onSave, onCancel }: IframeContentEditorProps) {
  const safeContent = content || { 
    title: '', 
    url: ''
  };

  const [title, setTitle] = useState(safeContent.title);
  const [url, setUrl] = useState(safeContent.url);

  useEffect(() => {
    setTitle(safeContent.title);
    setUrl(safeContent.url);
  }, [safeContent]);

  const handleSave = () => {
    const payload = {
      title,
      url
    };
    onSave(payload);
  };

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const getDomain = (urlString: string) => {
    try {
      return new URL(urlString).hostname;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Iframe Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Iframe Content Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className='mb-3'>Content Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for this embedded content"
            />
          </div>
          
          <div>
            <Label htmlFor="url" className='mb-3'>URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
            {url && !isValidUrl(url) && (
              <p className="text-sm text-red-500 mt-1">Please enter a valid URL</p>
            )}
            {url && isValidUrl(url) && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span>Domain: {getDomain(url)}</span>
              </div>
            )}
          </div>
        {/* Preview */}
        {url && isValidUrl(url) && (
        <div className="">
          <div className="font-bold mb-2">{content.title}</div>
            <div className="border rounded-lg overflow-hidden bg-muted/30">
              <div className="p-3 bg-muted/50 border-b">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">{content.title || 'Embedded Content'}</span>
                </div>
              </div>
              <div className="aspect-video">
                <iframe
                  src={url}
                  className="w-full h-full"
                  title={content.title || 'Embedded Content'}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
          </div>
      )}
      </CardContent>
      </Card>
      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={!title || !url || !isValidUrl(url)}>
          Save Iframe Content
        </Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
} 