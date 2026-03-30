import { LMS_API_BASE_URL } from "@/config/routes";

export async function uploadFileToFrappe(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  // Check if it's an audio file
  const isAudioFile = file.type.startsWith('audio/') || 
    /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(file.name);

  // Determine base URL
  // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
  // In development: use http://lms.noveloffice.org or relative path for Vite proxy
  let uploadUrl: string;
  if (LMS_API_BASE_URL) {
    const cleanBaseUrl = LMS_API_BASE_URL.replace(/\/$/, '');
    // Use custom audio upload endpoint for audio files
    uploadUrl = isAudioFile 
      ? `${cleanBaseUrl}/api/method/novel_lms.novel_lms.api.content_management.upload_audio_file`
      : `${cleanBaseUrl}/api/method/upload_file`;
  } else {
    // Use relative path so Vite proxy handles it
    uploadUrl = isAudioFile
      ? '/api/method/novel_lms.novel_lms.api.content_management.upload_audio_file'
      : '/api/method/upload_file';
  }
  
  console.log('📤 Upload URL:', uploadUrl);
  console.log('📤 File type:', file.type, 'Is audio:', isAudioFile);
  console.log('📤 Target server:', LMS_API_BASE_URL || 'https://lms.noveloffice.org (via Vite proxy)');

  try {
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText,
        url: uploadUrl
      });
      
      let errorMessage = `Failed to upload file: ${response.status} ${response.statusText}`;
      
      if (response.status === 417) {
        errorMessage = 'Upload validation failed. Please ensure the file is valid and try again.';
      } else if (response.status === 403) {
        errorMessage = 'Permission denied. You do not have permission to upload files. Please contact your administrator.';
      } else if (response.status === 401) {
        errorMessage = 'Authentication required. Please log in and try again.';
      } else {
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.exception) {
            const exceptionMatch = errorData.exception.match(/ValidationError:\s*(.+?)(?:\n|$)/);
            if (exceptionMatch) {
              errorMessage = `Validation error: ${exceptionMatch[1]}`;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If parsing fails, use the error text as is
          if (errorText) {
            errorMessage = errorText;
          }
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('📁 Upload response:', data);
    
    // Handle nested response structure (message.message.file_url for custom endpoints)
    // or flat structure (message.file_url for standard upload_file)
    let fileUrl = null;
    if (data && data.message) {
      // Check for nested structure (custom audio upload endpoint)
      if (data.message.message && data.message.message.file_url) {
        fileUrl = data.message.message.file_url;
      }
      // Check for flat structure (standard upload_file endpoint)
      else if (data.message.file_url) {
        fileUrl = data.message.file_url;
      }
    }
    
    if (fileUrl) {
      
      console.log('📁 Raw file URL from server:', fileUrl);
      
      // Extract relative path from full URL if needed
      if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
        try {
          const url = new URL(fileUrl);
          fileUrl = url.pathname;
        } catch (e) {
          const pathMatch = fileUrl.match(/\/files\/.*/);
          if (pathMatch) {
            fileUrl = pathMatch[0];
          } else {
            fileUrl = fileUrl.replace(/^https?:\/\/[^\/]+/, '');
          }
        }
      }
      
      // Ensure path starts with /
      if (!fileUrl.startsWith('/')) {
        fileUrl = `/${fileUrl}`;
      }
      
      console.log('🔗 Final file URL (relative path):', fileUrl);
      return fileUrl;
    }
    throw new Error('Invalid upload response: file_url not found in response');
  } catch (error) {
    console.error('❌ Upload error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Upload failed: ${String(error)}`);
  }
} 