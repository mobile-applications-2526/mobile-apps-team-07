/**
 * Voyage Service
 *
 * Business logic layer for voyage operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Document, Voyage, VoyageWithDetails, VoyageStatus, PortType } from "@/types";
import { apiClient } from "./api.client";
import * as db from '@/lib/database';

// ============================================
// TYPES
// ============================================

export interface CreateVoyagePortInput {
  portType: PortType;
  portSequence: number;
  portName: string;
  laycanStart?: string;
  laycanEnd?: string;
}

export interface CreateVoyageCargoInput {
  cargoType: string;
  nominatedQuantityMt: number;
  requiredTempC?: number;
  unNumber?: string;
  imoClass?: string;
}

export interface CreateVoyageInput {
  vesselId: number;
  voyageNumber: string;
  voyageStatus: VoyageStatus;
  charterPartyId?: number;
  loadPorts: CreateVoyagePortInput[];
  dischargePorts: CreateVoyagePortInput[];
  cargo: CreateVoyageCargoInput;
  voyageStartDate: string;
  voyageEndDate?: string;
  voyageInstructions?: string;
  remarks?: string;
}

export interface UpdateVoyageInput {
  voyageNumber?: string;
  voyageStatus?: VoyageStatus;
  voyageStartDate?: string;
  voyageEndDate?: string;
  voyageInstructions?: string;
  remarks?: string;
}

/**
 * Get all voyages (with basic caching)
 */
export async function getAllVoyages(): Promise<Voyage[]> {
  return await apiClient.get<Voyage[]>('/api/voyages');
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

/*
 * Get voyage documents by ID (cache-first strategy)
 */
export async function getVoyageDocuments(id: number): Promise<Document[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheVoyageDocuments(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheVoyageDocuments(id);
}

/**
 * Fetch voyage by ID from backend and update cache
 */
async function fetchAndCacheVoyageById(id: number): Promise<Voyage | null> {
  try {
    const voyage = await apiClient.get<Voyage>(`/api/voyages/${id}`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.VOYAGE_BY_ID(id), voyage);

    return voyage;
  } catch (err) {
    return null;
  }

}

/**
 * Fetch voyage by ID from backend and update cache
 */
async function fetchAndCacheVoyageDetailsById(id: number): Promise<VoyageWithDetails | null> {
  try {
    const voyage = await apiClient.get<VoyageWithDetails>(`/api/voyages/${id}/details`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(id), voyage);

    return voyage;
  } catch (err) {
    return null;
  }

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
  const voyages = await apiClient.get<Voyage[]>(`/api/vessels/${vesselId}/voyages`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId), voyages);

  return voyages;
}

/**
 * Fetch voyages by vessel ID from backend and update cache
 */
async function fetchAndCacheVoyageDocuments(voyageId: number): Promise<Document[]> {
  const documents = await apiClient.get<Document[]>(`/api/voyages/${voyageId}/documents`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(voyageId), documents);

  return documents;
}

/**
 * Network-only fetch for voyages by vessel ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVoyagesByVesselIdNetwork(vesselId: number): Promise<Voyage[]> {
  const voyages = await apiClient.get<Voyage[]>(`/api/vessels/${vesselId}/voyages`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId), voyages);

  return voyages;
}

/**
 * Network-only fetch for voyage details by ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVoyageDetailsByIdNetwork(id: number): Promise<VoyageWithDetails | null> {
  const voyage_details = await apiClient.get<VoyageWithDetails>(`/api/voyages/${id}/details`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(id), voyage_details);

  return voyage_details;
}

/**
 * Network-only fetch for voyage documents. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchVoyageDocumentsNetwork(id: number): Promise<Document[]> {
  const documents = await apiClient.get<Document[]>(`/api/voyages/${id}/documents`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(id), documents);

  return documents;
}

// ============================================
// CREATE OPERATIONS
// ============================================

/**
 * Create a new voyage for a vessel
 */
export async function createVoyage(input: CreateVoyageInput): Promise<Voyage> {
  const voyage = await apiClient.post<Voyage>(`/api/voyages`, input);

  // Invalidate vessel voyages cache to refetch with the new voyage
  await invalidateVoyagesCacheForVessel(input.vesselId);

  return voyage;
}

/**
 * Commence (start) a voyage
 */
export async function commenceVoyage(voyageId: number, vesselId: number): Promise<Voyage> {
  const voyage = await apiClient.post<Voyage>(`/api/voyages/${voyageId}/commence`, {});

  // Invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_BY_ID(voyageId));
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyageId));
  await invalidateVoyagesCacheForVessel(vesselId);

  return voyage;
}

/**
 * Complete a voyage
 */
export async function completeVoyage(voyageId: number, vesselId: number): Promise<Voyage> {
  const voyage = await apiClient.post<Voyage>(`/api/voyages/${voyageId}/complete`, {});

  // Invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_BY_ID(voyageId));
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyageId));
  await invalidateVoyagesCacheForVessel(vesselId);

  return voyage;
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update an existing voyage
 */
export async function updateVoyage(voyageId: number, vesselId: number, input: UpdateVoyageInput): Promise<Voyage> {
  const voyage = await apiClient.put<Voyage>(`/api/voyages/${voyageId}`, input);

  // Invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_BY_ID(voyageId));
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyageId));
  await invalidateVoyagesCacheForVessel(vesselId);

  return voyage;
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a voyage
 */
export async function deleteVoyage(voyageId: number, vesselId: number): Promise<void> {
  await apiClient.delete(`/api/voyages/${voyageId}`);

  // Invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_BY_ID(voyageId));
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyageId));
  await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(voyageId));
  await invalidateVoyagesCacheForVessel(vesselId);
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Invalidate voyages cache for a vessel
 */
export async function invalidateVoyagesCacheForVessel(vesselId: number): Promise<void> {
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId));
}
