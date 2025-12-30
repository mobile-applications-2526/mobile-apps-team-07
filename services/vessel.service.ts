/**
 * Vessel Service
 * 
 * Business logic layer for vessel operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Vessel, CreateVesselInput, Document, VesselWithStatus } from '@/types';
import * as db from '@/lib/database';
import { apiClient } from './api-client.service';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from './config.service';
import { StorageService } from './storage.service';

// ============================================
// VESSEL CRUD OPERATIONS
// ============================================

/**
 * Get all vessels (cache-first strategy)
 */
export async function getAllVessels(): Promise<Vessel[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Vessel[]>(db.CACHE_KEYS.ALL_VESSELS);

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheAllVessels().catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheAllVessels();
}

/**
 * Fetch all vessels from backend and update cache
 */
async function fetchAndCacheAllVessels(): Promise<Vessel[]> {
  const vessels = await apiClient.get<Vessel[]>('/api/vessels');

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.ALL_VESSELS, vessels);

  return vessels;
}

/**
 * Get all vessels with status (cache-first strategy)
 */
export async function getAllVesselsWithStatus(): Promise<VesselWithStatus[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VesselWithStatus[]>(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheAllVesselsWithStatus().catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheAllVesselsWithStatus();
}

/**
 * Fetch all vessels with status from backend and update cache
 */
async function fetchAndCacheAllVesselsWithStatus(): Promise<VesselWithStatus[]> {
  const vesselsWithStatus = await apiClient.get<VesselWithStatus[]>('/api/vessels/with-status');

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS, vesselsWithStatus);

  return vesselsWithStatus;
}

/**
 * Network-only fetch for vessels with status. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVesselsWithStatusNetwork(): Promise<VesselWithStatus[]> {
  const vesselsWithStatus = await apiClient.get<VesselWithStatus[]>('/api/vessels/with-status');

  // Update cache with fresh data
  await db.setCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS, vesselsWithStatus);

  return vesselsWithStatus;
}

/**
 * Get a vessel by ID (cache-first strategy)
 */
export async function getVesselById(id: number): Promise<Vessel | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Vessel>(db.CACHE_KEYS.VESSEL_BY_ID(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVesselById(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVesselById(id);
}

/**
 * Fetch a vessel by ID from backend and update cache
 */
async function fetchAndCacheVesselById(id: number): Promise<Vessel | null> {
  try {
    const vessel = await apiClient.get<Vessel>(`/api/vessels/${id}`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.VESSEL_BY_ID(id), vessel);

    return vessel;
  } catch (err) {
    return null;
  }
}

/**
 * Get a vessel with status by ID (cache-first strategy)
 */
export async function getVesselByIdWithStatus(id: number): Promise<VesselWithStatus | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VesselWithStatus>(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVesselWithStatusById(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVesselWithStatusById(id);
}

/**
 * Fetch a vessel with status by ID from backend and update cache
 */
async function fetchAndCacheVesselWithStatusById(id: number): Promise<VesselWithStatus | null> {
  try {
    const vessel = await apiClient.get<VesselWithStatus>(`/api/vessels/${id}/with-status`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id), vessel);

    return vessel;
  } catch (err) {
    return null;
  }
}

/**
 * Network-only fetch for a vessel with status by ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVesselByIdWithStatusNetwork(id: number): Promise<VesselWithStatus | null> {
  const vessel = await apiClient.get<VesselWithStatus>(`/api/vessels/${id}/with-status`);

  // Update cache with fresh data
  await db.setCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id), vessel);

  return vessel;
}

/**
 * Get a vessel by IMO number
 */
export async function getVesselByImo(imoNumber: string): Promise<any> {
  try {
    const result = await apiClient.get(`/api/vessels/imo/${imoNumber}`);
    return { ok: true, json: async () => result };
  } catch (err) {
    return { ok: false };
  }
}

/**
 * Create a new vessel
 */
export async function createVessel(input: CreateVesselInput): Promise<Vessel> {
  // Validate IMO doesn't exist
  if (await imoExists(input.imoNumber))
    throw new Error(`Vessel with IMO ${input.imoNumber} already exists`);

  const newVessel = await apiClient.post<Vessel>('/api/vessels', input);



  // Invalidate relevant caches
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);

  return newVessel;
}

/**
 * Update an existing vessel
 */
export async function updateVessel(vessel: Vessel): Promise<Vessel | null> {
  // Send full vessel object to backend for update
  try {
    const updatedVessel = await apiClient.put<Vessel>(`/api/vessels/${vessel.id}`, vessel);

    // Update caches for this vessel and invalidate aggregates so they'll be refetched
    await db.setCacheValue(db.CACHE_KEYS.VESSEL_BY_ID(vessel.id), updatedVessel);
    await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(vessel.id));
    await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
    await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);

    return updatedVessel;
  } catch (err) {
    console.error('Error updating vessel:', err);
    return null;
  }
}

/**
 * Delete a vessel
 */
export async function deleteVessel(id: number): Promise<boolean> {
  try {
    await apiClient.delete(`/api/vessels/${id}`);
    // If we got here, status was likely 2xx (204 or 200)


    // Invalidate relevant caches
    await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_BY_ID(id));
    await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id));
    await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
    await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
    await db.deleteCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(id));
    await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(id));

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Get documents by vessel ID (cache-first strategy)
 */
export async function getVesselDocuments(id: number): Promise<Document[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVesselDocuments(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVesselDocuments(id);
}

/**
 * Fetch vessel documents from backend and update cache
 */
async function fetchAndCacheVesselDocuments(id: number): Promise<Document[]> {
  const documents = await apiClient.get<Document[]>(`/api/vessels/${id}/documents`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(id), documents);

  return documents;
}

/**
 * Network-only fetch for vessel documents. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVesselDocumentsNetwork(id: number): Promise<Document[]> {
  const documents = await apiClient.get<Document[]>(`/api/vessels/${id}/documents`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(id), documents);

  return documents;
}

// ============================================
// VESSEL QUERIES
// ============================================

/**
 * Search vessels by name or IMO
 */
export async function searchVessels(query: string): Promise<Vessel[]> {
  return [];
}

/**
 * Get vessels by type
 */
export async function getVesselsByType(type: string): Promise<Vessel[]> {
  return [];
}

// ============================================
// VESSEL UTILITIES
// ============================================

/**
 * Check if an IMO number already exists
 */
export async function imoExists(imoNumber: string): Promise<boolean> {
  const exists = await getVesselByImo(imoNumber);
  return exists.ok;
}


