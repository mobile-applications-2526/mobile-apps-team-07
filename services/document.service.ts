import { Platform } from 'react-native';
import { DocumentTypeCategory } from '@/types';
import { API_URL } from './config';
import { getToken } from './storage';

// Define locally to avoid import definition issues at runtime
// Define locally to avoid import definition issues at runtime
export const uploadDocument = async (
  vesselId: string,
  uri: string,
  type: DocumentTypeCategory,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const uploadUrl = `${API_URL}/api/vessels/${vesselId}/documents/upload`;

  try {
    const token = await getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append('file', {
      uri,
      name: fileName,
      type: mimeType || 'application/pdf',
    } as any);
    formData.append('documentType', type as string);

    // Use fetch instead of FileSystem.uploadAsync for better control over filename
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: headers as any, // TS Cast for headers compatible with fetch
      body: formData,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }

    if (response.ok) {
      return data;
    } else {
      const message = data?.message || text || `Server returned ${response.status}`;
      throw new Error(message);
    }
  } catch (uploadErr: any) {
    console.error('Upload error', uploadErr);
    throw new Error(uploadErr?.message ?? 'Network error during upload. Please try again.');
  }
};
