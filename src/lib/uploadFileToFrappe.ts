import { LMS_API_BASE_URL } from "@/config/routes";

export async function uploadFileToFrappe(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${LMS_API_BASE_URL}/api/method/upload_file`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to upload file');
  }

  const data = await response.json();
  if (data && data.message && data.message.file_url) {
    return data.message.file_url;
  }
  throw new Error('Invalid upload response');
} 