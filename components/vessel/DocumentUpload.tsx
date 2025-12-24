import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { FileUp, Download, CheckCircle } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { Document as DocType, DocumentTypeCategory } from '@/types';

type Props = {
  doc: DocType | undefined;
  type: DocumentTypeCategory;
  title: string;
  optional?: boolean;
  onUpload: (type: DocumentTypeCategory) => void;
  onReplace: (type: DocumentTypeCategory) => void;
  onDownload: (doc: DocType) => void;
};

export const DocumentUpload: React.FC<Props> = ({
  doc,
  type,
  title,
  optional,
  onUpload,
  onReplace,
  onDownload,
}) => {
  return (
    <View className="w-full bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 mb-4 border border-gray-100 dark:border-gray-800">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <ThemedText type="defaultSemiBold" className="text-lg">{title}</ThemedText>
          {doc && <CheckCircle size={18} color="green" style={{ marginLeft: 8 }} />}
        </View>
        {optional && <Text className="text-sm text-gray-400">(Optional)</Text>}
      </View>

      {doc ? (
        <View className="flex-row items-start">
          <View className="w-20 h-28 bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700">
            <View className="items-center">
              <FileUp size={28} color="#3b82f6" />
              <Text className="text-[10px] text-gray-400 mt-1">PDF</Text>
            </View>
          </View>

          <View className="flex-1">
            <ThemedText className="text-sm font-medium mb-1">{doc.documentNumber || 'Document.pdf'}</ThemedText>
            <ThemedText className="text-xs text-gray-500 mb-3">
              Uploaded {new Date(doc.documentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </ThemedText>

            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => onReplace(type)}
                className="flex-1 px-3 py-2 border border-blue-500 rounded-lg items-center justify-center"
                activeOpacity={0.7}
              >
                <ThemedText className="text-blue-600 font-medium text-xs">Replace</ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onDownload(doc)}
                className="flex-1 px-3 py-2 bg-blue-600 rounded-lg items-center justify-center"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-2">
                  <Download size={14} color="#fff" />
                  <ThemedText className="text-white font-medium text-xs">Download</ThemedText>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onUpload(type)}
          activeOpacity={0.6}
          className="w-full items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-8 bg-gray-50 dark:bg-gray-900/30"
        >
          <View className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center mb-3">
            <FileUp size={28} color="#6b7280" />
          </View>
          <ThemedText className="text-base font-medium mb-1">Tap to upload</ThemedText>
          <ThemedText className="text-sm text-gray-400">PDF only, max 25MB</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};
