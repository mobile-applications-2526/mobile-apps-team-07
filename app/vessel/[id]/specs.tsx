import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { ThemedView, Card } from '@/components/common';
import { VesselTopBar, DocumentUpload } from '@/components/vessel';
import { useVesselDetails } from '@/context/VesselDetailsContext';
import { DocumentsSection } from '@/components/common/DocumentSection';
import { useDocuments } from '@/hooks';

export default function VesselSpecs() {
  const { vessel, getDocuments } = useVesselDetails();

  const {
    documents,
    findDoc,
    onDownload,
    uploadDocument,
    replaceDocument,
    deleteDocument
  } = useDocuments('vessels', vessel?.id, getDocuments);

  // Robust detection of gas carrier: accept different field names and casing
  const vesselTypeRaw = (
    (vessel as any)?.vesselType ?? (vessel as any)?.type ?? (vessel as any)?.vessel_type ?? ''
  ).toString().trim().toLowerCase();
  const isGasCarrier = vesselTypeRaw.includes('gas') && vesselTypeRaw.includes('carrier');

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      <VesselTopBar
        vesselName={vessel?.vesselName ?? ''}
        vesselImage={vessel?.vesselPicture}
      />

      {/* Verify if locked */}
      {/* (Logic handled in parent layout, but good to be safe if viewed directly) */}

      <ScrollView contentContainerStyle={{ padding: 16 }} className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Specification page: no global unlock banner (banner shown in layout on other pages) */}
        {/* Progress is now shown in the navbar */}

        {/* Required Documents Section */}
        <Card className="mb-3">
          <View className="flex-row items-center mb-3">
            <Text
              className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-1 px-2.5 rounded overflow-hidden"
            >
              Required
            </Text>
          </View>
          <DocumentUpload
            type="Q88"
            title="Q88"
            doc={findDoc('Q88')}
            onUpload={uploadDocument}
            onReplace={replaceDocument}
            onDownload={onDownload}
            onDelete={deleteDocument}
          />

          {/* Only show Form C for Gas Carrier vessels */}
          {isGasCarrier && (
            <DocumentUpload
              type="FormC"
              title="Form C"
              doc={findDoc('FormC')}
              onUpload={uploadDocument}
              onReplace={replaceDocument}
              onDownload={onDownload}
              onDelete={deleteDocument}
              hasBorder
            />
          )}
        </Card>

        {/* Optional Documents Section */}
        <Card className="mb-3">
          <View className="flex-row items-center mb-3">
            <Text
              className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 py-1 px-2.5 rounded overflow-hidden"
            >
              Optional
            </Text>
          </View>
          <DocumentsSection
            documents={documents}
            category='vessels'
            onUpload={uploadDocument}
            onReplace={replaceDocument}
            onDelete={deleteDocument}
            onDownload={onDownload}
          />
        </Card>
      </ScrollView>
    </ThemedView>
  );
}
