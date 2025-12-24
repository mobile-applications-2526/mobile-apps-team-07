import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { API_URL } from '@/services/config';
import * as db from '@/lib/database';
import { Document as DocType, DocumentTypeCategory } from '@/types';
import { useVesselDetails } from '@/context/VesselDetailsContext';
import { documentService } from '@/services';

// Acceptance constants
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

type UploadState = {
  uploading: boolean;
  progress: number; // 0-1
  error: string | null;
};

export const useVesselDocuments = () => {
  const { vessel, getVesselDocuments } = useVesselDetails();
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, progress: 0, error: null });
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!vessel) return;
    try {
      setRefreshing(true);
      const docs = await getVesselDocuments(vessel.id);
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setRefreshing(false);
    }
  }, [vessel, getVesselDocuments]);

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
      const DocumentPicker: any = await import('expo-document-picker');
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

      setUploadState({ uploading: true, progress: 0, error: null });

      try {
        const uploadResp = await documentService.uploadDocument(String(vessel.id), uri, type, name, (progress) => {
          setUploadState((prevState) => ({ ...prevState, progress }));
        });
        console.log('Upload response:', uploadResp);

        // Invalidate documents cache so loadDocuments fetches fresh data
        try {
          if (vessel && typeof vessel.id === 'number') {
            await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(vessel.id));
          }
        } catch (cacheErr) {
          console.warn('Failed to delete documents cache:', cacheErr);
        }

        await loadDocuments();
        setUploadState({ uploading: false, progress: 1, error: null });
        Alert.alert('Upload successful', `${type} has been uploaded successfully.`);
      } catch (uploadErr: any) {
        setUploadState({ uploading: false, progress: 0, error: uploadErr?.message ?? 'Upload failed' });
        Alert.alert('Upload failed', uploadErr?.message ?? 'Network error during upload. Please try again.');
      }
    } catch (err: any) {
      console.error('Upload error', err);
      setUploadState({ uploading: false, progress: 0, error: err?.message ?? 'Upload failed' });
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
