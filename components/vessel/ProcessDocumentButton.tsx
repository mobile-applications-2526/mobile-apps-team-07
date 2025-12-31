/**
 * Process Document Button Component
 *
 * A button that triggers the document processing flow with OCR and data extraction.
 * Can be used in vessel specs, voyages, or any screen that handles documents.
 */

import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Scan, ChevronRight } from 'lucide-react-native';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';
import { ProcessingDocumentType } from '@/types/documentProcessing';

interface Props {
  vesselId?: number;
  vesselName?: string;
  voyageId?: number;
  charterBaseId?: number;
  preselectedType?: ProcessingDocumentType;
  variant?: 'default' | 'compact' | 'card';
  testID?: string;
}

export const ProcessDocumentButton: React.FC<Props> = ({
  vesselId,
  vesselName,
  voyageId,
  charterBaseId,
  preselectedType,
  variant = 'default',
  testID,
}) => {
  const { openDocumentUpload } = useDocumentProcessing();

  const handlePress = () => {
    openDocumentUpload({
      vesselId,
      vesselName,
      voyageId,
      charterBaseId,
      preselectedType,
    });
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={handlePress}
        className="flex-row items-center px-3 py-2 bg-blue-500 rounded-lg"
        activeOpacity={0.7}
      >
        <Scan size={16} color="#fff" />
        <Text className="text-white font-medium text-sm ml-2">Process Doc</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'card') {
    return (
      <TouchableOpacity
        testID={testID}
        onPress={handlePress}
        className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 flex-row items-center"
        activeOpacity={0.8}
      >
        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center">
          <Scan size={24} color="#fff" />
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-white font-bold text-base">Process Document with OCR</Text>
          <Text className="text-white/80 text-xs mt-0.5">
            Upload and extract data automatically
          </Text>
        </View>
        <ChevronRight size={20} color="#fff" />
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      testID={testID}
      onPress={handlePress}
      className="w-full items-center justify-center border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl py-4 bg-blue-50 dark:bg-blue-900/20"
      activeOpacity={0.6}
    >
      <View className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full items-center justify-center mb-2">
        <Scan size={18} color="#3b82f6" />
      </View>
      <Text className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-0.5">
        Process Document with OCR
      </Text>
      <Text className="text-xs text-blue-400 dark:text-blue-500">
        Upload, scan, and extract data automatically
      </Text>
    </TouchableOpacity>
  );
};
