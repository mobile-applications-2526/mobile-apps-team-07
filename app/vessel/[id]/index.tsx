import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar, VesselOverviewSheet, VesselMap } from '@/components/vessel';
import { useColorScheme } from 'nativewind';
import { useVesselOverviewScreen } from '@/hooks';
import { Redirect } from 'expo-router';

// ============================================
// MAIN COMPONENT
// ============================================
export default function VesselOverview() {
  const {
    vessel,
    vesselStatus,
    activeVoyage,
    activeCharter,
    kpis,
    refreshing,
    isLocked,
    onRefresh,
  } = useVesselOverviewScreen();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // If required documents are missing, automatically redirect to specs
  if (isLocked) {
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
    <View testID="vessel-overview-screen" className="flex-1 relative">
      {/* 1. LAYER: Background Map (disabled on iOS) */}
      {Platform.OS !== 'ios' && (
        <View testID="vessel-map" style={StyleSheet.absoluteFill}>
          <VesselMap
            latitude={vesselStatus?.latitude}
            longitude={vesselStatus?.longitude}
            zoomLevel={8}
          />
        </View>
      )}

      {/* 2. LAYER: Bottom Sheet (Standard, not Modal) */}
      <VesselOverviewSheet
        vessel={vessel}
        kpis={kpis}
        refreshing={refreshing}
        onRefresh={onRefresh}
        isDark={isDark}
        vesselStatus={vesselStatus}
        activeVoyage={activeVoyage}
        activeCharter={activeCharter}
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
          vesselImage={vessel.vesselPicture}
        />
      </View>
    </View>
  );
}
