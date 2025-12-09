import React from 'react';
import { View } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useVesselDetails } from '@/hooks';

export default function VesselInvoices() {
  const {vessel} = useVesselDetails();

  return (
    <ThemedView className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar */}
      <VesselTopBar vesselName={vessel?.vesselName ?? ''} />

      {/* Content */}
      <View className="flex-1 items-center justify-center p-6">
        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mb-4">
          <Receipt size={32} color="#9ca3af" />
        </View>
        <ThemedText className="text-gray-400 text-center text-sm">
          No invoices yet
        </ThemedText>
      </View>
    </ThemedView>
  );
}

