/**
 * useVesselOverviewScreen Hook
 * 
 * Business logic for the Vessel Overview screen.
 * Handles polling, refresh state, and KPI data management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useVesselDetails } from '@/hooks';
import type { VesselKPIs, Voyage, CharterParty, VesselStatus, Vessel } from '@/types';

/**
 * Calculate KPI status based on actual vs target value
 */
function calculateKPIStatus(
  actual: number | null,
  target: number | null,
  isLowerBetter: boolean = false
): 'green' | 'yellow' | 'red' | 'no_data' | 'no_cp' {
  if (actual === null) return 'no_data';
  if (target === null) return 'no_cp';

  const ratio = actual / target;
  const tolerance = 0.05; // 5% tolerance

  if (isLowerBetter) {
    // For fuel consumption: lower is better
    if (ratio <= 1 + tolerance) return 'green';
    if (ratio <= 1.15) return 'yellow';
    return 'red';
  } else {
    // For speed: higher is better (but meeting target is green)
    if (ratio >= 1 - tolerance) return 'green';
    if (ratio >= 0.9) return 'yellow';
    return 'red';
  }
}

/**
 * Calculate KPIs from vessel status, specs, and charter
 */
function calculateKPIs(
  vesselStatus: VesselStatus | null,
  vessel: Vessel | null,
  activeVoyage: Voyage | null,
  activeCharter: CharterParty | null
): VesselKPIs | null {
  if (!vessel) return null;

  // Speed KPI
  const actualSpeed = vesselStatus?.averageSpeedKnots ?? null;
  const targetSpeed = vessel.averageSpeedKnots ?? null;

  // Fuel Consumption KPI - use daily consumption from bunker inventory or vessel spec
  const totalDailyConsumption = vesselStatus?.bunkerInventory?.reduce(
    (sum, b) => sum + (b.consumedMt ?? 0), 0
  ) ?? null;
  const actualFuelConsumption = totalDailyConsumption && totalDailyConsumption > 0
    ? totalDailyConsumption
    : null;
  const targetFuelConsumption = vessel.fuelConsumptionMtDay ?? null;

  // Cargo Temp KPI
  const actualCargoTemp = vesselStatus?.cargoTempAvgC ?? null;
  // For gas carriers, the required temp is usually the minimum (e.g., -42°C for LPG)
  const requiredCargoTemp = vessel.minCargoTempC ?? null;

  return {
    speed: {
      actual: actualSpeed,
      target: targetSpeed,
      status: calculateKPIStatus(actualSpeed, targetSpeed, false),
    },
    fuelConsumption: {
      actual: actualFuelConsumption,
      target: targetFuelConsumption,
      status: calculateKPIStatus(actualFuelConsumption, targetFuelConsumption, true),
    },
    cargoTemp: {
      actual: actualCargoTemp,
      required: requiredCargoTemp,
      status: !activeVoyage
        ? 'no_voyage'
        : actualCargoTemp === null
          ? 'no_data'
          : requiredCargoTemp && actualCargoTemp <= requiredCargoTemp
            ? 'green'
            : 'yellow',
    },
  };
}

interface UseVesselOverviewScreenReturn {
  /** The vessel data */
  vessel: ReturnType<typeof useVesselDetails>['vessel'];
  /** The latest vessel status/position */
  vesselStatus: ReturnType<typeof useVesselDetails>['vesselStatus'];
  /** The active voyage */
  activeVoyage: Voyage | null;
  /** The active charter party */
  activeCharter: CharterParty | null;
  /** KPI performance data */
  kpis: VesselKPIs | null;
  /** Whether the screen is currently refreshing */
  refreshing: boolean;
  /** Whether required documents are missing */
  isLocked: boolean;
  /** Handler for manual refresh */
  onRefresh: () => Promise<void>;
}

/**
 * Custom hook for managing vessel overview screen state and logic.
 * 
 * Features:
 * - Automatic polling every 30 seconds
 * - Manual refresh with loading state
 * - KPI data management
 * - Document lock status
 * 
 * @returns Screen state and handlers
 */
export function useVesselOverviewScreen(): UseVesselOverviewScreenReturn {
  const {
    vessel,
    vesselStatus,
    activeVoyage,
    activeCharterParty,
    refreshVessel,
    isLocked,
  } = useVesselDetails();

  const [refreshing, setRefreshing] = useState(false);

  // Calculate KPIs from vessel status, specs, and charter
  const kpis = useMemo(
    () => calculateKPIs(vesselStatus, vessel, activeVoyage, activeCharterParty),
    [vesselStatus, vessel, activeVoyage, activeCharterParty]
  );

  // Automatic polling every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      refreshVessel();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [vessel?.id, refreshVessel]);

  // Manual refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshVessel();
    setRefreshing(false);
  }, [refreshVessel]);

  return {
    vessel,
    vesselStatus,
    activeVoyage,
    activeCharter: activeCharterParty,
    kpis,
    refreshing,
    isLocked,
    onRefresh,
  };
}
