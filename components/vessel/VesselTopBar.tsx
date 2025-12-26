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
  rightContent?: React.ReactNode;
}

export function VesselTopBar({ vesselName, vesselImage, rightContent }: VesselTopBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-4 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800 flex-row items-center justify-between"
      style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
      }}
    >
      <View className="flex-1 mr-4">
        <ThemedText type="title" className="text-xl font-bold" numberOfLines={1}>
          {vesselName}
        </ThemedText>
      </View>

      <View className="flex-row items-center">
        {rightContent && (
          <View className="mr-3">
            {rightContent}
          </View>
        )}

        {/* Vessel Image */}
        <View className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
          {vesselImage ? (
            <Image
              source={{ uri: vesselImage }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ship size={20} color="#9ca3af" />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
