import React, { useState, useEffect, useCallback } from 'react';
import { View, RefreshControl, StyleSheet } from 'react-native';
import { ThemedText, ThemedView } from '@/components/common';
import { VesselTopBar } from '@/components/vessel';
import { useColorScheme } from 'nativewind';
import { VesselKPIs } from '@/types';
import { useVesselDetails } from '@/hooks';
import { useFocusEffect } from 'expo-router';
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

interface DataRowProps {
  label: string;
  value: string;
}

function DataRow({ label, value }: DataRowProps) {
  return (
    <View className="flex-row justify-between py-2">
      <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
        {label}:
      </ThemedText>
      <ThemedText className="text-sm font-medium text-right flex-1 ml-4">
        {value}
      </ThemedText>
    </View>
  );
}

interface DataSectionProps {
  title: string;
  children: React.ReactNode;
}

function DataSection({ title, children }: DataSectionProps) {
  return (
    <View className="bg-white dark:bg-[#1c1c1e] rounded-xl p-4 mb-3">
      <ThemedText type="defaultSemiBold" className="text-base mb-2">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

// ============================================
// KPI GRAPH COMPONENT
// ============================================

interface KPIGraphProps {
  title: string;
  actual: number | null;
  target: number | null;
  actualLabel: string;
  targetLabel: string;
  unit: string;
  status: 'green' | 'yellow' | 'red' | 'no_data' | 'no_cp' | 'no_voyage';
  isLowerBetter?: boolean;
}

function KPIGraph({
  title,
  actual,
  target,
  actualLabel,
  targetLabel,
  unit,
  status,
  isLowerBetter = false,
}: KPIGraphProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getStatusColor = () => {
    switch (status) {
      case 'green': return '#22c55e';
      case 'yellow': return '#eab308';
      case 'red': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'green': return '✓';
      case 'yellow': return '⚠';
      case 'red': return '✗';
      default: return '';
    }
  };

  const getProgress = () => {
    if (actual === null || target === null || target === 0) return 0;
    const ratio = actual / target;
    return Math.min(ratio, 1.5) / 1.5 * 100;
  };

  const getTargetPosition = () => {
    if (target === null || actual === null) return 66.67;
    const maxVal = Math.max(actual, target) * 1.5;
    return (target / maxVal) * 100;
  };

  if (status === 'no_data') {
    return (
      <View className="mb-4">
        <ThemedText className="text-sm font-medium mb-2">{title}</ThemedText>
        <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 items-center">
          <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
            No data - awaiting noon report
          </ThemedText>
        </View>
      </View>
    );
  }

  if (status === 'no_cp') {
    return (
      <View className="mb-4">
        <ThemedText className="text-sm font-medium mb-2">{title}</ThemedText>
        <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 items-center">
          <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
            No CP linked
          </ThemedText>
        </View>
      </View>
    );
  }

  if (status === 'no_voyage') {
    return (
      <View className="mb-4">
        <ThemedText className="text-sm font-medium mb-2">{title}</ThemedText>
        <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 items-center">
          <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
            No active voyage
          </ThemedText>
        </View>
      </View>
    );
  }

  const statusColor = getStatusColor();
  const progress = getProgress();
  const targetPos = getTargetPosition();

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <ThemedText className="text-sm font-medium">{title}</ThemedText>
        <View className="flex-row items-center">
          <ThemedText className="text-sm font-bold">
            {actual !== null ? `${actual} ${unit}` : '-'}
          </ThemedText>
          <ThemedText className="text-sm text-gray-500 dark:text-gray-400 mx-1">|</ThemedText>
          <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
            {target !== null ? `${target} ${unit} CP` : '-'}
          </ThemedText>
          <View
            className="w-5 h-5 rounded-full items-center justify-center ml-2"
            style={{ backgroundColor: statusColor }}
          >
            <ThemedText className="text-xs text-white font-bold">
              {getStatusIcon()}
            </ThemedText>
          </View>
        </View>
      </View>

      <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
        <View
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: statusColor,
          }}
        />
        <View
          className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-300"
          style={{ left: `${targetPos}%` }}
        />
        <View
          className="absolute w-3 h-3 rounded-full bg-gray-600 dark:bg-gray-300 border-2 border-white dark:border-gray-900"
          style={{
            left: `${targetPos}%`,
            top: 0,
            marginLeft: -6,
          }}
        />
      </View>

      <View className="flex-row justify-between mt-1">
        <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
          {actualLabel}: {actual !== null ? `${actual} ${unit}` : '-'}
        </ThemedText>
        <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
          {targetLabel}: {target !== null ? `${target} ${unit}` : '-'}
        </ThemedText>
      </View>
    </View>
  );
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
    getLatestNoonReport
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
  const snapPoints = React.useMemo(() => ['25%', '50%', '90%'], []);

  useEffect(() => {
    const pollInterval = setInterval(() => {
      refreshVessel();
    }, 30000)

    return () => clearInterval(pollInterval);
  }, [vessel?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshVessel();
    setRefreshing(false);
  }, []);

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
