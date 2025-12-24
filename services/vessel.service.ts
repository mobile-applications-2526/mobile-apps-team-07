/**
 * Vessel Service
 * 
 * Business logic layer for vessel operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Vessel, CreateVesselInput, Document, VesselWithStatus } from '@/types';
import { API_URL } from '.';
import * as db from '@/lib/database';

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
  const response = await fetch(`${API_URL}/api/vessels`);
  const vessels = await response.json();
  
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
  const response = await fetch(`${API_URL}/api/vessels/with-status`);
  const vesselsWithStatus = await response.json();
  
  // Cache the result
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
  const response = await fetch(`${API_URL}/api/vessels/${id}`);
  if (!response.ok) return null;
  
  const vessel = await response.json();
  
  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VESSEL_BY_ID(id), vessel);
  
  return vessel;
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
  const response = await fetch(`${API_URL}/api/vessels/${id}/with-status`);
  if (!response.ok) return null;
  
  const vessel = await response.json();
  
  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id), vessel);
  
  return vessel;
}

/**
 * Get a vessel by IMO number
 */
export async function getVesselByImo(imoNumber: string): Promise<Response> {
  const response = await fetch(`${API_URL}/api/vessels/imo/${imoNumber}`);
  return response;
}

/**
 * Create a new vessel
 */
export async function createVessel(input: CreateVesselInput): Promise<Vessel> {
  // Validate IMO doesn't exist
  if (await imoExists(input.imoNumber)) 
    throw new Error(`Vessel with IMO ${input.imoNumber} already exists`);
  
  const response = await fetch(`${API_URL}/api/vessels`, {
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });
  
  const newVessel = await response.json();
  
  // Invalidate relevant caches
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
  
  return newVessel;
}

/**
 * Update an existing vessel
 */
export async function updateVessel(vessel: Vessel): Promise<Vessel | null> {
  // TODO: Implement update logic when backend endpoint is ready
  // For now, invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_BY_ID(vessel.id));
  await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(vessel.id));
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
  
  return null;
}

/**
 * Delete a vessel
 */
export async function deleteVessel(id: number): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/vessels/${id}`, {
    method: "DELETE"
  });
  
  if (response.status === 204) {
    // Invalidate relevant caches
    await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_BY_ID(id));
    await db.deleteCacheValue(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id));
    await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
    await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
    await db.deleteCacheValue(db.CACHE_KEYS.VOYAGES_BY_VESSEL(id));
    await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(id));
    
    return true;
  }
  
  return false;
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
  const response = await fetch(`${API_URL}/api/vessels/${id}/documents`);
  const documents = await response.json();
  
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
