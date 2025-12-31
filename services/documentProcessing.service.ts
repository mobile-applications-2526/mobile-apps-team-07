/**
 * Document Processing Service
 *
 * Handles document OCR processing, extraction, validation, and commit operations.
 * Connects to the Spring Boot backend that uses PaddleOCR for document analysis.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './api.client';
import { API_URL } from './config.service';
import { StorageService } from './storage.service';
import {
  DocumentUploadRequest,
  DocumentUploadResponse,
  ProcessingStatusResponse,
  ExtractionResponse,
  ExtractedField,
  ValidationRequest,
  CommitRequest,
  CommitResponse,
  ProcessedDocument,
  ProcessedDocumentsPage,
  ProcessingDocumentType,
  ProcessingStatus,
} from '@/types/documentProcessing';

// Define locally to avoid import issues
const FileSystemUploadType = {
  BINARY_CONTENT: 0,
  MULTIPART: 1,
};

// Base endpoint for document processing API (uses /api/v1 prefix, unlike other services)
const DOCUMENTS_API = '/api/v1/documents';

/**
 * Upload document for OCR processing
 * Backend will auto-detect type if not specified
 */
export const uploadDocument = async (
  request: DocumentUploadRequest,
  onProgress?: (progress: number) => void
): Promise<DocumentUploadResponse> => {
  const uploadUrl = `${API_URL}${DOCUMENTS_API}/upload`;

  try {
    const token = await StorageService.getToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Build parameters
    const parameters: Record<string, string> = {};
    if (request.documentType) {
      parameters.documentType = request.documentType;
    }
    if (request.vesselId) {
      parameters.vesselId = request.vesselId.toString();
    }
    if (request.voyageId) {
      parameters.voyageId = request.voyageId.toString();
    }
    if (request.charterBaseId) {
      parameters.charterBaseId = request.charterBaseId.toString();
    }
    // asyncProcessing: false = wait for processing to complete (synchronous)
    parameters.asyncProcessing = (request.asyncProcessing ?? false).toString();
    // autoCommit: true = auto-commit extracted data to DB after successful extraction
    parameters.autoCommit = (request.autoCommit ?? true).toString();

    const uploadResult = await FileSystem.uploadAsync(uploadUrl, request.file.uri, {
      fieldName: 'file',
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART as any,
      parameters,
      headers,
    });

    if (uploadResult.status >= 200 && uploadResult.status < 300) {
      if (!uploadResult.body) {
        throw new Error('Empty response from server');
      }
      try {
        const response = JSON.parse(uploadResult.body);
        console.log('Upload response:', response);
        return response;
      } catch (e) {
        console.warn('Upload success but failed to parse response', uploadResult.body.substring(0, 100));
        throw new Error('Invalid response from server');
      }
    } else {
      const text = uploadResult.body || '';
      const logText = text.length > 500 ? text.substring(0, 500) + '...[truncated]' : text;
      console.error('Document processing upload failed', uploadResult.status, logText);

      const parsed = (() => {
        try { return JSON.parse(text || '{}'); } catch { return null; }
      })();

      const message = parsed?.message ||
        (text.startsWith('<') ? 'Server returned an HTML error page' : text) ||
        `Server returned ${uploadResult.status}`;
      throw new Error(message);
    }
  } catch (uploadErr: any) {
    console.error('Document processing upload error', uploadErr.message);
    throw new Error(uploadErr?.message ?? 'Network error during upload. Please try again.');
  }
};

/**
 * Get processing status (poll this during processing)
 */
export const getStatus = async (documentId: number): Promise<ProcessingStatusResponse> => {
  const result = await apiClient.get<ProcessingStatusResponse>(`${DOCUMENTS_API}/${documentId}/status`);
  console.log(`Status poll for doc ${documentId}:`, result.status, result.progress + '%');
  return result;
};

/**
 * Get extraction results after processing completes
 */
export const getExtraction = async (documentId: number): Promise<ExtractionResponse> => {
  return apiClient.get<ExtractionResponse>(`${DOCUMENTS_API}/${documentId}/extraction`);
};

/**
 * Validate or correct an extracted field
 */
