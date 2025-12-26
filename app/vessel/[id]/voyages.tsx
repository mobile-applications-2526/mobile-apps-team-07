import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Route, Lock } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useHaptics, useVesselDetails } from '@/hooks';
import { EmptyVoyageList } from '@/components/voyage/EmptyVoyageList';
import { VoyageDetails } from '@/components/voyage/VoyageDetails';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useVoyageDetails } from '@/hooks/useVoyageDetails';
import { VoyageWithDetails } from '@/types';

export default function VesselVoyages() {

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const [index, setIndex] = useState<number>(0);

  const {
    vessel,
    vesselVoyages,
    isLoading,
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
            ? 'Please upload Q88 and Form C in the Specs section to un lock this page.'
            : 'Please upload Q88 in the Specs section to unlock this page.'}
        </ThemedText>
      </ThemedView>
    );
  }

  const voyageWithDetails = useVoyageDetails(vesselVoyages[index].id);

  const handleCycleVoyage = (direction: 'next' | 'previous') => {
    setIndex((prevIndex) => {
      if (direction === 'next') {
        return Math.max(prevIndex - 1, 0);
      } else {
        return Math.min(prevIndex + 1, vesselVoyages.length - 1);
      }
    });
  };

  const handleAddVoyage = () => { }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar vesselName={vessel?.vesselName!} />

      {/* Content */}
      <View>
        {isLoading &&
          <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
            <Route size={32} color="#9ca3af" />
          </View>
        }
        <ThemedText className="text-gray-400 text-center text-sm">
          {vesselVoyages.length > 0 && voyageWithDetails ?
            <VoyageDetails
              voyage={voyageWithDetails.voyage}
              status={voyageWithDetails.noonReports[0] ?? null}
              noonReports={voyageWithDetails.noonReports}
              cargoes={voyageWithDetails.cargoes}
              ports={voyageWithDetails.ports}
              charterParty={voyageWithDetails.charter}
              onCycleVoyage={handleCycleVoyage}
              onAdd={handleAddVoyage}
            />
            : <EmptyVoyageList />
          }
        </ThemedText>
      </View>
    </ThemedView>
  );
}
