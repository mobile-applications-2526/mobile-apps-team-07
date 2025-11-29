import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Ship, MapPin } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { MapView } from '@maplibre/maplibre-react-native'; // Uncomment for dev build
import DUMMY_BOATS from '@/data/dummy_boat_data.json';
import { useColorScheme } from 'react-native';
import Boat from '@/types/boat';

export default function VesselDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  
  const boat = (DUMMY_BOATS as Boat[]).find((b) => b.id === id);
  
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
      {/* Top App Bar with centered title and native-style back button */}
      <View 
        className="flex-row items-center justify-center px-4 bg-white dark:bg-[#151718] border-b border-gray-200 dark:border-gray-800"
        style={{ 
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        {/* Back button - positioned absolutely on the left */}
        <TouchableOpacity 
          onPress={() => router.back()}
          className="absolute left-2 flex-row items-center p-2"
          style={{ top: insets.top + 4 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={Platform.OS === 'ios' ? '#007AFF' : (isDark ? '#ECEDEE' : '#11181C')} />
          {Platform.OS === 'ios' && (
            <ThemedText className="text-[#007AFF] text-base -ml-1">Back</ThemedText>
          )}
        </TouchableOpacity>
        
        {/* Centered title */}
        <ThemedText type="defaultSemiBold" className="text-lg text-center" numberOfLines={1}>
          {boat.name}
        </ThemedText>
      </View>

      {/* MapLibre Map - Half of the screen */}
      <View style={styles.mapContainer} className="bg-gray-200 dark:bg-gray-800 items-center justify-center">
        {/*
          MapLibre Map goes here. Uncomment the MapView import and usage below when running a dev build:
          <MapView style={styles.map} />
        */}
        <ThemedText className="text-sm text-gray-500 text-center px-4">
          [Map Placeholder]{'\n'}MapLibre map will appear here in dev build.
        </ThemedText>
      </View>

      {/* Vessel Details - Lower half */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center mb-4">
          <View className="w-16 h-16 rounded-xl mr-4 items-center justify-center bg-blue-100 dark:bg-blue-900/30">
            <Ship size={40} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <ThemedText type="defaultSemiBold" className="text-xl mb-1">
              {boat.name}
            </ThemedText>
            <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
              {boat.type} • {boat.subtype}
            </ThemedText>
          </View>
        </View>

        <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 border border-gray-100 dark:border-gray-800">
          <View className="mb-3">
            <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              IMO Number
            </ThemedText>
            <ThemedText type="defaultSemiBold" className="text-base">
              {boat.imo}
            </ThemedText>
          </View>
          
          <View className="mb-3">
            <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Vessel Type
            </ThemedText>
            <ThemedText type="defaultSemiBold" className="text-base">
              {boat.type} - {boat.subtype}
            </ThemedText>
          </View>

          <View>
            <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Next Destination
            </ThemedText>
            <View className="flex-row items-center">
              <MapPin size={16} color="#6b7280" />
              <ThemedText type="defaultSemiBold" className="text-base ml-1">
                {boat.eta && boat.port 
                  ? `ETA: ${boat.eta}, ${boat.port}` 
                  : 'No active voyage'}
              </ThemedText>
            </View>
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