export const validateField = async (
  documentId: number,
  fieldId: number,
  data: ValidationRequest
): Promise<ExtractedField> => {
  return apiClient.put<ExtractedField>(
    `${DOCUMENTS_API}/${documentId}/fields/${fieldId}/validate`,
    data
  );
};

/**
 * Bulk validate multiple fields
 */
export const validateFields = async (
  documentId: number,
  validations: Array<{ fieldId: number; data: ValidationRequest }>
): Promise<ExtractedField[]> => {
  return apiClient.put<ExtractedField[]>(
    `${DOCUMENTS_API}/${documentId}/fields/validate-batch`,
    validations
  );
};

/**
 * Commit extraction results to database
 */
export const commitExtraction = async (
  documentId: number,
  options?: CommitRequest
): Promise<CommitResponse> => {
  return apiClient.post<CommitResponse>(
    `${DOCUMENTS_API}/${documentId}/commit`,
    options || {}
  );
};

/**
 * Get document preview/thumbnail URL
 */
export const getPreviewUrl = (documentId: number, page: number = 1): string => {
  return `${API_URL}${DOCUMENTS_API}/${documentId}/preview?page=${page}`;
};

/**
 * Download document preview as base64
 */
export const downloadPreview = async (documentId: number, page: number = 1): Promise<string> => {
  const token = await StorageService.getToken();
  const url = getPreviewUrl(documentId, page);

  const result = await FileSystem.downloadAsync(
    url,
    `${FileSystem.cacheDirectory}preview_${documentId}_${page}.jpg`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return result.uri;
};

/**
 * Get original document download URL
 */
export const getDownloadUrl = (documentId: number): string => {
  return `${API_URL}${DOCUMENTS_API}/${documentId}/download`;
};

/**
 * Download original document
 */
export const downloadDocument = async (documentId: number, filename: string): Promise<string> => {
  const token = await StorageService.getToken();
  const url = getDownloadUrl(documentId);
  const fileUri = `${FileSystem.documentDirectory}${filename}`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return result.uri;
};

/**
 * Get documents list with filters
 */
export const getDocuments = async (params: {
  vesselId?: number;
  voyageId?: number;
  documentType?: ProcessingDocumentType;
  status?: ProcessingStatus;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<ProcessedDocumentsPage> => {
  const queryParams = new URLSearchParams();

  if (params.vesselId) queryParams.append('vesselId', params.vesselId.toString());
  if (params.voyageId) queryParams.append('voyageId', params.voyageId.toString());
  if (params.documentType) queryParams.append('documentType', params.documentType);
  if (params.status) queryParams.append('status', params.status);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size) queryParams.append('size', params.size.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortDir) queryParams.append('sortDir', params.sortDir);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `${DOCUMENTS_API}?${queryString}` : DOCUMENTS_API;

  return apiClient.get<ProcessedDocumentsPage>(endpoint);
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: number): Promise<void> => {
  return apiClient.delete<void>(`${DOCUMENTS_API}/${documentId}`);
};

/**
 * Re-process a failed document
 */
export const reprocessDocument = async (documentId: number): Promise<DocumentUploadResponse> => {
  return apiClient.post<DocumentUploadResponse>(`${DOCUMENTS_API}/${documentId}/reprocess`);
};

/**
 * Auto-detect document type from filename
 */
export const autoDetectDocumentType = (filename: string): ProcessingDocumentType | undefined => {
  const lower = filename.toLowerCase();

  if (lower.includes('q88') || lower.includes('questionnaire')) {
    return 'Q88';
  } else if (lower.includes('form') && lower.includes('c')) {
    return 'FormC';
  } else if (lower.includes('noon') || lower.includes('daily')) {
    return 'NoonReport';
  } else if (lower.includes('nor') || lower.includes('readiness')) {
    return 'NOR';
  } else if (lower.includes('charter') || lower.includes('cp')) {
    return 'CharterParty';
  } else if (lower.includes('clearance')) {
    return 'PortClearance';
  } else if (lower.includes('bl') || lower.includes('lading')) {
    return 'BL';
  } else if (lower.includes('manifest')) {
    return 'CargoManifest';
  } else if (lower.includes('sof') || lower.includes('statement')) {
    return 'SOF';
  }

  return undefined;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Get file icon based on mime type
 */
export const getFileIcon = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'table';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-text';
  return 'file';
};
