import React from 'react';
import { View } from 'react-native';
import { FileUp } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VesselTopBar } from '@/components/ui/vessel-top-bar';
import { useVessel } from './_layout';

export default function VesselSpecs() {
  const vessel = useVessel();
  const hasQ88 = vessel?.hasQ88 ?? false;

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar vesselName={vessel?.name ?? ''} />

      {/* Content */}
      <View className="flex-1 items-center justify-center p-6">
        {!hasQ88 ? (
          <View className="items-center">
            {/* Upload Icon */}
            <View className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-900/20 items-center justify-center mb-4">
              <FileUp size={40} color="#3b82f6" />
            </View>
            
            {/* Message */}
            <ThemedText type="defaultSemiBold" className="text-lg text-center mb-2">
              Upload Q88 Document
            </ThemedText>
            <ThemedText className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-[280px]">
              Please upload Q88 to continue. This document is required to access voyages and invoices.
            </ThemedText>
          </View>
        ) : (
          <View className="items-center">
            <ThemedText className="text-gray-500 dark:text-gray-400 text-center">
              Q88 document uploaded
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
}

