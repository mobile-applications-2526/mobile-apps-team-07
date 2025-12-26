/**
 * Voyage Service
 * 
 * Business logic layer for voyage operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Voyage, VoyageWithDetails } from "@/types";
import { API_URL } from "./config";
import * as db from '@/lib/database';

/**
 * Get all voyages (with basic caching)
 */
export async function getAllVoyages(): Promise<Voyage[]> {
  const response = await fetch(`${API_URL}/api/voyages`);
  return await response.json();
}

/**
 * Get voyage by ID (cache-first strategy)
 */
export async function getVoyageById(id: number): Promise<Voyage | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Voyage>(db.CACHE_KEYS.VOYAGE_BY_ID(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVoyageById(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVoyageById(id);
}

/**
 * Get voyage by ID (cache-first strategy)
 */
export async function getVoyageDetailsById(id: number): Promise<VoyageWithDetails | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VoyageWithDetails>(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVoyageById(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVoyageDetailsById(id);
}

/**
 * Fetch voyage by ID from backend and update cache
 */
async function fetchAndCacheVoyageById(id: number): Promise<Voyage | null> {
  const response = await fetch(`${API_URL}/api/voyages/${id}`);
  if (!response.ok) return null;

  const voyage = await response.json();

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGE_BY_ID(id), voyage);

  return voyage;
}

/**
 * Fetch voyage by ID from backend and update cache
 */
async function fetchAndCacheVoyageDetailsById(id: number): Promise<VoyageWithDetails | null> {
  const response = await fetch(`${API_URL}/api/voyages/${id}/details`);
  if (!response.ok) return null;

  const voyage = await response.json();

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(id), voyage);

  return voyage;
}

/**
 * Get voyages by vessel ID (cache-first strategy)
 */
export async function getVoyagesByVesselId(vesselId: number): Promise<Voyage[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Voyage[]>(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVoyagesByVesselId(vesselId).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVoyagesByVesselId(vesselId);
}

/**
 * Fetch voyages by vessel ID from backend and update cache
 */
async function fetchAndCacheVoyagesByVesselId(vesselId: number): Promise<Voyage[]> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/voyages`);
  const voyages = await response.json();

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId), voyages);

  return voyages;
}

/**
 * Network-only fetch for voyages by vessel ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVoyagesByVesselIdNetwork(vesselId: number): Promise<Voyage[]> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/voyages`);
  if (!response.ok) throw new Error(`Failed to fetch voyages: ${response.status}`);

  const voyages = await response.json();

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId), voyages);

  return voyages;
}

/**
 * Network-only fetch for voyage details by ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVoyageDetailsByIdNetwork(id: number): Promise<VoyageWithDetails | null> {
  const response = await fetch(`${API_URL}/api/voyages/${id}/details`);
  if (!response.ok) throw new Error(`Failed to fetch voyage details: ${response.status}`);

  const voyage_details = await response.json();

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(id), voyage_details);

  return voyage_details;
}
