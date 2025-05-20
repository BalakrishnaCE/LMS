export async function uploadFileToFrappe(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://10.80.4.72/api/method/upload_file', {
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