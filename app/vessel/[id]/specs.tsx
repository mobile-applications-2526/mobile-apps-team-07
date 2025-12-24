import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Text,
  ScrollView,
} from 'react-native';
import { FileUp, Download } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useVesselDetails } from '@/hooks';
import { API_URL } from '@/services';
import { Document as DocType, DocumentTypeCategory } from '@/types';

// Acceptance constants
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

type UploadState = {
  uploading: boolean;
  progress: number; // 0-1
  error: string | null;
};

export default function VesselSpecs() {
  const { vessel, hasQ88, getVesselDocuments, isInitialized } = useVesselDetails();

  const [documents, setDocuments] = useState<DocType[]>([]);
  const [uploadState, setUploadState] = useState<UploadState>({ uploading: false, progress: 0, error: null });
  const [refreshing, setRefreshing] = useState(false);

  // Load documents for this vessel
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

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const isGasCarrier = vessel?.vesselType === 'Gas Carrier';

  // Document helpers
  const findDoc = (type: DocumentTypeCategory) => documents.find(d => d.documentType === type);

  const onDownload = async (doc: DocType) => {
    if (!doc || !doc.fileUrl) return;
    // Open in external browser/downloader
    try {
      await Linking.openURL(doc.fileUrl);
    } catch (err) {
      Alert.alert('Download failed', 'Unable to open document URL');
    }
  };

  // Upload flow: open document picker (dynamic import) and upload using expo-file-system uploadAsync to get progress
  const pickAndUpload = async (type: DocumentTypeCategory) => {
    if (!vessel) return;

    // If existing, confirm replace
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
      // dynamic import so project doesn't hard-depend at module resolution time
      const DocumentPicker: any = await import('expo-document-picker');
      // Use legacy API for expo-file-system which provides uploadAsync
      const FileSystem: any = await import('expo-file-system/legacy');

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

      // Check size using the asset.size if available
      const fileSize = asset.size || 0;
      if (fileSize > MAX_FILE_BYTES) {
        Alert.alert('File size error', 'Maximum file size is 25MB');
        return;
      }

      // Prepare upload
      setUploadState({ uploading: true, progress: 0, error: null });

      const uploadUrl = `${API_URL}/api/vessels/${vessel.id}/documents/upload`;

      // Use expo-file-system/legacy uploadAsync for reliable multipart upload
      try {
        const uploadResult = await FileSystem.uploadAsync(uploadUrl, uri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          parameters: {
            documentType: type as string,
            filename: name,
          },
          headers: {
            Accept: 'application/json',
          },
        });

        if (uploadResult.status >= 200 && uploadResult.status < 300) {
          // Refresh documents immediately
          await loadDocuments();
          setUploadState({ uploading: false, progress: 1, error: null });
          Alert.alert('Upload successful', `${type} has been uploaded successfully.`);
        } else {
          const text = uploadResult.body || '';
          console.error('Upload failed', uploadResult.status, text, { uploadUrl, fileName: name, documentType: type });
          const parsed = (() => {
            try { return JSON.parse(text || '{}'); } catch { return null; }
          })();
          const message = parsed?.message || text || `Server returned ${uploadResult.status}`;
          setUploadState({ uploading: false, progress: 0, error: 'Upload failed' });
          Alert.alert('Upload failed', message);
        }
      } catch (uploadErr: any) {
        console.error('Upload error', uploadErr);
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

  const renderSection = (type: DocumentTypeCategory, title: string, optional?: boolean) => {
    const doc = findDoc(type);

    return (
      <View className="w-full bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 mb-4 border border-gray-100 dark:border-gray-800">
        <View className="flex-row items-center justify-between mb-3">
          <ThemedText type="defaultSemiBold" className="text-xl">{title}</ThemedText>
          {optional && <Text className="text-sm text-gray-400">(Optional)</Text>}
        </View>

        {doc ? (
          <View className="flex-row items-start">
            {/* PDF Thumbnail/Preview */}
            <View className="w-20 h-28 bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700">
              <View className="items-center">
                <FileUp size={32} color="#3b82f6" />
                <Text className="text-[10px] text-gray-400 mt-1">PDF</Text>
              </View>
            </View>

            {/* Document Info */}
            <View className="flex-1">
              <ThemedText className="text-base font-medium mb-1">{doc.documentNumber || 'Document.pdf'}</ThemedText>
              <ThemedText className="text-sm text-gray-500 mb-3">
                Uploaded {new Date(doc.documentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </ThemedText>

              {/* Action Buttons */}
              <View className="flex-row gap-2">
                <TouchableOpacity 
                  onPress={() => onReplace(type)} 
                  className="flex-1 px-4 py-3 border border-blue-500 rounded-lg items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ThemedText className="text-blue-600 font-medium">Replace</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => onDownload(doc)} 
                  className="flex-1 px-4 py-3 bg-blue-600 rounded-lg items-center justify-center"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center gap-2">
                    <Download size={16} color="#fff" />
                    <ThemedText className="text-white font-medium">Download</ThemedText>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => pickAndUpload(type)}
            activeOpacity={0.6}
            className="w-full items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-8 bg-gray-50 dark:bg-gray-900/30"
          >
            <View className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center mb-3">
              <FileUp size={28} color="#6b7280" />
            </View>
            <ThemedText className="text-base font-medium mb-1">Drag & drop or tap to upload</ThemedText>
            <ThemedText className="text-sm text-gray-400">PDF only, max 25MB</ThemedText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      <VesselTopBar vesselName={vessel?.vesselName ?? ''} />

  <ScrollView contentContainerStyle={{ padding: 16 }} className="flex-1">
        {/* Unlock banner for newly created vessels / missing docs */}
        {!hasQ88 && vessel && (
          <View className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 mb-4 border border-yellow-200 dark:border-yellow-800">
            <ThemedText className="text-sm text-yellow-800 dark:text-yellow-200">
              {isGasCarrier ? 'Upload Q88 and Form C to unlock vessel features' : 'Upload Q88 to unlock vessel features'}
            </ThemedText>
          </View>
        )}

        {/* Upload Progress Indicator */}
        {uploadState.uploading && (
          <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-200 dark:border-blue-800">
            <View className="flex-row items-center justify-between mb-2">
              <ThemedText className="font-medium">Uploading...</ThemedText>
              <ThemedText className="text-sm text-gray-600 dark:text-gray-400">{Math.round(uploadState.progress * 100)}%</ThemedText>
            </View>
            <View className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View 
                style={{ width: `${Math.round(uploadState.progress * 100)}%` }} 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
              />
            </View>
          </View>
        )}

        {/* Sections listed sequentially */}
        <View className="flex-1">
          {/* Always show Q88 */}
          {renderSection('Q88', 'Q88')}

          {/* Always show Form C */}
          {renderSection('FormC', 'Form C')}

          {/* Charter Party (optional) */}
          {renderSection('CharterParty', 'Charter Party', true)}
        </View>
  </ScrollView>
    </ThemedView>
  );
}

