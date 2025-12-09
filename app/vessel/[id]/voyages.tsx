import React from 'react';
import { View, FlatList } from 'react-native';
import { Route } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useHaptics, useVesselDetails } from '@/hooks';
import { EmptyVoyageList } from '@/components/voyage/EmptyVoyageList';
import { VoyageCard } from '@/components/voyage/VoyageCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function VesselVoyages() {

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { vessel, vesselStatus, vesselVoyages } = useVesselDetails();

  const handleDeletePress = ()=>{

  }

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar vesselName={vessel?.vesselName!} />

      {/* Content */}
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
          <Route size={32} color="#9ca3af" />
        </View>
        <ThemedText className="text-gray-400 text-center text-sm">
          <FlatList
            data={vesselVoyages}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <VoyageCard vessel={vessel!} status={vesselStatus} voyage={item} onDeletePress={handleDeletePress} />}
            contentContainerStyle={{ 
              padding: 12, 
              paddingBottom: insets.bottom + 20,
              gap: 10,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyVoyageList/>}
          />
        </ThemedText>
      </View>
    </ThemedView>
  );
}
