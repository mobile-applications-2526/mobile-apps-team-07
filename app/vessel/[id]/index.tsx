import React, { useState, useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { ThemedText, ThemedView, DataSection, DataRow } from '@/components/common';
import { VesselTopBar, KPIGraph } from '@/components/vessel';
import { useColorScheme } from 'nativewind';
import { VesselKPIs } from '@/types';
import { useVesselDetails } from '@/hooks';
import { useFocusEffect, Redirect } from 'expo-router';
import { IS_EXPO_GO } from '@/constants/env';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
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
// HELPER FUNCTIONS
// ============================================

function formatValue(value: string | number | null | undefined, suffix: string = ''): string {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
}

function calculateKPIStatus(
  actual: number | null,
  target: number | null,
  isLowerBetter: boolean = false
): 'green' | 'yellow' | 'red' {
  if (actual === null || target === null) return 'green';

  const variance = isLowerBetter
    ? ((actual - target) / target) * 100
    : ((target - actual) / target) * 100;

  if (variance <= 5) return 'green';
  if (variance <= 15) return 'yellow';
  return 'red';
}

// ============================================
// DATA SECTION COMPONENT
// ============================================





// ============================================
// KPI GRAPH COMPONENT
// ============================================


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
  // but if we used ref it would be BottomSheet
  const bottomSheetRef = React.useRef<BottomSheet>(null);

  // Calculate max height to stop slightly below the top app bar
  // Top app bar height = insets.top + padding (8) + content height (~56) + bottom padding (12)
  const topBarHeight = insets.top + 76;
  const maxSheetHeight = `${100 - ((topBarHeight + 64) / 812) * 100}%`; // 16px gap below app bar, assuming standard iPhone height as reference

  const snapPoints = React.useMemo(() => ['25%', '50%', maxSheetHeight], [maxSheetHeight]);

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
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
        enableDynamicSizing={false}
      >
        <BottomSheetScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          <DataSection title="Identification">
            <DataRow label="IMO" value={formatValue(vessel.imoNumber)} />
            <DataRow label="Flag" value={formatValue(vessel.flag)} />
            <DataRow label="Classification" value={formatValue(vessel.classificationSociety)} />
            <DataRow label="Build Year" value={formatValue(vessel.buildYear)} />
          </DataSection>

          <DataSection title="Capacity">
            <DataRow label="DWT" value={formatValue(vessel.dwtMt, ' MT')} />
            <DataRow label="Cubic Capacity" value={formatValue(vessel.cubicCapacityM3, ' M³')} />
            <DataRow label="Cargo Tanks" value={formatValue(vessel.cargoTanksCount)} />
            <DataRow label="Tank Coating" value={formatValue(vessel.tankCoating)} />
          </DataSection>

          <DataSection title="Performance vs Charter Party">
            <KPIGraph
              title="Speed"
              actual={kpis?.speed.actual ?? null}
              target={kpis?.speed.target ?? null}
              actualLabel="Actual"
              targetLabel="CP"
              unit="kts"
              status={kpis?.speed.status ?? 'no_data'}
            />
            <KPIGraph
              title="Fuel Consumption"
              actual={kpis?.fuelConsumption.actual ?? null}
              target={kpis?.fuelConsumption.target ?? null}
              actualLabel="Actual"
              targetLabel="CP"
              unit="MT/day"
              status={kpis?.fuelConsumption.status ?? 'no_data'}
              isLowerBetter
            />
            <KPIGraph
              title="Cargo Temp"
              actual={kpis?.cargoTemp.actual ?? null}
              target={kpis?.cargoTemp.required ?? null}
              actualLabel="Actual"
              targetLabel="CP"
              unit="°C"
              status={kpis?.cargoTemp.status ?? 'no_voyage'}
            />
          </DataSection>

          <DataSection title="Dimensions">
            <DataRow label="DWT" value={formatValue(vessel.dwtMt, ' MT')} />
            <DataRow label="Summer Draft" value={formatValue(vessel.summerDraftM, ' M')} />
          </DataSection>

          <DataSection title="Cargo Limits">
            <DataRow label="Max Cargo Temp" value={formatValue(vessel.maxCargoTempC, '°C')} />
            <DataRow label="Min Cargo Temp" value={formatValue(vessel.minCargoTempC, '°C')} />
            <DataRow label="Max Pressure" value={formatValue(vessel.maxPressureBar, ' Bar')} />
          </DataSection>

          <DataSection title="Performance">
            <DataRow label="Average Speed" value={formatValue(vessel.averageSpeedKnots, ' Knots')} />
            <DataRow label="Fuel Consumption" value={formatValue(vessel.fuelConsumptionMtDay, ' MT/Day')} />
          </DataSection>

          <DataSection title="Build">
            <DataRow label="Build Year" value={formatValue(vessel.buildYear)} />
            <DataRow label="Drydock Due" value={formatValue(vessel.drydockDueDate.toString())} />
          </DataSection>

          <DataSection title="Type">
            <DataRow label="Vessel Type" value={formatValue(vessel.vesselType)} />
            <DataRow label="Vessel Subtype" value={formatValue(vessel.vesselSubtype)} />
          </DataSection>
        </BottomSheetScrollView>
      </BottomSheet>

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
