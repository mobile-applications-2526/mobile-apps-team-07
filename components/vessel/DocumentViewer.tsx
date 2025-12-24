import React, { useState, useEffect } from 'react';
import { View, Dimensions, ActivityIndicator } from 'react-native';
import Pdf from 'react-native-pdf';
import { FileUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { Document } from '@/types/vessel';

interface DocumentViewerProps {
  doc: Document | undefined;
}

const { width } = Dimensions.get('window');

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ doc }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (doc?.fileUrl) {
      setLoading(true);
      setError(false);
    }
  }, [doc?.fileUrl]);

  if (!doc || !doc.fileUrl) {
    return (
      <View className="w-20 h-28 bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700">
        <View className="items-center">
          <FileUp size={28} color="#3b82f6" />
          <ThemedText className="text-[10px] text-gray-400 mt-1">N/A</ThemedText>
        </View>
      </View>
    );
  }

  const isPdf = doc.fileUrl.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    return (
      <View className="w-20 h-28 bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading && (
          <View className="absolute inset-0 items-center justify-center bg-gray-100 dark:bg-gray-800">
            <ActivityIndicator size="small" color="#3b82f6" />
            <ThemedText className="text-xs mt-2">Loading PDF</ThemedText>
          </View>
        )}
        {error && (
          <View className="absolute inset-0 items-center justify-center bg-red-100 dark:bg-red-900">
            <ThemedText className="text-red-500 text-center text-xs p-1">Error loading PDF</ThemedText>
          </View>
        )}
        <Pdf
          source={{ uri: doc.fileUrl }}
          onLoadComplete={(numberOfPages, filePath) => {
            setLoading(false);
            setError(false);
          }}
          onError={(error) => {
            console.error('PDF error:', error);
            setLoading(false);
            setError(true);
          }}
          style={{ width: '100%', height: '100%' }}
          singlePage={true}
          fitPolicy={0} // 0: width, 1: height, 2: both
        />
      </View>
    );
  }

  // Fallback for non-PDF documents or other cases
  return (
    <View className="w-20 h-28 bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700">
      <View className="items-center">
        <FileUp size={28} color="#3b82f6" />
        <ThemedText className="text-[10px] text-gray-400 mt-1">File</ThemedText>
      </View>
    </View>
  );
};
