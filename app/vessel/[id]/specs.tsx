import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  ScrollView,
} from 'react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar, DocumentUpload } from '@/components/vessel';
import { useVesselDetails, useVesselDocuments } from '@/hooks';

export default function VesselSpecs() {
  const { vessel, hasQ88 } = useVesselDetails();

  const {
    documents,
    uploadState,
    loadDocuments,
    findDoc,
    onDownload,
    pickAndUpload,
    onReplace,
  } = useVesselDocuments();

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Robust detection of gas carrier: accept different field names and casing
  const vesselTypeRaw = (
    (vessel as any)?.vesselType ?? (vessel as any)?.type ?? (vessel as any)?.vessel_type ?? ''
  ).toString().trim().toLowerCase();
  const isGasCarrier = vesselTypeRaw.includes('gas') && vesselTypeRaw.includes('carrier');

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      <VesselTopBar vesselName={vessel?.vesselName ?? ''} />

  <ScrollView contentContainerStyle={{ padding: 16 }} className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Specification page: no global unlock banner (banner shown in layout on other pages) */}

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
          <DocumentUpload
            type="Q88"
            title="Q88"
            doc={findDoc('Q88')}
            onUpload={pickAndUpload}
            onReplace={onReplace}
            onDownload={onDownload}
          />

          {/* Only show Form C for Gas Carrier vessels */}
          {isGasCarrier && (
            <DocumentUpload
              type="FormC"
              title="Form C"
              doc={findDoc('FormC')}
              onUpload={pickAndUpload}
              onReplace={onReplace}
              onDownload={onDownload}
            />
          )}

          <DocumentUpload
            type="CharterParty"
            title="Charter Party"
            optional
            doc={findDoc('CharterParty')}
            onUpload={pickAndUpload}
            onReplace={onReplace}
            onDownload={onDownload}
          />
        </View>
      </ScrollView>
    </ThemedView>
  );
}
