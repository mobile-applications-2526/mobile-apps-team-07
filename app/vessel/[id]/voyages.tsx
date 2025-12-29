import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Lock, Plus } from 'lucide-react-native';
import { ThemedText, ThemedView, Loader } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useHaptics, useVesselDetails } from '@/hooks';
import { EmptyVoyageList } from '@/components/voyage/EmptyVoyageList';
import { VoyageDetails } from '@/components/voyage/VoyageDetails';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVoyageDetails } from '@/hooks/useVoyageDetails';

export default function VesselVoyages() {
  const insets = useSafeAreaInsets();

  const haptics = useHaptics();
  const [index, setIndex] = useState<number>(0);

  const {
    vessel,
    vesselVoyages,
    isLoading: isLoadingVessel,
    hasQ88,
    hasFormC,
  } = useVesselDetails();

  // Document verification guard
  const vesselTypeRaw = (
    (vessel as any)?.vesselType ?? (vessel as any)?.type ?? (vessel as any)?.vessel_type ?? ''
  ).toString().trim().toLowerCase();
  const isGasCarrier = vesselTypeRaw.includes('gas') && vesselTypeRaw.includes('carrier');
  const missingDocs = isGasCarrier ? !(hasQ88 && hasFormC) : !hasQ88;

  // If required documents are missing, show locked state
  if (missingDocs) {
    return (
      <ThemedView className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
          <Lock size={40} color="#9ca3af" />
        </View>
        <ThemedText className="text-xl font-semibold mb-2">Voyages Locked</ThemedText>
        <ThemedText className="text-center text-gray-500 dark:text-gray-400">
          {isGasCarrier
            ? 'Please upload Q88 and Form C in the Specs section to unlock this page.'
            : 'Please upload Q88 in the Specs section to unlock this page.'}
        </ThemedText>
      </ThemedView>
    );
  }

  // Get current voyage ID and fetch its details
  const currentVoyageId = vesselVoyages?.[index]?.id;
  const {
    voyageWithDetails,
    getDocuments,
    isLoading: isLoadingVoyage,
    error: voyageError,
    refresh,
  } = useVoyageDetails(currentVoyageId);

  // Reset index if voyages list changes and current index is out of bounds
  useEffect(() => {
    if (vesselVoyages.length > 0 && index >= vesselVoyages.length) {
      setIndex(0);
    }
  }, [vesselVoyages.length, index]);

  const handleCycleVoyage = (direction: 'next' | 'previous') => {
    haptics.lightImpact();
    setIndex((prevIndex) => {
      if (direction === 'next') {
        return Math.max(prevIndex - 1, 0);
      } else {
        return Math.min(prevIndex + 1, vesselVoyages.length - 1);
      }
    });
  };

  const handleAddVoyage = () => {
    haptics.mediumImpact();
    // TODO: Navigate to add voyage screen
  };

  const handleRefresh = () => {
    haptics.lightImpact();
    refresh();
  };

  if (isLoadingVessel || isLoadingVoyage) {
    return (
      <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
        <VesselTopBar
          vesselName={vessel?.vesselName ?? ''}
          vesselImage={vessel?.vesselPictureUrl}
        />
        <Loader text="Loading voyages..." />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar
        vesselName={vessel?.vesselName ?? ''}
        vesselImage={vessel?.vesselPictureUrl}
        rightContent={
          <TouchableOpacity
            onPress={handleAddVoyage}
            className="p-2 bg-blue-600 rounded-full"
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        }
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
              key={currentVoyageId}
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
