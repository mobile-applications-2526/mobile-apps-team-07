/**
 * EmptyVesselList Component
 * 
 * Empty state component when no vessels are present.
 */

import React from 'react';
import { View } from 'react-native';
import { Package, Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/common';

export function EmptyVoyageList() {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
        <Package size={36} color="#9ca3af" />
      </View>
      <ThemedText className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
        No voyages yet
      </ThemedText>
      <ThemedText className="text-sm text-gray-500 dark:text-gray-400 text-center px-8">
        Voyages for this vessel will appear here
      </ThemedText>
    </View>
  );
}
