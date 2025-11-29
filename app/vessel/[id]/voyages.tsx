import React from 'react';
import { View } from 'react-native';
import { Route } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VesselTopBar } from '@/components/ui/vessel-top-bar';
import { useVessel } from './_layout';

export default function VesselVoyages() {
  const vessel = useVessel();

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar vesselName={vessel?.name ?? ''} />

      {/* Content */}
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
          <Route size={32} color="#9ca3af" />
        </View>
        <ThemedText className="text-gray-400 text-center text-sm">
          No voyages yet
        </ThemedText>
      </View>
    </ThemedView>
  );
}
