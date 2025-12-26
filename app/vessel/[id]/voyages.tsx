import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Route } from 'lucide-react-native';
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
  } = useVesselDetails();

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

  const handleAddVoyage = () =>{ }

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
        {vesselVoyages.length > 0 && voyageWithDetails?
          <VoyageDetails
            voyage={voyageWithDetails.voyage} 
            status={voyageWithDetails.noonReports[0]??null} 
            noonReports={voyageWithDetails.noonReports}
            cargoes={voyageWithDetails.cargoes}
            ports={voyageWithDetails.ports}
            charterParty={voyageWithDetails.charter}
            onCycleVoyage={handleCycleVoyage}
            onAdd={handleAddVoyage}
            />
        : <EmptyVoyageList/>
        }
        </ThemedText>
      </View>
    </ThemedView>
  );
}
