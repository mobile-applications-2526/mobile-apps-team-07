import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  FileUp,
  Camera,
  Image as ImageIcon,
  FolderOpen,
  X,
  FileText,
  Image,
  Table,
  Check,
  Search,
} from 'lucide-react-native';
import { useUploadDocument } from '@/hooks/queries';
import { documentProcessingService } from '@/services';
import {
  ProcessingDocumentType,
  PROCESSING_DOCUMENT_TYPES,
} from '@/types/documentProcessing';
import { SUPPORTED_FORMATS, MAX_FILE_SIZE, SUPPORTED_EXTENSIONS } from '@/constants/document';

interface SelectedFile {
  uri: string;
  type: string;
  name: string;
  size?: number;
}

export default function DocumentUploadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    vesselId?: string;
    vesselName?: string;
    voyageId?: string;
    charterBaseId?: string;
    preselectedType?: ProcessingDocumentType;
  }>();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [documentType, setDocumentType] = useState<ProcessingDocumentType | undefined>(
    params.preselectedType
  );
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMutation = useUploadDocument();

  const selectFromFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_FORMATS as unknown as string[],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];

      // Validate file size
      if (file.size && file.size > MAX_FILE_SIZE.bytes) {
        Alert.alert('File Too Large', `Maximum file size is ${MAX_FILE_SIZE.string}`);
        return;
      }

      // Validate file extension
      const extension = '.' + (file.name?.split('.').pop()?.toLowerCase() || '');
      if (!SUPPORTED_EXTENSIONS.includes(extension as any)) {
        Alert.alert('Unsupported Format', `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`);
        return;
      }

      setSelectedFile({
        uri: file.uri,
        type: file.mimeType || 'application/octet-stream',
        name: file.name || 'document',
        size: file.size,
      });

      // Auto-detect document type from filename
      const detectedType = documentProcessingService.autoDetectDocumentType(file.name || '');
      if (detectedType && !documentType) {
        setDocumentType(detectedType);
      }
    } catch (err) {
      console.error('Document picker error:', err);
      Alert.alert('Error', 'Failed to select document');
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Camera access is needed to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: `scan_${Date.now()}.jpg`,
        size: asset.fileSize,
      });
    }
  };

  const selectFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Photo library access is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `image_${Date.now()}.jpg`,
        size: asset.fileSize,
      });
    }
  };

  const formatFileSize = useCallback((bytes?: number): string => {
    return documentProcessingService.formatFileSize(bytes);
  }, []);

  const getFileIcon = () => {
    if (!selectedFile) return null;
    const type = selectedFile.type;
    if (type.includes('pdf')) return <FileText size={28} color="#ef4444" />;
    if (type.includes('image')) return <Image size={28} color="#3b82f6" />;
    if (type.includes('sheet') || type.includes('excel')) return <Table size={28} color="#22c55e" />;
    return <FileText size={28} color="#6b7280" />;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a document first');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await uploadMutation.mutateAsync({
        request: {
          file: selectedFile,
          documentType,
          vesselId: params.vesselId ? parseInt(params.vesselId) : undefined,
          voyageId: params.voyageId ? parseInt(params.voyageId) : undefined,
          charterBaseId: params.charterBaseId ? parseInt(params.charterBaseId) : undefined,
          // Wait for processing to complete synchronously
          asyncProcessing: false,
          // Auto-commit extracted data to DB after successful extraction
          autoCommit: true,
        },
        onProgress: setUploadProgress,
      });

      // Navigate to processing status screen
      console.log('Navigating to processing screen with documentId:', response.id);
      router.push({
        pathname: '/document-processing/processing',
        params: {
          documentId: response.id.toString(),
          documentName: selectedFile.name,
        },
      });
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error.message || 'Please check your connection and try again'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 dark:bg-black">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center -ml-2"
        >
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-gray-900 dark:text-white ml-2">
          Upload Document
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Context Banner */}
        {(params.vesselId || params.voyageId) && (
          <View className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl mb-4 border-l-4 border-blue-500">
            {params.vesselId && (
              <Text className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Uploading for: {params.vesselName || `Vessel #${params.vesselId}`}
              </Text>
            )}
            {params.voyageId && (
              <Text className="text-sm text-blue-700 dark:text-blue-300">
                Voyage ID: {params.voyageId}
              </Text>
            )}
          </View>
        )}

        {/* Source Selection */}
        <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
            Select Document Source
          </Text>

          <View className="flex-row justify-between gap-3">
            <TouchableOpacity
              className="flex-1 items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              onPress={selectFromFiles}
              disabled={isUploading}
            >
              <FolderOpen size={32} color="#3b82f6" />
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                Files
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                PDF, Excel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              onPress={takePhoto}
              disabled={isUploading}
            >
              <Camera size={32} color="#22c55e" />
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                Camera
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Scan doc
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
              onPress={selectFromGallery}
              disabled={isUploading}
            >
              <ImageIcon size={32} color="#f59e0b" />
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2">
                Gallery
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Image
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Selected File */}
        {selectedFile && (
          <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Selected Document
            </Text>
            <View className="flex-row items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <View className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg items-center justify-center">
                {getFileIcon()}
              </View>
              <View className="flex-1 ml-3">
                <Text
                  className="text-sm font-semibold text-gray-900 dark:text-white"
                  numberOfLines={2}
                >
                  {selectedFile.name}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedFile.type.split('/').pop()?.toUpperCase()}
                  {selectedFile.size ? ` • ${formatFileSize(selectedFile.size)}` : ''}
                </Text>
              </View>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 items-center justify-center"
                onPress={() => setSelectedFile(null)}
              >
                <X size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Document Type Selection */}
        <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 dark:text-white mb-1">
            Document Type
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Select type or leave as Auto-detect
          </Text>

          {/* Auto-detect option */}
          <TouchableOpacity
            className={`flex-row items-center p-3 border rounded-lg mb-2 ${
              !documentType
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent'
            }`}
            onPress={() => setDocumentType(undefined)}
            disabled={isUploading}
          >
            <Search size={20} color={!documentType ? '#3b82f6' : '#6b7280'} />
            <View className="flex-1 ml-3">
              <Text
                className={`text-sm font-semibold ${
                  !documentType ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'
                }`}
              >
                Auto-detect
              </Text>
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                System will analyze and determine type
              </Text>
            </View>
            {!documentType && <Check size={20} color="#3b82f6" />}
          </TouchableOpacity>

          {/* Document type options */}
          {PROCESSING_DOCUMENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              className={`flex-row items-center p-3 border rounded-lg mb-2 ${
                documentType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-transparent'
              }`}
              onPress={() => setDocumentType(type.value)}
              disabled={isUploading}
            >
              <View className="flex-1">
                <Text
                  className={`text-sm font-semibold ${
                    documentType === type.value
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-200'
                  }`}
                >
                  {type.label}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-gray-400">
                  {type.description}
                </Text>
              </View>
              {documentType === type.value && <Check size={20} color="#3b82f6" />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View className="mb-4">
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </View>
            <Text className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Uploading... {uploadProgress}%
            </Text>
          </View>
        )}

        {/* Upload Button */}
        <TouchableOpacity
          className={`py-4 rounded-xl items-center ${
            !selectedFile || isUploading
              ? 'bg-gray-300 dark:bg-gray-700'
              : 'bg-blue-500'
          }`}
          onPress={handleUpload}
          disabled={!selectedFile || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              <FileUp size={20} color="#fff" />
              <Text className="text-white font-bold text-base ml-2">
                Upload & Process Document
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <Text className="text-xs text-gray-400 text-center mt-4 mb-6">
          Supported formats: PDF, Excel (.xlsx, .xls), Images (PNG, JPEG)
          {'\n'}Max file size: {MAX_FILE_SIZE.string}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
