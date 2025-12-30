import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { DocumentCategory, DocumentType } from '@/types';
import { API_URL } from './config.service';
import { StorageService } from './storage.service';
import { apiClient } from './api-client.service';

// Define locally to avoid import definition issues at runtime
const FileSystemUploadType = {
  BINARY_CONTENT: 0,
  MULTIPART: 1,
};

export const downloadDocument = async (
  url: string
): Promise<any> => {
  const token = await StorageService.getToken();

  // Extract filename from URL
  const filename = url.split('/').pop() || 'document.pdf';
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  // Download with auth
  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  // Open file
  await Sharing.shareAsync(result.uri);
}

export const replaceDocument = async (
  documentId: string,
  subjecId: string,
  subject: DocumentCategory,
  uri: string,
  type: DocumentType,
): Promise<Document> => {
  const uploadUrl = `${API_URL}/api/${subject}/${subjecId}/documents/${documentId}/replace`;

  try {
    // Dynamic import usage was causing issues, try static import or mixed approach
    // We already imported legacy as FileSystem above

    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
      fieldName: 'file',
      httpMethod: 'PUT',
      uploadType: FileSystemUploadType.MULTIPART as any,
      parameters: {
        documentType: type as string,
      },
      headers,
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      return JSON.parse(uploadResult.body);
    } else {
      const text = uploadResult.body || '';
      console.error('Upload failed', uploadResult.status, text, { uploadUrl, documentType: type });
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

export const deleteDocument = async (
  id: string 
): Promise<void> => {
  const deleteUrl = `/api/documents/${id}`;
  return await apiClient.delete<void>(deleteUrl); 
};

export const uploadDocument = async (
  subjecId: string,
  subject: DocumentCategory,
  uri: string,
  type: DocumentType,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const uploadUrl = `${API_URL}/api/${subject}/${subjecId}/documents/upload`;

  try {
    // Dynamic import usage was causing issues, try static import or mixed approach
    // We already imported legacy as FileSystem above

    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART as any,
      parameters: {
        documentType: type as string,
      },
      headers,
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      if (!uploadResult.body) return {};
      try {
        return JSON.parse(uploadResult.body);
      } catch (e) {
        console.warn('Upload success but failed to parse response', uploadResult.body.substring(0, 100));
        return {}; // Return empty object on success but parse fail, rather than throw
      }
    } else {
      const text = uploadResult.body || '';
      // Prevent logging massive HTML strings
      const logText = text.length > 500 ? text.substring(0, 500) + '...[truncated]' : text;

      console.error('Upload failed', uploadResult.status, logText, { uploadUrl, documentType: type });

      const parsed = (() => {
        try { return JSON.parse(text || '{}'); } catch { return null; }
      })();

      const message = parsed?.message || (text.startsWith('<') ? 'Server returned an HTML error page' : text) || `Server returned ${uploadResult.status}`;
      throw new Error(message);
    }
  } catch (uploadErr: any) {
    console.error('Upload error in service', uploadErr.message);
    throw new Error(uploadErr?.message ?? 'Network error during upload. Please try again.');
  }
};
