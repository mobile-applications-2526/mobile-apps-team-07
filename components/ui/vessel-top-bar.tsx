import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VesselTopBarProps {
  vesselName: string;
}

export function VesselTopBar({ vesselName }: VesselTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="px-4 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800 items-center justify-center"
      style={{ 
        paddingTop: insets.top + 8,
        paddingBottom: 12,
      }}
    >
      <ThemedText type="title" className="text-xl font-bold text-center" numberOfLines={1}>
        {vesselName}
      </ThemedText>
    </View>
  );
}
