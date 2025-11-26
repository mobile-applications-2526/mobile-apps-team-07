import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Ship } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapView } from '@maplibre/maplibre-react-native';
import DUMMY_BOATS from '@/data/dummy_boat_data.json';
import { useColorScheme } from 'react-native';

export default function VesselDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  const boat = DUMMY_BOATS.find((b) => b.id === id);
  
  if (!boat) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ThemedText>Vessel not found</ThemedText>
      </ThemedView>
    );
  }

  const isDark = colorScheme === 'dark';

  return (
    <ThemedView className="flex-1">
      {/* Top App Bar */}
      <View 
        className="flex-row items-center px-4 bg-white dark:bg-[#151718] border-b border-gray-200 dark:border-gray-800"
        style={{ 
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity 
          onPress={() => router.back()}
          className="mr-3 p-2 -ml-2"
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={isDark ? '#ECEDEE' : '#11181C'} />
        </TouchableOpacity>
        
        <View className="flex-1">
          <ThemedText type="defaultSemiBold" className="text-lg">
            {boat.name}
          </ThemedText>
        </View>
      </View>

      {/* MapLibre Map - Half of the screen */}
      <View style={styles.mapContainer}>
        <MapView style={styles.map} />
      </View>

      {/* Vessel Details - Lower half */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center mb-4">
          <View className="w-16 h-16 rounded-xl mr-4 items-center justify-center bg-[#0a7ea4]/[0.08]">
            <Ship size={40} color="#0a7ea4" />
          </View>
          <View className="flex-1">
            <ThemedText type="defaultSemiBold" className="text-xl mb-1">
              {boat.name}
            </ThemedText>
            <ThemedText className="text-sm text-[#444] dark:text-[#bbb]">
              {boat.type}
            </ThemedText>
          </View>
        </View>

        <View className="bg-black/[0.03] dark:bg-white/[0.05] rounded-xl p-4">
          <View className="mb-3">
            <ThemedText className="text-xs text-[#666] dark:text-[#999] mb-1">
              Length
            </ThemedText>
            <ThemedText type="defaultSemiBold" className="text-base">
              {boat.length}
            </ThemedText>
          </View>
          
          <View>
            <ThemedText className="text-xs text-[#666] dark:text-[#999] mb-1">
              Location
            </ThemedText>
            <ThemedText type="defaultSemiBold" className="text-base">
              {boat.location}
            </ThemedText>
          </View>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: '50%',
  },
  map: {
    flex: 1,
  },
});
