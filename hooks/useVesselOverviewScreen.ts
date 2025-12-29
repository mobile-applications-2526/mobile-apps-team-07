/**
 * useVesselOverviewScreen Hook
 * 
 * Business logic for the Vessel Overview screen.
 * Handles polling, refresh state, and KPI data management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useVesselDetails } from '@/hooks';
import type { VesselKPIs } from '@/types';

interface UseVesselOverviewScreenReturn {
  /** The vessel data */
  vessel: ReturnType<typeof useVesselDetails>['vessel'];
  /** The latest vessel status/position */
  vesselStatus: ReturnType<typeof useVesselDetails>['vesselStatus'];
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
    refreshVessel,
    isLocked,
  } = useVesselDetails();
  
  const [refreshing, setRefreshing] = useState(false);
  const [kpis, setKPIs] = useState<VesselKPIs | null>(null);

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
    kpis,
    refreshing,
    isLocked,
    onRefresh,
  };
}
