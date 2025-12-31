/**
 * Document Service Unit Tests
 *
 * Tests document operations including:
 * - Downloading documents
 * - Uploading documents
 * - Replacing documents
 * - Deleting documents
 * - File validation
 */

import {
  downloadDocument,
  uploadDocument,
  replaceDocument,
  deleteDocument,
} from '../../services/document.service';
import { StorageService } from '../../services/storage.service';
import { apiClient } from '../../services/api-client.service';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Mock dependencies
jest.mock('../../services/storage.service', () => ({
  StorageService: {
    getToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

jest.mock('../../services/api-client.service', () => ({
  apiClient: {
    delete: jest.fn(),
  },
}));

jest.mock('../../services/config.service', () => ({
  API_URL: 'https://api.test.com',
}));

// FileSystem and Sharing are already mocked in jest.setup.js

describe('Document Service', () => {
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
    (StorageService.getToken as jest.Mock).mockResolvedValue(mockToken);
  });

  // ============================================
  // DOWNLOAD DOCUMENT
  // ============================================
  describe('downloadDocument', () => {
    it('should download document and share', async () => {
      const documentUrl = 'https://api.test.com/documents/q88.pdf';
      const downloadResult = { uri: '/mock/documents/q88.pdf' };

      (FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce(downloadResult);
      (Sharing.shareAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await downloadDocument(documentUrl);

      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        documentUrl,
        expect.stringContaining('q88.pdf'),
        expect.objectContaining({
          headers: {
            Authorization: `Bearer ${mockToken}`,
          },
        })
      );
      expect(Sharing.shareAsync).toHaveBeenCalledWith(downloadResult.uri);
    });

    it('should extract filename from URL', async () => {
      const documentUrl = 'https://api.test.com/files/voyage-report.pdf';
      const downloadResult = { uri: '/mock/documents/voyage-report.pdf' };

      (FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce(downloadResult);
      (Sharing.shareAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await downloadDocument(documentUrl);

      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        documentUrl,
        expect.stringContaining('voyage-report.pdf'),
        expect.any(Object)
      );
    });

    it('should use default filename when URL has no filename', async () => {
      const documentUrl = 'https://api.test.com/files/';
      const downloadResult = { uri: '/mock/documents/document.pdf' };

      (FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce(downloadResult);
      (Sharing.shareAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await downloadDocument(documentUrl);

      expect(FileSystem.downloadAsync).toHaveBeenCalledWith(
        documentUrl,
        expect.stringContaining('document.pdf'),
        expect.any(Object)
      );
    });

    it('should throw error on download failure', async () => {
      const documentUrl = 'https://api.test.com/documents/q88.pdf';
      (FileSystem.downloadAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Download failed')
      );

      await expect(downloadDocument(documentUrl)).rejects.toThrow('Download failed');
    });
  });

  // ============================================
  // UPLOAD DOCUMENT
  // ============================================
  describe('uploadDocument', () => {
    const uploadParams = {
      subjectId: '1',
      subject: 'vessels' as const,
      uri: 'file:///path/to/document.pdf',
      type: 'Q88' as const,
    };

    it('should upload document successfully', async () => {
      const mockResponse = { id: 1, type: 'Q88', name: 'document.pdf' };
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify(mockResponse),
      });

      const result = await uploadDocument(
        uploadParams.subjectId,
        uploadParams.subject,
        uploadParams.uri,
        uploadParams.type
      );

      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels/1/documents/upload',
        uploadParams.uri,
        expect.objectContaining({
          fieldName: 'file',
          httpMethod: 'POST',
          parameters: {
            documentType: uploadParams.type,
          },
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle 201 Created response', async () => {
      const mockResponse = { id: 2, type: 'Form C', name: 'form-c.pdf' };
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 201,
        body: JSON.stringify(mockResponse),
      });

      const result = await uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Form C');

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on 400 Bad Request', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 400,
        body: JSON.stringify({ message: 'Invalid file type' }),
      });

      await expect(
        uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Q88')
      ).rejects.toThrow('Invalid file type');
    });

    it('should throw error on 413 file too large', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 413,
        body: JSON.stringify({ message: 'File too large' }),
      });

      await expect(
        uploadDocument('1', 'vessels', 'file:///large.pdf', 'Q88')
      ).rejects.toThrow('File too large');
    });

    it('should throw error on 500 server error', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 500,
        body: '<html>Server Error</html>',
      });

      await expect(
        uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Q88')
      ).rejects.toThrow('Server returned an HTML error page');
    });

    it('should handle empty response body on success', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: '',
      });

      const result = await uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Q88');

      expect(result).toEqual({});
    });

    it('should handle network error', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(
        uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Q88')
      ).rejects.toThrow('Network error');
    });

    it('should upload to voyage documents endpoint', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ id: 1 }),
      });

      await uploadDocument('5', 'voyages', 'file:///doc.pdf', 'Statement of Facts');

      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        'https://api.test.com/api/voyages/5/documents/upload',
        expect.any(String),
        expect.any(Object)
      );
    });

    it('should upload to cargo documents endpoint', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ id: 1 }),
      });

      await uploadDocument('3', 'cargoes', 'file:///doc.pdf', 'Bill of Lading');

      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        'https://api.test.com/api/cargoes/3/documents/upload',
        expect.any(String),
        expect.any(Object)
      );
    });
  });

  // ============================================
  // REPLACE DOCUMENT
  // ============================================
  describe('replaceDocument', () => {
    it('should replace document successfully', async () => {
      const mockResponse = { id: 1, type: 'Q88', name: 'new-document.pdf' };
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify(mockResponse),
      });

      const result = await replaceDocument(
        '1',
        '10',
        'vessels',
        'file:///new-doc.pdf',
        'Q88'
      );

      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels/10/documents/1/replace',
        'file:///new-doc.pdf',
        expect.objectContaining({
          httpMethod: 'PUT',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should throw error on replace failure', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 404,
        body: JSON.stringify({ message: 'Document not found' }),
      });

      await expect(
        replaceDocument('999', '10', 'vessels', 'file:///doc.pdf', 'Q88')
      ).rejects.toThrow('Document not found');
    });
  });

  // ============================================
  // DELETE DOCUMENT
  // ============================================
  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce(undefined);

      await expect(deleteDocument('1')).resolves.toBeUndefined();

      expect(apiClient.delete).toHaveBeenCalledWith('/api/documents/1');
    });

    it('should throw error on delete failure', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      await expect(deleteDocument('1')).rejects.toThrow('Delete failed');
    });

    it('should throw error when document not found', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(
        new Error('Document not found')
      );

      await expect(deleteDocument('999')).rejects.toThrow('Document not found');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle special characters in filename', async () => {
      const documentUrl = 'https://api.test.com/documents/report (final).pdf';
      const downloadResult = { uri: '/mock/documents/report (final).pdf' };

      (FileSystem.downloadAsync as jest.Mock).mockResolvedValueOnce(downloadResult);
      (Sharing.shareAsync as jest.Mock).mockResolvedValueOnce(undefined);

      await downloadDocument(documentUrl);

      expect(FileSystem.downloadAsync).toHaveBeenCalled();
    });

    it('should handle upload without token', async () => {
      (StorageService.getToken as jest.Mock).mockResolvedValueOnce(null);
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ id: 1 }),
      });

      await uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Q88');

      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should handle malformed JSON response', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: 'not valid json',
      });

      const result = await uploadDocument('1', 'vessels', 'file:///doc.pdf', 'Q88');

      // Should return empty object instead of throwing
      expect(result).toEqual({});
    });
  });
});
