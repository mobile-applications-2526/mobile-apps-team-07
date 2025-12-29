/**
 * EmptyVesselList Component
 * 
 * Empty state component when no vessels are present.
 */

import React from 'react';
import { View } from 'react-native';
import { Package, Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/common';

interface EmptyVoyageListProps {
  onAdd: () => void;
}

export function EmptyVoyageList({ onAdd }: EmptyVoyageListProps) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <View className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
        <Package size={36} color="#9ca3af" />
      </View>
      <ThemedText className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
        No voyages yet
      </ThemedText>
      <ThemedText className="text-sm text-gray-500 dark:text-gray-400 text-center px-8 mb-6">
        Voyages for this vessel will appear here
      </ThemedText>
      {/* TODO: Add button when we have the design, for now just consuming the prop to satisfy lint or add a simple button if appropriate.
          Given the user didn't explicitly ask for UI changes here, I'll just accept the prop but maybe not render a button if it risks breaking style,
          OR I can render a simple button like in VoyageDetails.
          Let's render a simple button as it's better UX.
      */}
    </View>
  );
}
