/**
 * VesselTopBar Component
 * 
 * Top app bar for vessel detail screens displaying the vessel name and image.
 */

import React from 'react';
import { View, Image } from 'react-native';
import { Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface VesselTopBarProps {
  vesselName: string;
  vesselImage?: string | null;
}

export function VesselTopBar({ vesselName, vesselImage }: VesselTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="px-4 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800 flex-row items-center justify-between"
      style={{ 
        paddingTop: insets.top + 8,
        paddingBottom: 12,
      }}
    >
      <ThemedText type="title" className="text-xl font-bold flex-1" numberOfLines={1}>
        {vesselName}
      </ThemedText>
      
      {/* Vessel Image */}
      <View className="w-14 h-14 rounded-lg overflow-hidden ml-3 bg-gray-100 dark:bg-gray-800">
        {vesselImage ? (
          <Image 
            source={{ uri: vesselImage }} 
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ship size={28} color="#9ca3af" />
          </View>
        )}
      </View>
    </View>
  );
}
