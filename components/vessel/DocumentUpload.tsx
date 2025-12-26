import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { FileUp, Download, CheckCircle, BadgeCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { Document as DocType, DocumentTypeCategory } from '@/types';
import { DocumentViewer } from './DocumentViewer';

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
      <View className="mb-3">
        <View className="flex-row items-center justify-between w-full">
          <View className="flex-row items-center flex-shrink-0">
            <ThemedText type="defaultSemiBold" className="text-lg">{title}</ThemedText>
            {doc && <BadgeCheck size={18} color="green" style={{ marginLeft: 8 }} />}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end', minWidth: 0 }}>
            {doc && (
              <ThemedText
                className="text-xs font-medium text-right mr-2"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ textAlign: 'right', maxWidth: 180 }}
              >
                {doc.documentNumber || 'Document.pdf'}
              </ThemedText>
            )}
            {optional && (
              <Text
                className="text-xs font-medium"
                style={{
                  backgroundColor: '#F3F4F6',
                  color: '#6B7280',
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  overflow: 'hidden',
                  marginLeft: doc ? 0 : 12,
                }}
              >
                Optional
              </Text>
            )}
          </View>
        </View>
      </View>

      {doc ? (
        <View className="flex-row items-start">
          <DocumentViewer doc={doc} style={{ minHeight: 120, flexShrink: 0, marginRight: 16 }} />
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-end', minHeight: 120 }}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <ThemedText className="text-xs text-gray-500 mb-2" style={{ marginTop: 2 }}>
                Uploaded {new Date(doc.documentDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </ThemedText>
              <TouchableOpacity
                onPress={() => onReplace(type)}
                className="w-full px-3 py-2 border border-blue-500 rounded-lg items-center justify-center mb-2"
                activeOpacity={0.7}
              >
                <ThemedText className="text-[#fff] font-medium text-xs">Replace</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDownload(doc)}
                className="w-full px-3 py-2 bg-blue-600 rounded-lg items-center justify-center"
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
          className="w-full items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-4 bg-gray-50 dark:bg-gray-900/30"
        >
          <View className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center mb-2">
            <FileUp size={18} color="#6b7280" />
          </View>
          <ThemedText className="text-sm font-medium mb-0.5">Tap to upload</ThemedText>
          <ThemedText className="text-xs text-gray-400">PDF only, max 25MB</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};
