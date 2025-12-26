import React, { useState, useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar, KPIGraph, VesselOverviewSheet } from '@/components/vessel';
import { useColorScheme } from 'nativewind';
import { VesselKPIs } from '@/types';
import { useVesselDetails } from '@/hooks';
import { useFocusEffect, Redirect } from 'expo-router';
import { IS_EXPO_GO } from '@/constants/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Conditionally import MapView only if not in Expo Go
let MapView: any;
if (!IS_EXPO_GO) {
  try {
    MapView = require('@maplibre/maplibre-react-native').default;
  } catch (e) {
    console.warn('@maplibre/maplibre-react-native could not be loaded outside of Expo Go:', e);
    MapView = null;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function VesselOverview() {
  const {
    vessel,
    activeVoyage,
    activeCharterParty,
    refreshVessel,
    getLatestNoonReport,
    isLocked: missingDocs
  } = useVesselDetails();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKPIs] = useState<VesselKPIs | null>(null);
  const insets = useSafeAreaInsets();

  // Use standard BottomSheet ref instead of BottomSheetModal
  // Note: we'll use a functional component approach for BottomSheet which typically doesn't require a ref for initial presentation


  useEffect(() => {
    const pollInterval = setInterval(() => {
      refreshVessel();
    }, 30000)

    return () => clearInterval(pollInterval);
  }, [vessel?.id, refreshVessel]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshVessel();
    setRefreshing(false);
  }, [refreshVessel]);



  // If required documents are missing, automatically redirect to specs
  if (missingDocs) {
    return <Redirect href={`/vessel/${vessel?.id}/specs`} />;
  }

  if (!vessel) {
    return (
      <ThemedView className="flex-1 items-center justify-center">
        <ThemedText>Vessel not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View className="flex-1 relative">
      {/* 1. LAYER: Background Map */}
      <View style={StyleSheet.absoluteFill}>
        {IS_EXPO_GO || !MapView ? (
          <View className="flex-1 bg-gray-200 dark:bg-gray-800 items-center justify-center">
            <ThemedText className="text-sm text-gray-500 text-center px-4">
              [Map Placeholder]{'\n'}Map is not available in Expo Go. Please use a dev build.
            </ThemedText>
          </View>
        ) : (
          <MapView style={styles.map} />
        )}
      </View>

      {/* 2. LAYER: Bottom Sheet (Standard, not Modal) */}
      {/* 2. LAYER: Bottom Sheet (Standard, not Modal) */}
      <VesselOverviewSheet
        vessel={vessel}
        kpis={kpis}
        refreshing={refreshing}
        onRefresh={onRefresh}
        isDark={isDark}
      />

      {/* 3. LAYER: Navbar (Top App Bar) - Absolute Positioned on TOP */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999, // Ensure highest z-order
        }}
      >
        <VesselTopBar vesselName={vessel.vesselName} vesselImage={vessel.vesselPictureUrl} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
