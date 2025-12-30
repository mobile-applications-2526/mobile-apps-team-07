import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { API_URL } from '@/services';
import * as db from '@/lib/database';
import { Document, DocumentType, DocumentCategory } from '@/types';
import { documentService } from '@/services';
import { emit } from '@/lib/events';
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '@/constants';

type UploadState = {
  uploading: boolean;
  progress: number; // 0-1
  error: string | null;
};

export const useDocuments = (
  category: DocumentCategory, 
  subjectId: number | undefined,
  getDocuments: ()=>Promise<Document[]>
) => {

  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, progress: 0, error: null });
  const [refreshing, setRefreshing] = useState(false);

  const loadDocuments = useCallback(async () => {
    if(!subjectId) return;

    try {
      setRefreshing(true);
      const docs = await getDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setRefreshing(false);
    }
  }, [subjectId, getDocuments]);

  useEffect(()=>{
    loadDocuments();
  },[subjectId, loadDocuments]);

  const findDoc = (type: DocumentType) => documents.find(d => d.documentType === type);

  const onDownload = async (doc: Document) => {
    if (!doc || !doc.fileUrl) return;
    try {
      const url = doc.fileUrl.startsWith('http') ? doc.fileUrl 
          : `${API_URL}${doc.fileUrl}`;
      console.log('Opening document URL:', url);
      await documentService.downloadDocument(url);
    } catch (err) {
      console.error('Failed to open document URL', err, { doc });
      Alert.alert('Download failed', 'Unable to open document URL');
    }
  };

  const pickAndValidateFile = async ()=>{
    const DocumentPicker: any = await import('expo-document-picker');
    const res = await DocumentPicker.getDocumentAsync({ 
      type: SUPPORTED_FORMATS,
      copyToCacheDirectory: true 
    });

    if (res.canceled || !res.assets || res.assets.length === 0) 
      return null;

    const asset = res.assets[0];
    const name = asset.name || 'document.pdf';
    const uri = asset.uri;
    const lower = name.toLowerCase();

    if (!SUPPORTED_EXTENSIONS.some(ext => lower.endsWith(ext))) {
      Alert.alert('File format error', 'Only PDF, PNG, and JPEG files are supported');
      return null;
    }      

    const fileSize = asset.size || 0;
    if (fileSize > MAX_FILE_SIZE.bytes) {
      Alert.alert('File size error', `Maximum file size is ${MAX_FILE_SIZE.string}`);
      return null;
    }
    
    return uri;
  }

  const uploadDocument = async (type: DocumentType) => {

    if(!subjectId) return;

    const existing = findDoc(type);
    if (existing && category == 'vessels') {
      const ok = await replaceAlert(type);

      if (ok) replaceDocument(type, existing.id); 
      else return;
    }

    const uri = await pickAndValidateFile();

    if(!uri) return; 

    try {

      setUploadState({ uploading: true, progress: 0, error: null });

      try {
        const uploadResp = await documentService.uploadDocument(
          String(subjectId), 
          category, 
          uri, 
          type, 
          (progress) => {
            setUploadState((prevState) => ({ ...prevState, progress }));
          }
        );

        console.log('Upload response:', uploadResp);

        // Invalidate documents cache so loadDocuments fetches fresh data
        try {
          switch(category){
            case 'vessels': 
              await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(subjectId));
            case 'voyages':
              await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(subjectId));
            case 'cargoes':
              await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_CARGO(subjectId));
          }
        } catch (cacheErr) {
          console.warn('Failed to delete documents cache:', cacheErr);
        }

        await loadDocuments();

        // Notify other parts of the app (e.g. VesselDetailsProvider)
        // Updated to emit only to subs of the category
        try { emit(`${category}:documents:updated`, { subjectId }); } catch (e) { /* no-op */ }

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
        { text: 'Retry', onPress: () => uploadDocument(type) },
          { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const replaceDocument = async (type: DocumentType, documentId: number) => {
    //TODO
  };

  const replaceAlert = (type: DocumentType) => {
    return new Promise<boolean>((resolve) => {
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
  }

  return {
    documents,
    uploadState,
    refreshing,
    loadDocuments,
    findDoc,
    onDownload,
    uploadDocument,
    replaceDocument
  };
};
