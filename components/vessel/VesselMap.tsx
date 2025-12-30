import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/common';
import { IS_EXPO_GO } from '@/constants/env';

// Conditionally import MapView only if not in Expo Go
let MapView: any = null;
let MapLibreGL: any = null;

if (!IS_EXPO_GO) {
  try {
    MapLibreGL = require('@maplibre/maplibre-react-native');
    MapView = MapLibreGL.MapView;
  } catch (e) {
    console.warn('@maplibre/maplibre-react-native could not be loaded:', e);
    MapView = null;
  }
}

interface VesselMapProps {
  latitude?: number;
  longitude?: number;
  heading?: number;
  styleURL?: string;
  zoomLevel?: number;
}

export function VesselMap({
  latitude,
  longitude,
  heading,
  styleURL = 'https://demotiles.maplibre.org/style.json',
  zoomLevel = 8,
}: VesselMapProps) {
  const hasValidCoordinates = 
    latitude !== undefined && 
    latitude !== null && 
    longitude !== undefined && 
    longitude !== null &&
    latitude !== 0 && 
    longitude !== 0;

  if (IS_EXPO_GO || !MapView) {
    return (
      <View className="flex-1 bg-gray-200 dark:bg-gray-800 items-center justify-center">
        <ThemedText className="text-sm text-gray-500 text-center px-4">
          [Map Placeholder]{'\n'}Map is not available in Expo Go. Please use a dev build.
        </ThemedText>
      </View>
    );
  }

  if (!hasValidCoordinates) {
    return (
      <View className="flex-1 bg-gray-200 dark:bg-gray-800 items-center justify-center">
        <ThemedText className="text-sm text-gray-500 text-center px-4">
          No vessel position available
        </ThemedText>
      </View>
    );
  }

  return (
    <MapView style={styles.map} styleURL={styleURL}>
      {/* Camera - centers the map on vessel position */}
      <MapLibreGL.Camera
        centerCoordinate={[longitude, latitude]}
        zoomLevel={zoomLevel}
        heading={heading}
        animationDuration={1000}
      />

      {/* Marker - shows vessel position */}
      <MapLibreGL.PointAnnotation
        id="vessel-marker"
        coordinate={[longitude, latitude]}
      >
        <View style={styles.markerContainer}>
          <View style={styles.marker} />
        </View>
      </MapLibreGL.PointAnnotation>
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
  },
  marker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
