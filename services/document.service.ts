import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { DocumentTypeCategory } from '@/types';
import { API_URL } from './config';
import { getToken } from './storage';

export const uploadDocument = async (
  vesselId: string,
  uri: string,
  type: DocumentTypeCategory,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const uploadUrl = `${API_URL}/api/vessels/${vesselId}/documents/upload`;

  try {
    // Dynamic import of expo-file-system/legacy to avoid module resolution issues
    const FileSystem = await import('expo-file-system/legacy');

    const token = await getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      parameters: {
        documentType: type as string,
        filename: fileName,
      },
      headers,
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return JSON.parse(uploadResult.body);
    } else {
      const text = uploadResult.body || '';
      console.error('Upload failed', uploadResult.status, text, { uploadUrl, fileName, documentType: type });
      const parsed = (() => {
        try { return JSON.parse(text || '{}'); } catch { return null; }
      })();
      const message = parsed?.message || text || `Server returned ${uploadResult.status}`;
      throw new Error(message);
    }
  } catch (uploadErr: any) {
    console.error('Upload error', uploadErr);
    throw new Error(uploadErr?.message ?? 'Network error during upload. Please try again.');
  }
};
