import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { ThemedText, ThemedView, Loader, FeatureLockScreen } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useVesselVoyagesScreen } from '@/hooks';
import { EmptyVoyageList } from '@/components/voyage/EmptyVoyageList';
import { VoyageDetails } from '@/components/voyage/VoyageDetails';

export default function VesselVoyages() {
  const {
    vessel,
    vesselVoyages,
    voyageWithDetails,
    getDocuments,
    isLoadingVessel,
    isLoadingVoyage,
    voyageError,
    missingDocs,
    missingDocsMessage,
    handleCycleVoyage,
    handleAddVoyage,
    handleRefresh,
  } = useVesselVoyagesScreen();

  // If required documents are missing, show locked state
  if (missingDocs) {
    return (
      <ThemedView className="flex-1">
        <FeatureLockScreen
          title="Voyages Locked"
          message={missingDocsMessage}
        />
      </ThemedView>
    );
  }

  const AddVoyageButton = (
    <TouchableOpacity
      testID="add-voyage-button"
      onPress={handleAddVoyage}
      className="p-2 bg-blue-600 rounded-full"
    >
      <Plus size={20} color="#fff" />
    </TouchableOpacity>
  );

  if (isLoadingVessel || isLoadingVoyage) {
    return (
      <ThemedView testID="vessel-voyages-loading" className="flex-1 bg-gray-100 dark:bg-[#000]">
        <VesselTopBar
          vesselName={vessel?.vesselName ?? ''}
          vesselImage={vessel?.vesselPicture}
          rightContent={AddVoyageButton}
        />
        <Loader text="Loading voyages..." />
      </ThemedView>
    );
  }

  return (
    <ThemedView testID="vessel-voyages-screen" className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar
        vesselName={vessel?.vesselName ?? ''}
        vesselImage={vessel?.vesselPicture}
        rightContent={AddVoyageButton}
      />

      {/* Content */}
      <View className="flex-1">
        {vesselVoyages.length > 0 ? (
          isLoadingVoyage && !voyageWithDetails ? (
            <Loader text="Loading voyage details..." />
          ) : voyageError ? (
            <ThemedView className="flex-1 items-center justify-center px-6">
              <ThemedText className="text-lg font-semibold mb-2">
                Failed to load voyage details
              </ThemedText>
              <ThemedText className="text-center text-gray-500 dark:text-gray-400 mb-4">
                {voyageError.message}
              </ThemedText>
              <ThemedText
                className="text-blue-500 font-semibold"
                onPress={handleRefresh}
              >
                Tap to retry
              </ThemedText>
            </ThemedView>
          ) : voyageWithDetails ? (
            <VoyageDetails
              key={voyageWithDetails.voyage.id}
              voyage={voyageWithDetails.voyage}
              status={voyageWithDetails.noonReports[0] ?? null}
              noonReports={voyageWithDetails.noonReports}
              cargoes={voyageWithDetails.cargoes}
              ports={voyageWithDetails.ports}
              charterParty={voyageWithDetails.charter}
              getDocuments={getDocuments}
              onCycleVoyage={handleCycleVoyage}
              onAdd={handleAddVoyage}
              onRefresh={handleRefresh}
              isRefreshing={isLoadingVoyage}
            />
          ) : null
        ) : (
          <EmptyVoyageList onAdd={handleAddVoyage} />
        )}
      </View>
    </ThemedView>
  );
}
