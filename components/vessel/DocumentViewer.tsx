import React, { useState, useEffect } from 'react';
import { View, Dimensions, ActivityIndicator } from 'react-native';
import { FileUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { Document } from '@/types';
import { IS_EXPO_GO } from '@/constants/env';

// Conditionally import Pdf only if not in Expo Go
import type { ComponentType } from 'react';
let Pdf: ComponentType<any> | null = null;
if (!IS_EXPO_GO) {
  try {
    Pdf = require('react-native-pdf').default as ComponentType<any>;
  } catch (e) {
    console.warn('react-native-pdf could not be loaded outside of Expo Go:', e);
    Pdf = null; // Ensure Pdf is null if import fails
  }
}

interface DocumentViewerProps {
  doc: Document | undefined;
}

const { width } = Dimensions.get('window');

// Accepts optional style prop for custom sizing
export const DocumentViewer: React.FC<DocumentViewerProps & { style?: any }> = ({ doc, style }) => {
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
      <View className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700" style={[{ width: 80, height: 120 }, style]}>
        <View className="items-center">
          <FileUp size={28} color="#3b82f6" />
          <ThemedText className="text-[10px] text-gray-400 mt-1">N/A</ThemedText>
        </View>
      </View>
    );
  }

  const isPdf = doc.fileUrl.toLowerCase().endsWith('.pdf');

  if (isPdf) {
    if (IS_EXPO_GO || !Pdf) {
      // Render fallback for Expo Go or if Pdf failed to load
      return (
        <View className="bg-gray-50 dark:bg-gray-900 rounded-lg mr-4 border border-gray-200 dark:border-gray-700 p-2" style={[{ width: 80, height: 120, justifyContent: 'center', alignItems: 'center' }, style]}>
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }} className="w-full h-full">
            <FileUp size={28} color="#3b82f6" />
            <View style={{ height: 16 }} />
            <ThemedText className="text-[10px] text-gray-400 text-center">No Preview in Expo Go</ThemedText>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700 overflow-hidden" style={[{ width: 80, height: 120 }, style]}>
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
          onLoadComplete={(numberOfPages: number, filePath: string) => {
            setLoading(false);
            setError(false);
          }}
          onError={(error: any) => {
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
    <View className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700" style={[{ width: 80, height: 120 }, style]}>
      <View className="items-center">
        <FileUp size={28} color="#3b82f6" />
        <ThemedText className="text-[10px] text-gray-400 mt-1">File</ThemedText>
      </View>
    </View>
  );
};

