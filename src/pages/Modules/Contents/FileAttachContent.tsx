import { motion } from "framer-motion";
import { LMS_API_BASE_URL } from "@/config/routes";

interface FileAttachContentProps {
  content: {
    title: string;
    attachment?: string;
  };
}

export default function FileAttachContent({ content }: FileAttachContentProps) {
  // Helper function to get full file URL from base URL
  // Uses lms.noveloffice.org as base URL in both development and production
  const getFileUrl = (path?: string): string => {
    if (!path) return '';
    const trimmed = path.trim();
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

  // Add null/undefined checks for content.attachment
  if (!content?.attachment) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4"
      >
        <div className="font-semibold text-lg">{content?.title || 'File Attachment'}</div>
        <div className="text-muted-foreground">No file attachment available</div>
      </motion.div>
    );
  }

  const fileUrl = getFileUrl(content.attachment);
  const fileName = content.title || content.attachment.split('/').pop() || 'download';

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    console.log('📥 Downloading file:', { fileUrl, fileName, originalAttachment: content.attachment });
    
    try {
      // Try to fetch the file with credentials to handle authentication
      const response = await fetch(fileUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': '*/*',
        },
      });

      if (!response.ok) {
        console.error('❌ File download failed:', {
          status: response.status,
          statusText: response.statusText,
          url: fileUrl
        });
        // Fallback: open in new tab
        window.open(fileUrl, '_blank');
        return;
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('✅ File downloaded successfully');
    } catch (error) {
      console.error('❌ Error downloading file:', error);
      // Fallback: open in new tab if fetch fails
      window.open(fileUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4"
    >
      <div className="font-semibold text-lg">{content.title}</div>
      <a
        href={fileUrl}
        onClick={handleDownload}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline font-medium mt-2 hover:text-primary/80 cursor-pointer"
      >
        Download File
      </a>
    </motion.div>
  );
} 