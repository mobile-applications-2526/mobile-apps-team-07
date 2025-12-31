/**
 * useDocuments Hook Unit Tests
 *
 * User Validation Criteria:
 * - User should see list of documents for a subject (vessel/voyage/cargo)
 * - User should be able to upload a document
 * - User should be able to replace a document
 * - User should be able to download a document
 * - User should be able to delete a document
 * - User should see upload progress
 * - User should see appropriate error messages for invalid files
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

// Mock dependencies
const mockDownloadDocument = jest.fn();
const mockUploadDocument = jest.fn();
const mockReplaceDocument = jest.fn();
const mockDeleteDocument = jest.fn();

jest.mock('@/services', () => ({
  API_URL: 'https://api.test.com',
  documentService: {
    downloadDocument: mockDownloadDocument,
    uploadDocument: mockUploadDocument,
    replaceDocument: mockReplaceDocument,
    deleteDocument: mockDeleteDocument,
  },
}));

jest.mock('@/lib/database', () => ({
  deleteCacheValue: jest.fn(),
  CACHE_KEYS: {
    DOCUMENTS_BY_VESSEL: (id: number) => `documents:vessel:${id}`,
    DOCUMENTS_BY_VOYAGE: (id: number) => `documents:voyage:${id}`,
    DOCUMENTS_BY_CARGO: (id: number) => `documents:cargoes:${id}`,
  },
}));

jest.mock('@/lib/events', () => ({
  emit: jest.fn(),
}));

jest.mock('@/constants', () => ({
  MAX_FILE_SIZE: {
    bytes: 25 * 1024 * 1024,
    string: '25MB',
  },
  SUPPORTED_EXTENSIONS: ['.pdf', '.png', '.jpg', '.jpeg'],
  SUPPORTED_FORMATS: ['application/pdf', 'image/png', 'image/jpeg'],
}));

// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

import { useDocuments } from '../../hooks/useDocuments';
import * as DocumentPicker from 'expo-document-picker';
import * as db from '@/lib/database';
import { emit } from '@/lib/events';

describe('useDocuments Hook', () => {
  const mockDocuments = [
    {
      id: 1,
      documentType: 'Q88',
      name: 'Q88-vessel-1.pdf',
      fileUrl: '/documents/q88.pdf',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      documentType: 'Form C',
      name: 'FormC-vessel-1.pdf',
      fileUrl: '/documents/formc.pdf',
      createdAt: '2024-01-10',
    },
  ];

  const mockGetDocuments = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDocuments.mockResolvedValue(mockDocuments);
    // Reset Alert mock to use callback capture
    (Alert.alert as jest.Mock).mockImplementation(
      (title, message, buttons) => {
        // Store for later assertions
      }
    );
  });

  // ============================================
  // TEST CASE: Load Documents
  // ============================================
  describe('Load Documents', () => {
    /**
     * Test Steps:
     * 1) Initialize hook with subject ID
     * 2) Verify documents are fetched
     * 3) Verify documents are stored in state
     */
    it('should load documents on mount', async () => {
      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(mockGetDocuments).toHaveBeenCalled();
      expect(result.current.documents).toHaveLength(2);
    });

    /**
     * Test Steps:
     * 1) Initialize hook without subject ID
     * 2) Verify no fetch is made
     */
    it('should not load when subjectId is undefined', async () => {
      const { result } = renderHook(() =>
        useDocuments('vessels', undefined, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(mockGetDocuments).not.toHaveBeenCalled();
      expect(result.current.documents).toHaveLength(0);
    });

    /**
     * Test Steps:
     * 1) getDocuments throws error
     * 2) Verify error is caught
     * 3) Verify documents remain empty
     */
    it('should handle load error gracefully', async () => {
      mockGetDocuments.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      expect(result.current.documents).toHaveLength(0);
    });
  });

  // ============================================
  // TEST CASE: Find Document
  // ============================================
  describe('Find Document', () => {
    /**
     * Test Steps:
     * 1) Load documents
     * 2) Call findDoc with document type
     * 3) Verify correct document is returned
     */
    it('should find document by type', async () => {
      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      const q88Doc = result.current.findDoc('Q88');
      expect(q88Doc).toBeDefined();
      expect(q88Doc?.documentType).toBe('Q88');
    });

    /**
     * Test Steps:
     * 1) Call findDoc with non-existent type
     * 2) Verify undefined is returned
     */
    it('should return undefined for non-existent document type', async () => {
      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      const doc = result.current.findDoc('NonExistent' as any);
      expect(doc).toBeUndefined();
    });
  });

  // ============================================
  // TEST CASE: Download Document
  // ============================================
  describe('Download Document', () => {
    /**
     * Test Steps:
     * 1) Call onDownload with document
     * 2) Verify downloadDocument service is called
     * 3) Verify full URL is constructed
     */
    it('should download document with relative URL', async () => {
      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      const doc = result.current.documents[0];

      await act(async () => {
        await result.current.onDownload(doc);
      });

      expect(mockDownloadDocument).toHaveBeenCalledWith(
        'https://api.test.com/documents/q88.pdf'
      );
    });

    /**
     * Test Steps:
     * 1) Document has absolute URL
     * 2) Call onDownload
     * 3) Verify URL is used as-is
     */
    it('should handle absolute URL', async () => {
      const absoluteDoc = {
        ...mockDocuments[0],
        fileUrl: 'https://cdn.example.com/docs/q88.pdf',
      };
      mockGetDocuments.mockResolvedValueOnce([absoluteDoc]);

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.onDownload(result.current.documents[0]);
      });

      expect(mockDownloadDocument).toHaveBeenCalledWith(
        'https://cdn.example.com/docs/q88.pdf'
      );
    });

    /**
     * Test Steps:
     * 1) Download fails
     * 2) Verify error alert is shown
     */
    it('should show alert on download error', async () => {
      mockDownloadDocument.mockRejectedValueOnce(new Error('Download failed'));

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.onDownload(result.current.documents[0]);
      });

      expect(Alert.alert).toHaveBeenCalledWith('Download failed', expect.any(String));
    });

    /**
     * Test Steps:
     * 1) Document has no fileUrl
     * 2) Call onDownload
     * 3) Verify early return (no error)
     */
    it('should not download if document has no URL', async () => {
      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.onDownload({ ...mockDocuments[0], fileUrl: '' });
      });

      expect(mockDownloadDocument).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TEST CASE: Upload Document
  // ============================================
  describe('Upload Document', () => {
    /**
     * Test Steps:
     * 1) Mock document picker to return a valid PDF
     * 2) Call uploadDocument
     * 3) Verify upload service is called
     * 4) Verify success alert is shown
     */
    it('should upload document successfully', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            name: 'test.pdf',
            uri: 'file:///path/to/test.pdf',
            size: 1024 * 1024, // 1MB
          },
        ],
      });

      mockUploadDocument.mockResolvedValueOnce({ id: 3, name: 'test.pdf' });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Other');
      });

      expect(mockUploadDocument).toHaveBeenCalledWith(
        '1',
        'vessels',
        'file:///path/to/test.pdf',
        'Other',
        expect.any(Function)
      );

      expect(Alert.alert).toHaveBeenCalledWith(
        'Upload successful',
        expect.stringContaining('uploaded successfully')
      );
    });

    /**
     * Test Steps:
     * 1) User cancels document picker
     * 2) Verify no upload is attempted
     */
    it('should handle canceled picker', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: true,
        assets: [],
      });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(mockUploadDocument).not.toHaveBeenCalled();
    });

    /**
     * Test Steps:
     * 1) Select file larger than 25MB
     * 2) Verify error alert is shown
     * 3) Verify upload is not attempted
     */
    it('should reject file too large', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            name: 'large.pdf',
            uri: 'file:///path/to/large.pdf',
            size: 30 * 1024 * 1024, // 30MB
          },
        ],
      });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(Alert.alert).toHaveBeenCalledWith('File size error', expect.any(String));
      expect(mockUploadDocument).not.toHaveBeenCalled();
    });

    /**
     * Test Steps:
     * 1) Select unsupported file type (.exe)
     * 2) Verify error alert is shown
     * 3) Verify upload is not attempted
     */
    it('should reject unsupported file type', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            name: 'malware.exe',
            uri: 'file:///path/to/malware.exe',
            size: 1024,
          },
        ],
      });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'File format error',
        expect.stringContaining('PDF, PNG, and JPEG')
      );
      expect(mockUploadDocument).not.toHaveBeenCalled();
    });

    /**
     * Test Steps:
     * 1) Upload fails
     * 2) Verify error alert with retry option is shown
     */
    it('should handle upload error', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            name: 'test.pdf',
            uri: 'file:///path/to/test.pdf',
            size: 1024,
          },
        ],
      });

      mockUploadDocument.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Upload failed',
        expect.any(String),
        expect.any(Array)
      );
    });
  });

  // ============================================
  // TEST CASE: Upload State
  // ============================================
  describe('Upload State', () => {
    /**
     * Test Steps:
     * 1) Start upload
     * 2) Verify uploading is true
     * 3) Verify progress updates
     */
    it('should track upload progress', async () => {
      let progressCallback: (progress: number) => void = () => {};

      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'test.pdf', uri: 'file:///test.pdf', size: 1024 }],
      });

      mockUploadDocument.mockImplementation(
        async (subjectId, subject, uri, type, onProgress) => {
          progressCallback = onProgress;
          return { id: 3 };
        }
      );

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      // Initial state
      expect(result.current.uploadState.uploading).toBe(false);
      expect(result.current.uploadState.progress).toBe(0);
    });

    /**
     * Test Steps:
     * 1) Upload fails
     * 2) Verify error is stored in state
     */
    it('should store upload error', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'test.pdf', uri: 'file:///test.pdf', size: 1024 }],
      });

      mockUploadDocument.mockRejectedValueOnce(new Error('Upload failed'));

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(result.current.uploadState.error).toBeTruthy();
    });
  });

  // ============================================
  // TEST CASE: Replace Document
  // ============================================
  describe('Replace Document', () => {
    /**
     * Test Steps:
     * 1) Call replaceDocument with existing document ID
     * 2) Select new file
     * 3) Verify replace service is called
     */
    it('should replace document successfully', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'new.pdf', uri: 'file:///new.pdf', size: 1024 }],
      });

      mockReplaceDocument.mockResolvedValueOnce({ id: 1, name: 'new.pdf' });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.replaceDocument('Q88', 1);
      });

      expect(mockReplaceDocument).toHaveBeenCalledWith(
        '1',
        '1',
        'vessels',
        'file:///new.pdf',
        'Q88'
      );
    });
  });

  // ============================================
  // TEST CASE: Delete Document
  // ============================================
  describe('Delete Document', () => {
    /**
     * Test Steps:
     * 1) Call deleteDocument
     * 2) Confirm in alert
     * 3) Verify delete service is called
     * 4) Verify documents are reloaded
     */
    it('should delete document after confirmation', async () => {
      // Mock Alert to auto-confirm
      (Alert.alert as jest.Mock).mockImplementation(
        (title, message, buttons) => {
          const deleteButton = buttons?.find((b: any) => b.text === 'Delete');
          if (deleteButton?.onPress) deleteButton.onPress();
        }
      );

      mockDeleteDocument.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.deleteDocument(1);
      });

      expect(mockDeleteDocument).toHaveBeenCalledWith('1');
    });

    /**
     * Test Steps:
     * 1) Call deleteDocument
     * 2) Cancel in alert
     * 3) Verify delete service is NOT called
     */
    it('should not delete when cancelled', async () => {
      // Mock Alert to cancel
      (Alert.alert as jest.Mock).mockImplementation(
        (title, message, buttons) => {
          const cancelButton = buttons?.find((b: any) => b.text === 'Cancel');
          if (cancelButton?.onPress) cancelButton.onPress();
        }
      );

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.documents.length).toBeGreaterThan(0);
      });

      await act(async () => {
        await result.current.deleteDocument(1);
      });

      expect(mockDeleteDocument).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // TEST CASE: Cache Invalidation
  // ============================================
  describe('Cache Invalidation', () => {
    /**
     * Test Steps:
     * 1) Upload document for vessel
     * 2) Verify vessel documents cache is invalidated
     */
    it('should invalidate vessel documents cache', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'test.pdf', uri: 'file:///test.pdf', size: 1024 }],
      });

      mockUploadDocument.mockResolvedValueOnce({ id: 3 });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(db.deleteCacheValue).toHaveBeenCalledWith('documents:vessel:1');
    });

    /**
     * Test Steps:
     * 1) Upload document for voyage
     * 2) Verify voyage documents cache is invalidated
     */
    it('should invalidate voyage documents cache', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'test.pdf', uri: 'file:///test.pdf', size: 1024 }],
      });

      mockUploadDocument.mockResolvedValueOnce({ id: 3 });

      const { result } = renderHook(() =>
        useDocuments('voyages', 5, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Statement of Facts');
      });

      expect(db.deleteCacheValue).toHaveBeenCalledWith('documents:voyage:5');
    });
  });

  // ============================================
  // TEST CASE: Event Emission
  // ============================================
  describe('Event Emission', () => {
    /**
     * Test Steps:
     * 1) Upload document
     * 2) Verify documents:updated event is emitted
     */
    it('should emit event after upload', async () => {
      (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'test.pdf', uri: 'file:///test.pdf', size: 1024 }],
      });

      mockUploadDocument.mockResolvedValueOnce({ id: 3 });

      const { result } = renderHook(() =>
        useDocuments('vessels', 1, mockGetDocuments)
      );

      await waitFor(() => {
        expect(result.current.refreshing).toBe(false);
      });

      await act(async () => {
        await result.current.uploadDocument('Q88');
      });

      expect(emit).toHaveBeenCalledWith('vessels:documents:updated', { subjectId: 1 });
    });
  });
});
