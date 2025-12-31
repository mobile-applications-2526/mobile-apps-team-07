import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { API_URL } from '@/services';
import * as db from '@/lib/database';
import { Document, DocumentType, DocumentCategory } from '@/types';
import { documentService, documentProcessingService } from '@/services';
import { emit } from '@/lib/events';
import { MAX_FILE_SIZE, SUPPORTED_EXTENSIONS, SUPPORTED_FORMATS } from '@/constants';
import { ProcessingDocumentType } from '@/types/documentProcessing';

// Document types that support OCR processing
const PROCESSING_SUPPORTED_TYPES: Record<string, ProcessingDocumentType> = {
  'Q88': 'Q88',
  'FormC': 'FormC',
  'CharterParty': 'CharterParty',
  'NoonReport': 'NoonReport',
  'NoticeOfReadiness': 'NOR',
  'PortClearance': 'PortClearance',
  'BillOfLading': 'BL',
  'CargoManifest': 'CargoManifest',
  'StatementOfFacts': 'SOF',
};

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
  const router = useRouter();
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

    // Check if this document type supports OCR processing
    const processingType = PROCESSING_SUPPORTED_TYPES[type];

    try {
      setUploadState({ uploading: true, progress: 0, error: null });

      if (processingType && category === 'vessels') {
        // Use document processing service for OCR-supported types
        console.log(`Using document processing for ${type} -> ${processingType}`);

        const uploadResp = await documentProcessingService.uploadDocument(
          {
            file: { uri, type: 'application/pdf', name: `${type}.pdf` },
            documentType: processingType,
            vesselId: subjectId,
            asyncProcessing: false,
            autoCommit: true,
          },
          (progress) => setUploadState((prev) => ({ ...prev, progress: progress / 100 }))
        );

        console.log('Processing upload completed:', uploadResp);
        setUploadState({ uploading: false, progress: 1, error: null });

        // Get document ID from response (backend returns documentId, not id)
        const docId = uploadResp.documentId || uploadResp.id;

        // Navigate to processing screen to monitor OCR and extraction
        router.push({
          pathname: '/document-processing/processing',
          params: {
            documentId: docId.toString(),
            documentName: `${type}.pdf`,
          },
        });
      } else {
        // Use legacy upload for non-processing types
        const uploadResp = await documentService.uploadDocument(
          String(subjectId),
          category,
          uri,
          type,
          (progress) => setUploadState((prev) => ({ ...prev, progress }))
        );

        console.log('Upload response:', uploadResp);

        // Invalidate documents cache
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
        try { emit(`${category}:documents:updated`, { subjectId }); } catch (e) { /* no-op */ }

        setUploadState({ uploading: false, progress: 1, error: null });
        Alert.alert('Upload successful', `${type} has been uploaded successfully.`);
      }
    } catch (uploadErr: any) {
      console.error('Upload error', uploadErr);
      setUploadState({ uploading: false, progress: 0, error: uploadErr?.message ?? 'Upload failed' });
      Alert.alert('Upload failed', uploadErr?.message ?? 'Network error during upload. Please try again.', [
        { text: 'Retry', onPress: () => uploadDocument(type) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const replaceDocument = async (type: DocumentType, documentId: number) => {

    const uri = await pickAndValidateFile();

    if(!uri) return; 

    try {

      setUploadState({ uploading: true, progress: 0, error: null });

      try {
        const uploadResp = await documentService.replaceDocument(
          String(documentId),
          String(subjectId), 
          category, 
          uri, 
          type, 
        );

        console.log('Upload response:', uploadResp);

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
        { text: 'Retry', onPress: () => replaceDocument(type, documentId) },
          { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const deleteDocument = async (documentId: number) => {
    try {
      setUploadState({uploading: true, progress: 0, error: null});
      
      const shouldDelete = await deleteAlert();
      if (!shouldDelete) {
        setUploadState({uploading: false, progress: 0, error: null});
        return;
      }
      
      await documentService.deleteDocument(String(documentId));
      await loadDocuments(); // Wait for documents to reload
      
      setUploadState({uploading: false, progress: 1, error: null});
      Alert.alert('Delete successful', `Document has been deleted.`); // Show after reload
      
      // Notify other parts of the app
      try { emit(`${category}:documents:updated`, { subjectId }); } catch (e) { /* no-op */ }
      
    } catch (err: any) {
      console.error('Delete error', err);
      setUploadState({ uploading: false, progress: 0, error: err?.message ?? 'Delete failed' });
      Alert.alert('Delete failed', `MESSAGE: ${err?.message} | CAUSE: ${err?.cause} | STACK: ${err?.stack}`, [
        { text: 'Retry', onPress: () => deleteDocument(documentId) },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
    // Remove the duplicate loadDocuments() call here
  }

  const deleteAlert = () => {
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        `Deleting Document?`,
        `This will delete the existing document. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', onPress: () => resolve(true) },
        ],
          { cancelable: true }
      );
    });
  }

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
    replaceDocument,
    deleteDocument
  };
};
