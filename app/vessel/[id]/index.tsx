import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Ship, MapPin } from 'lucide-react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { useVessel } from './_layout';

export default function VesselHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const boat = useVessel();
  
  const isDark = colorScheme === 'dark';

  if (!boat) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ThemedText>Vessel not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 dark:bg-[#000]">
      {/* Top App Bar with centered title and native-style back button */}
      <View 
        className="flex-row items-center justify-center px-4 bg-white dark:bg-[#1c1c1e] border-b border-gray-200 dark:border-gray-800"
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

      {/* MapLibre Map Placeholder - Half of the screen */}
      <View style={styles.mapContainer} className="bg-gray-200 dark:bg-gray-800 items-center justify-center">
        {/*
          MapLibre Map goes here. Uncomment the MapView import and usage below when running a dev build:
          <MapView style={styles.map} />
        */}
        <ThemedText className="text-sm text-gray-500 text-center px-4">
          [Map Placeholder]{'\n'}MapLibre map will appear here in dev build.
        </ThemedText>
      </View>

      {/* Vessel Details */}
      <View className="flex-1 p-4">
        <View className="flex-row items-center mb-4">
          <View className="w-14 h-14 rounded-xl mr-3 items-center justify-center bg-blue-50 dark:bg-blue-900/20">
            <Ship size={32} color="#3b82f6" />
          </View>
          <View className="flex-1">
            <ThemedText type="defaultSemiBold" className="text-lg" numberOfLines={1}>
              {boat.name}
            </ThemedText>
            <ThemedText className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
              {boat.type} • {boat.subtype}
            </ThemedText>
          </View>
        </View>

        <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4">
          <View className="flex-row justify-between mb-3">
            <View className="flex-1">
              <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                IMO Number
              </ThemedText>
              <ThemedText type="defaultSemiBold" className="text-sm">
                {boat.imo}
              </ThemedText>
            </View>
            <View className="flex-1">
              <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
                Status
              </ThemedText>
              <ThemedText type="defaultSemiBold" className="text-sm text-green-600">
                Active
              </ThemedText>
            </View>
          </View>

          <View>
            <ThemedText className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">
              Next Destination
            </ThemedText>
            <View className="flex-row items-center">
              <MapPin size={14} color="#6b7280" />
              <ThemedText type="defaultSemiBold" className="text-sm ml-1" numberOfLines={1}>
                {boat.eta && boat.port 
                  ? `ETA: ${boat.eta}, ${boat.port}` 
                  : 'No active voyage'}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: '40%',
  },
  map: {
    flex: 1,
  },
});
