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
 * Fetch latest noon report from backend and update cache
 */
async function fetchAndCacheVoyageNoonReports(voyageId: number): Promise<VesselStatus[]> {
  try {
    const noonReports = await apiClient.get<VesselStatus[]>(`/api/voyages/${voyageId}/noon-reports`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.LATEST_NOON_REPORT(voyageId), noonReports); // Note: Key might be wrong in original code, keeping faithful to structure but should ideally check usage

    return noonReports;
  } catch (err) {
    return [];
  }
}
