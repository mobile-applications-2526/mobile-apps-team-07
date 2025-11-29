import React from 'react';
import { View } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VesselVoyages() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <View className="flex-1" />
    </ThemedView>
  );
}
