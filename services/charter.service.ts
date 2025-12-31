/**
 * Charter Service
 *
 * Business logic layer for charter operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { CharterParty } from "@/types";
import { apiClient } from "./api.client";
import * as db from '@/lib/database';

// Cache keys for charter data
const CHARTER_CACHE_KEYS = {
  ACTIVE_CHARTER: (vesselId: number) => `charter_active_${vesselId}`,
  VESSEL_CHARTERS: (vesselId: number) => `charters_vessel_${vesselId}`,
  CHARTER_BY_ID: (charterId: number) => `charter_${charterId}`,
};

/**
 * Get active charter for a vessel (cache-first strategy)
 */
export async function getActiveCharter(vesselId: number): Promise<CharterParty | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<CharterParty>(CHARTER_CACHE_KEYS.ACTIVE_CHARTER(vesselId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheActiveCharter(vesselId).catch(err =>
      console.error('Background fetch for active charter failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheActiveCharter(vesselId);
}

/**
 * Fetch active charter from backend and update cache
 */
async function fetchAndCacheActiveCharter(vesselId: number): Promise<CharterParty | null> {
  try {
    const charter = await apiClient.get<CharterParty>(`/api/vessels/${vesselId}/charters/active`);

    // Cache the result
    await db.setCacheValue(CHARTER_CACHE_KEYS.ACTIVE_CHARTER(vesselId), charter);

    return charter;
  } catch (err) {
    return null;
  }
}

/**
 * Get all charters for a vessel (cache-first strategy)
 */
export async function getVesselCharters(vesselId: number): Promise<CharterParty[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<CharterParty[]>(CHARTER_CACHE_KEYS.VESSEL_CHARTERS(vesselId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVesselCharters(vesselId).catch(err =>
      console.error('Background fetch for vessel charters failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVesselCharters(vesselId);
}

/**
 * Fetch vessel charters from backend and update cache
 */
async function fetchAndCacheVesselCharters(vesselId: number): Promise<CharterParty[]> {
  try {
    const charters = await apiClient.get<CharterParty[]>(`/api/vessels/${vesselId}/charters`);

    // Cache the result
    await db.setCacheValue(CHARTER_CACHE_KEYS.VESSEL_CHARTERS(vesselId), charters);

    return charters;
  } catch (err) {
    return [];
  }
}

/**
 * Network-only fetch for active charter. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchActiveCharterNetwork(vesselId: number): Promise<CharterParty | null> {
  const charter = await apiClient.get<CharterParty>(`/api/vessels/${vesselId}/charters/active`);

  // Update cache with fresh data
  await db.setCacheValue(CHARTER_CACHE_KEYS.ACTIVE_CHARTER(vesselId), charter);

  return charter;
}

/**
 * Network-only fetch for vessel charters. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVesselChartersNetwork(vesselId: number): Promise<CharterParty[]> {
  const charters = await apiClient.get<CharterParty[]>(`/api/vessels/${vesselId}/charters`);

  // Update cache with fresh data
  await db.setCacheValue(CHARTER_CACHE_KEYS.VESSEL_CHARTERS(vesselId), charters);

  return charters;
}

/**
 * Invalidate all charter caches for a vessel
 */
export async function invalidateCharterCaches(vesselId: number): Promise<void> {
  await db.deleteCacheValue(CHARTER_CACHE_KEYS.ACTIVE_CHARTER(vesselId));
  await db.deleteCacheValue(CHARTER_CACHE_KEYS.VESSEL_CHARTERS(vesselId));
}
