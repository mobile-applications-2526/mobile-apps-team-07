/**
 * Noon Report Service
 * 
 * Business logic layer for noon report operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { VesselStatus } from "@/types";
import { apiClient } from "./api.client";
import * as db from '@/lib/database';

/**
 * Get latest noon report by vessel ID (cache-first strategy)
 */
export async function getLatestNoonReportByVesselId(vesselId: number): Promise<VesselStatus | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VesselStatus>(db.CACHE_KEYS.LATEST_NOON_REPORT(vesselId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheLatestNoonReport(vesselId).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheLatestNoonReport(vesselId);
}

/**
 * Get latest noon report by vessel ID (cache-first strategy)
 */
export async function getNoonReportsByVoyageId(voyageId: number): Promise<VesselStatus[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VesselStatus[]>(db.CACHE_KEYS.VOYAGE_NOON_REPORTS(voyageId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheLatestNoonReport(voyageId).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVoyageNoonReports(voyageId);
}

/**
 * Fetch latest noon report from backend and update cache
 */
async function fetchAndCacheLatestNoonReport(vesselId: number): Promise<VesselStatus | null> {
  try {
    const noonReport = await apiClient.get<VesselStatus>(`/api/vessels/${vesselId}/noon-reports/latest`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.LATEST_NOON_REPORT(vesselId), noonReport);

    return noonReport;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch voyage noon reports from backend and update cache
 */
async function fetchAndCacheVoyageNoonReports(voyageId: number): Promise<VesselStatus[]> {
  try {
    const noonReports = await apiClient.get<VesselStatus[]>(`/api/voyages/${voyageId}/noon-reports`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.VOYAGE_NOON_REPORTS(voyageId), noonReports);

    return noonReports;
  } catch (err) {
    return [];
  }
}

// Cache key for vessel status reports
const VESSEL_STATUS_REPORTS_CACHE_KEY = (vesselId: number) => `vessel_status_reports_${vesselId}`;

/**
 * Get all status reports for a vessel (cache-first strategy)
 * Uses the /api/vessel-status/vessel/{vesselId} endpoint
 */
export async function getVesselStatusReports(vesselId: number): Promise<VesselStatus[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VesselStatus[]>(VESSEL_STATUS_REPORTS_CACHE_KEY(vesselId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVesselStatusReports(vesselId).catch(err =>
      console.error('Background fetch for vessel status reports failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVesselStatusReports(vesselId);
}

/**
 * Fetch vessel status reports from backend and update cache
 */
async function fetchAndCacheVesselStatusReports(vesselId: number): Promise<VesselStatus[]> {
  try {
    const statusReports = await apiClient.get<VesselStatus[]>(`/api/vessel-status/vessel/${vesselId}`);

    // Cache the result
    await db.setCacheValue(VESSEL_STATUS_REPORTS_CACHE_KEY(vesselId), statusReports);

    return statusReports;
  } catch (err) {
    return [];
  }
}

/**
 * Get status reports for a specific voyage
 * Uses the /api/vessel-status/voyage/{voyageId} endpoint
 */
export async function getVoyageStatusReports(voyageId: number): Promise<VesselStatus[]> {
  try {
    return await apiClient.get<VesselStatus[]>(`/api/vessel-status/voyage/${voyageId}`);
  } catch (err) {
    return [];
  }
}

/**
 * Network-only fetch for vessel status reports. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVesselStatusReportsNetwork(vesselId: number): Promise<VesselStatus[]> {
  const statusReports = await apiClient.get<VesselStatus[]>(`/api/vessel-status/vessel/${vesselId}`);

  // Update cache with fresh data
  await db.setCacheValue(VESSEL_STATUS_REPORTS_CACHE_KEY(vesselId), statusReports);

  return statusReports;
}

/**
 * Invalidate status reports cache for a vessel
 */
export async function invalidateVesselStatusCache(vesselId: number): Promise<void> {
  await db.deleteCacheValue(VESSEL_STATUS_REPORTS_CACHE_KEY(vesselId));
  await db.deleteCacheValue(db.CACHE_KEYS.LATEST_NOON_REPORT(vesselId));
}
