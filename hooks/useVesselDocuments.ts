import { useState, useCallback, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Linking } from 'react-native';
import { API_URL } from '@/services';
import * as db from '@/lib/database';
import { Document as DocType, DocumentTypeCategory } from '@/types';
import { useVesselDetails } from '@/context/VesselDetailsContext';
import { documentService } from '@/services';
import { emit } from '@/lib/events';

// Acceptance constants
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

type UploadState = {
  uploading: boolean;
  progress: number; // 0-1
  error: string | null;
};

export const useVesselDocuments = () => {
  const {
    vessel,
    getDocuments,
    uploadProgress,
    isUploading,
    setUploadState
  } = useVesselDetails();

  const [documents, setDocuments] = useState<DocType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Combine shared state with local error
  const uploadState: UploadState = {
    uploading: isUploading,
    progress: uploadProgress,
    error: error
  };

  const loadDocuments = useCallback(async () => {
    if (!vessel) return;
    try {
      setRefreshing(true);
      const docs = await getDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setRefreshing(false);
    }
  }, [vessel, getDocuments]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const findDoc = (type: DocumentTypeCategory) => documents.find(d => d.documentType === type);

  const onDownload = async (doc: DocType) => {
    if (!doc || !doc.fileUrl) return;
    try {
      const url = doc.fileUrl.startsWith('http') ? doc.fileUrl : `${API_URL}${doc.fileUrl}`;
      console.log('Opening document URL:', url);
      await Linking.openURL(url);
    } catch (err) {
      console.error('Failed to open document URL', err, { doc });
      Alert.alert('Download failed', 'Unable to open document URL');
    }
  };

  const pickAndUpload = async (type: DocumentTypeCategory) => {
    if (!vessel) return;

    const existing = findDoc(type);
    if (existing) {
      const ok = await new Promise<boolean>((resolve) => {
        Alert.alert(
          `Replace existing ${type}?`,
          `Uploading a new ${type} will replace the existing document. Are you sure?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Replace', onPress: () => resolve(true) },
          ],
          { cancelable: true }
        );
      });

      if (!ok) return;
    }

    try {
      const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      const name = asset.name || 'document.pdf';
      const uri = asset.uri;
      const lower = name.toLowerCase();

      if (!lower.endsWith('.pdf')) {
        Alert.alert('File format error', 'Only PDF files are supported');
        return;
      }

      const fileSize = asset.size || 0;
      if (fileSize > MAX_FILE_BYTES) {
        Alert.alert('File size error', 'Maximum file size is 25MB');
        return;
      }

      // Start upload - update shared state
      setError(null);
      setUploadState(true, 0);

      try {
        const uploadResp = await documentService.uploadDocument(String(vessel.id), 'vessels', uri, type, (progress) => {
          setUploadState(true, progress);
        });
        console.log('Upload response:', uploadResp);

        // Optimistic: add document to local state immediately
        const newDoc: DocType = {
          id: uploadResp?.id ?? Date.now(),
          documentType: type,
          fileUrl: uploadResp?.fileUrl ?? uri,
          documentName: name,
          documentDate: new Date(),
          remarks: '',
        };
        setDocuments(prev => {
          // Replace existing doc of same type, or add new one
          const exists = prev.some(d => d.documentType === type);
          if (exists) {
            return prev.map(d => d.documentType === type ? newDoc : d);
          }
          return [...prev, newDoc];
        });

        // Invalidate documents cache for background sync
        try {
          if (vessel && typeof vessel.id === 'number') {
            await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(vessel.id));
          }
        } catch (cacheErr) {
          console.warn('Failed to delete documents cache:', cacheErr);
        }

        // Notify other parts of the app (e.g. VesselDetailsProvider)
        try { emit('documents:updated', { vesselId: vessel.id }); } catch (e) { /* no-op */ }

        // Finish upload
        setUploadState(false, 1);
        Alert.alert('Upload successful', `${type} has been uploaded successfully.`);
      } catch (uploadErr: any) {
        setError(uploadErr?.message ?? 'Upload failed');
        setUploadState(false, 0);
        Alert.alert('Upload failed', uploadErr?.message ?? 'Network error during upload. Please try again.');
      }
    } catch (err: any) {
      console.error('Upload error', err);
      setError(err?.message ?? 'Upload failed');
      setUploadState(false, 0);
      Alert.alert('Upload failed', err?.message ?? 'Upload failed', [
        { text: 'Retry', onPress: () => pickAndUpload(type) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const onReplace = (type: DocumentTypeCategory) => {
    pickAndUpload(type);
  };

  return {
    documents,
    uploadState,
    refreshing,
    loadDocuments,
    findDoc,
    onDownload,
    pickAndUpload,
    onReplace,
  };
};
