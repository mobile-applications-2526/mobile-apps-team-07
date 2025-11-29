/**
 * EmptyVesselList Component
 * 
 * Empty state component when no vessels are present.
 */

import React from 'react';
import { View } from 'react-native';
import { Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/common';

export function EmptyVesselList() {
  return (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
        <Ship size={32} color="#9ca3af" />
      </View>
      <ThemedText className="text-gray-400 text-center text-sm">
        No vessels added yet{'\n'}Tap + to add your first vessel
      </ThemedText>
    </View>
  );
}
