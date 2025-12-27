import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar, VesselOverviewSheet, VesselMap } from '@/components/vessel';
import { useColorScheme } from 'nativewind';
import { VesselKPIs } from '@/types';
import { useVesselDetails } from '@/hooks';
import { Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ============================================
// MAIN COMPONENT
// ============================================
export default function VesselOverview() {
  const {
    vessel,
    vesselStatus,
    refreshVessel,
    isLocked: missingDocs
  } = useVesselDetails();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKPIs] = useState<VesselKPIs | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const pollInterval = setInterval(() => {
      refreshVessel();
    }, 30000);
    
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
        <VesselMap
          latitude={vesselStatus?.latitude}
          longitude={vesselStatus?.longitude}
          zoomLevel={8}
        />
      </View>

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
        <VesselTopBar 
          vesselName={vessel.vesselName} 
          vesselImage={vessel.vesselPictureUrl} 
        />
      </View>
    </View>
  );
}
