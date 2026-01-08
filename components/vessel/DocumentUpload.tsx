import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FileUp, Download, BadgeCheck } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { Document as DocType, DocumentType } from '@/types';
import { DocumentViewer } from './DocumentViewer';

type Props = {
  doc: DocType | undefined;
  type: DocumentType;
  title: string;
  optional?: boolean;
  onUpload: (type: DocumentType) => void;
  onReplace: (type: DocumentType, documentId: number) => void;
  onDownload: (doc: DocType) => void;
  onDelete: (id: number) => void;
  hasBorder?: boolean;
  testID?: string;
};

export const DocumentUpload: React.FC<Props> = ({
  doc,
  type,
  title,
  onUpload,
  onReplace,
  onDownload,
  onDelete,
  hasBorder,
  testID,
}) => {
  return (
    <View testID={testID} className={`w-full mb-4 ${hasBorder ? 'border-t border-gray-100 dark:border-gray-800 pt-4 mt-2' : ''}`}>
      <View className="mb-2">
        <View className="flex-row items-center justify-between w-full">
          <View className="flex-row items-center flex-shrink-0">
            <ThemedText type="defaultSemiBold" className="text-sm">{title}</ThemedText>
            {doc && <BadgeCheck size={18} color="green" style={{ marginLeft: 8 }} />}
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
                testID={testID ? `${testID}-replace` : undefined}
                onPress={() => onReplace(type, doc.id)}
                className="w-full px-3 py-2 border border-blue-500 dark:border-blue-400 rounded-lg items-center justify-center mb-2"
                activeOpacity={0.7}
              >
                <ThemedText className="text-blue-500 dark:text-blue-400 font-medium text-xs">Replace</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                testID={testID ? `${testID}-download` : undefined}
                onPress={() => onDownload(doc)}
                className="w-full px-3 py-2 bg-blue-600 rounded-lg items-center justify-center mb-2"
                activeOpacity={0.7}
              >
                <View className="flex-row items-center gap-2">
                  <Download size={14} color="#fff" />
                  <ThemedText className="text-white font-medium text-xs">Download</ThemedText>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                testID={testID ? `${testID}-delete` : undefined}
                onPress={() => onDelete(doc.id)}
                className="w-full px-3 py-2 border border-red-500 dark:border-red-400 rounded-lg items-center justify-center"
                activeOpacity={0.7}
              >
                <ThemedText className="text-red-500 dark:text-red-400 font-medium text-xs">Delete</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          testID={testID ? `${testID}-upload` : undefined}
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
