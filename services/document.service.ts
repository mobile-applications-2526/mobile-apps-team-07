import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '.';
import { DocumentTypeCategory } from '@/types';

// Use legacy API for expo-file-system which provides uploadAsync
const LegacyFileSystem: any = FileSystem;

export const uploadDocument = async (
  vesselId: string,
  uri: string,
  type: DocumentTypeCategory,
  fileName: string,
  onProgress: (progress: number) => void
): Promise<any> => {
  const uploadUrl = `${API_URL}/api/vessels/${vesselId}/documents/upload`;

  try {
    const uploadResult = await LegacyFileSystem.uploadAsync(uploadUrl, uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: LegacyFileSystem.FileSystemUploadType.MULTIPART,
      parameters: {
        documentType: type as string,
        filename: fileName,
      },
      headers: {
        Accept: 'application/json',
      },
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
