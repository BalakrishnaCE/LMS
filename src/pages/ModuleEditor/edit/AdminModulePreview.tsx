import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BASE_PATH } from '@/config/routes';

interface AdminModulePreviewProps {
  moduleName?: string;
  onClose: () => void;
}

export default function AdminModulePreview({ moduleName, onClose }: AdminModulePreviewProps) {
  const previewUrl = `${BASE_PATH}/modules/learner/${moduleName}`;
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Module Preview: {moduleName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 p-6 pt-4">
          <iframe
            src={previewUrl}
            className="w-full h-[80vh] border rounded-lg"
            title={`Preview of ${moduleName}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
