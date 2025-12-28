import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { FileText, Plus, ChevronDown } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { DocumentUpload } from '../vessel';
import { Document, DocumentCategory, DocumentType } from '@/types';
import { CARGO_DOC_TYPES, VESSEL_DOC_TYPES, VOYAGE_DOC_TYPES } from '@/constants';

interface DocumentsSectionProps {
  documents: Document[];
  category: DocumentCategory;
  title?: string;
  onUpload: (type: DocumentType) => Promise<void>;
  onReplace: (type: DocumentType, documentId: number) => Promise<void>;
  onDownload: (doc: Document) => Promise<void>;
}

export function DocumentsSection({
  documents,
  category,
  title,
  onUpload,
  onReplace,
  onDownload,
}: DocumentsSectionProps) {

  const [selectedType, setSelectedType] = useState<DocumentType | null>(
    ( category == 'vessels'? 'CharterParty'
    : category == 'voyages'? 'NoonReport'
    : category == 'cargoes'? 'CargoManifest': null )
  );

  const [showDropdown, setShowDropdown] = useState(false);

  // Filter documents by selected type
  const filteredDocs = documents.filter(doc => doc.documentType === selectedType);

  const docTypes = (
      category == 'vessels' ? 
        VESSEL_DOC_TYPES.filter(v => !['FormC', 'Q88'].includes(v.value))
    : category == 'voyages' ? 
        VOYAGE_DOC_TYPES
    : category == 'cargoes' ? 
        CARGO_DOC_TYPES :  null);
  
  // Get label for selected type
  const selectedLabel = docTypes?.find(t => t.value === selectedType)?.label || selectedType;

  return (
    <View className="mb-4">
      {/* Header with Document Type Selector */}
      <View className="bg-white dark:bg-[#1c1c1e] rounded-t-2xl p-6 pb-4">
      {title && 
        <View className="flex-row items-center justify-between mb-4">
          <ThemedText className="text-xl font-bold">{title}</ThemedText>
        </View>
      }

        {/* Document Type Dropdown */}
        <View className="relative">
          <TouchableOpacity
            onPress={() => setShowDropdown(!showDropdown)}
            className="flex-row items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl"
          >
            <ThemedText className="text-base font-medium">{selectedLabel}</ThemedText>
            <ChevronDown 
              size={20} 
              color="#6b7280" 
              style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
            />
          </TouchableOpacity>

          {/* Dropdown Menu */}
          {showDropdown && (
            <View className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1c1c1e] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-80">
              <ScrollView>
                {docTypes?.map((docType) => (
                  <TouchableOpacity
                    key={docType.value}
                    onPress={() => {
                      setSelectedType(docType.value);
                      setShowDropdown(false);
                    }}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 ${
                      selectedType === docType.value ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <ThemedText 
                      className={`${
                        selectedType === docType.value 
                          ? 'text-blue-600 dark:text-blue-400 font-semibold' 
                          : 'text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {docType.label}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>

      {/* Documents List */}
      <View className="bg-white dark:bg-[#1c1c1e] p-6 pt-2">
        {filteredDocs.length > 0 ? (
          <View className="gap-3">
            {filteredDocs.map((doc) => (
              <DocumentUpload
                key={doc.id}
                optional
                type={selectedType!}
                title={doc.documentName || selectedLabel!}
                doc={doc}
                onUpload={() => onUpload(selectedType!)}
                onReplace={() => onReplace(selectedType!, doc.id)}
                onDownload={() => onDownload(doc)}
              />
            ))}
          </View>
        ) : (
          <View className="items-center py-8">
            <FileText size={48} color="#9ca3af" />
            <ThemedText className="text-center text-gray-500 dark:text-gray-400 mt-3">
              No {selectedLabel!.toLowerCase()}s uploaded yet
            </ThemedText>
          </View>
        )}

        {/* Add New Document Button */}
        {category !== 'vessels' && (
          <TouchableOpacity
            onPress={()=>onUpload(selectedType!)}
            className="flex-row items-center justify-center gap-2 p-4 mt-4 bg-blue-600 rounded-xl"
          >
            <Plus size={20} color="#fff" />
            <ThemedText className="text-white font-semibold">
              Add {selectedLabel}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
