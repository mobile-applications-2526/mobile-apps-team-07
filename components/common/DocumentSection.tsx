import React, { useState } from 'react';
import { Picker } from '@react-native-picker/picker'
import { View, TouchableOpacity, ScrollView, Platform, ActionSheetIOS, Alert, Modal } from 'react-native';
import { FileText, Plus, FileUp } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { DocumentUpload } from '@/components/vessel';
import { Document, DocumentCategory, DocumentType } from '@/types';
import { CARGO_DOC_TYPES, VESSEL_DOC_TYPES, VOYAGE_DOC_TYPES } from '@/constants';

interface DocumentsSectionProps {
  documents: Document[];
  category: DocumentCategory;
  title?: string;
  onUpload: (type: DocumentType) => Promise<void>;
  onReplace: (type: DocumentType, documentId: number) => Promise<void>;
  onDownload: (doc: Document) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  testID?: string;
}

export function DocumentsSection({
  documents,
  category,
  title,
  onUpload,
  onReplace,
  onDownload,
  onDelete,
  testID
}: DocumentsSectionProps) {

  const IOS = Platform.OS == 'ios';
  const [selectedType, setSelectedType] = useState<DocumentType | null>(
    (category == 'vessels' ? 'CharterParty'
      : category == 'voyages' ? 'NoonReport'
        : category == 'cargoes' ? 'CargoManifest' : null)
  );
  const [pickerVisible, setPickerVisible] = useState<boolean>(false);

  // Filter documents by selected type
  const filteredDocs = documents.filter(doc => doc.documentType === selectedType);

  const docTypes = (
    category == 'vessels' ?
      VESSEL_DOC_TYPES.filter(v => !['FormC', 'Q88'].includes(v.value))
      : category == 'voyages' ?
        VOYAGE_DOC_TYPES
        : category == 'cargoes' ?
          CARGO_DOC_TYPES : []);

  // Get label for selected type
  const selectedLabel = docTypes?.find(t => t.value === selectedType)?.label || selectedType;

  // Handle IOS native action sheet for document type selection
  const handleDocumentTypePress = () => {
    if (!docTypes) return;
    
    if (IOS) {
      const options = [...docTypes.map(dt => dt.label), 'Cancel'];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          title: 'Select Document Type',
        },
        (buttonIndex) => {
          if (buttonIndex < docTypes.length) {
            setSelectedType(docTypes[buttonIndex].value);
          }
        }
      );
    }   
  };

  return (
    <View testID={testID}>
      {/* Header with Document Type Selector */}
      <View className="mb-4">
        {title && (
          <View className="flex-row items-center justify-between mb-3">
            {/* Title is usually handled by DataSection if used, but we keep it optional here */}
          </View>
        )}

        {/* Document Type Button */}
        {IOS?(
          <TouchableOpacity
            testID={testID ? `${testID}-type-selector` : undefined}
            onPress={handleDocumentTypePress}
            className="flex-row items-center justify-between p-3 bg-[#F2F2F7] dark:bg-[#2C2C2E] rounded-xl"
            activeOpacity={0.7}
          >
            <ThemedText
              className="text-[17px] font-normal text-black dark:text-white flex-1 mr-2"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedLabel}
            </ThemedText>
            <ThemedText className="text-[17px] text-[#007AFF]">Select</ThemedText>
          </TouchableOpacity>
        ):(
          <Picker
            selectedValue={selectedType}
            onValueChange={(value) => setSelectedType(value)}
            className="w-full"
          >
            {docTypes.map(dt => (
              <Picker.Item 
                key={dt.value} 
                label={dt.label} 
                value={dt.value} 
              />
            ))}
          </Picker>
        )}
      </View>

      {/* Documents List */}
      <View>
        {filteredDocs.length > 0 ? (
          <View>
            {filteredDocs.map((doc, index) => (
              <DocumentUpload
                key={doc.id}
                testID={testID ? `${testID}-doc-${index}` : undefined}
                optional
                type={selectedType!}
                title={doc.documentName || selectedLabel!}
                doc={doc}
                onUpload={() => onUpload(selectedType!)}
                onReplace={() => onReplace(selectedType!, doc.id)}
                onDownload={onDownload}
                onDelete={onDelete}
                hasBorder={false}
              />
            ))}

            {/* Show Add Button even if docs exist (to add another of same type if supported, or just to match style if not) 
                However for singular docs we might want to hide it. Assuming standard behavior for now. 
                For strictly matching Q88 style which is 1 doc = filled, 0 doc = placeholder:
            */}
            {/* If we strictly want to mimic "Add new" as a placeholder card below the list: */}
            {category !== 'vessels' && (
              <TouchableOpacity
                testID={testID ? `${testID}-add-another` : undefined}
                onPress={() => onUpload(selectedType!)}
                activeOpacity={0.6}
                className="w-full items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-4 bg-gray-50 dark:bg-gray-900/30 mt-2"
              >
                <View className="flex-row items-center justify-center gap-2">
                  <Plus size={18} color="#6b7280" />
                  <ThemedText className="text-sm font-medium text-gray-600 dark:text-gray-400">Add another {selectedLabel}</ThemedText>
                </View>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            testID={testID ? `${testID}-upload-empty` : undefined}
            onPress={() => onUpload(selectedType!)}
            activeOpacity={0.6}
            className="w-full items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-4 bg-gray-50 dark:bg-gray-900/30"
          >
            <View className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full items-center justify-center mb-2">
              <FileUp size={18} color="#6b7280" />
            </View>
            <ThemedText className="text-sm font-medium mb-0.5">Upload {selectedLabel}</ThemedText>
            <ThemedText className="text-xs text-gray-400">PDF only, max 25MB</ThemedText>
          </TouchableOpacity>
        )}

      </View>
    </View>
  );
}
