/**
 * Noon Report Service
 * 
 * Business logic layer for noon report operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { NoonReport } from "@/types";
import { API_URL } from ".";
import * as db from '@/lib/database';

/**
 * Get latest noon report by vessel ID (cache-first strategy)
 */
export async function getLatestNoonReportByVesselId(vesselId: number): Promise<NoonReport | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<NoonReport>(db.CACHE_KEYS.LATEST_NOON_REPORT(vesselId));
  
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
 * Fetch latest noon report from backend and update cache
 */
async function fetchAndCacheLatestNoonReport(vesselId: number): Promise<NoonReport | null> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/noon-reports/latest`);
  if (!response.ok) return null;
  
  const noonReport = await response.json();
  
  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.LATEST_NOON_REPORT(vesselId), noonReport);
  
  return noonReport;
}
