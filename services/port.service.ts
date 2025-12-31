/**
 * Port Service
 *
 * Business logic layer for port operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { VoyagePort, PortType } from "@/types";
import { apiClient } from "./api.client";
import * as db from '@/lib/database';

// ============================================
// TYPES
// ============================================

export interface CreatePortInput {
  portType: PortType;
  portSequence: number;
  portName: string;
  laycanStart?: string;
  laycanEnd?: string;
  eta?: string;
  etb?: string;
  atb?: string;
  etd?: string;
  atd?: string;
  norTendered?: string;
  norAccepted?: string;
  remarks?: string;
}

export interface UpdatePortInput extends Partial<CreatePortInput> {
  id: number;
}

// ============================================
// CACHE KEYS
// ============================================

const PORT_CACHE_KEYS = {
  PORTS_BY_VOYAGE: (voyageId: number) => `ports:voyage:${voyageId}`,
  PORT_BY_ID: (portId: number) => `ports:${portId}`,
};

// ============================================
// READ OPERATIONS
// ============================================

/**
 * Get all ports for a voyage (cache-first strategy)
 */
export async function getPortsByVoyageId(voyageId: number): Promise<VoyagePort[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<VoyagePort[]>(PORT_CACHE_KEYS.PORTS_BY_VOYAGE(voyageId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCachePortsByVoyageId(voyageId).catch(err =>
      console.error('Background fetch for ports failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCachePortsByVoyageId(voyageId);
}

/**
 * Fetch ports by voyage ID from backend and update cache
 */
async function fetchAndCachePortsByVoyageId(voyageId: number): Promise<VoyagePort[]> {
  try {
    const ports = await apiClient.get<VoyagePort[]>(`/api/voyages/${voyageId}/ports`);

    // Cache the result
    await db.setCacheValue(PORT_CACHE_KEYS.PORTS_BY_VOYAGE(voyageId), ports);

    return ports;
  } catch (err) {
    console.error('Failed to fetch ports:', err);
    return [];
  }
}

/**
 * Network-only fetch for ports. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchPortsByVoyageIdNetwork(voyageId: number): Promise<VoyagePort[]> {
  const ports = await apiClient.get<VoyagePort[]>(`/api/voyages/${voyageId}/ports`);

  // Update cache with fresh data
  await db.setCacheValue(PORT_CACHE_KEYS.PORTS_BY_VOYAGE(voyageId), ports);

  return ports;
}

// ============================================
// CREATE OPERATIONS
// ============================================

export interface CreatePortPayload extends CreatePortInput {
  voyageId: number;
}

/**
 * Create a new port for a voyage
 */
export async function createPort(voyageId: number, input: CreatePortInput): Promise<VoyagePort> {
  const payload: CreatePortPayload = {
    ...input,
    voyageId,
  };
  const port = await apiClient.post<VoyagePort>(`/api/voyage-ports`, payload);

  // Invalidate voyage ports cache to refetch with the new port
  await invalidatePortsCacheForVoyage(voyageId);

  return port;
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update an existing port
 */
export async function updatePort(portId: number, voyageId: number, input: Partial<CreatePortInput>): Promise<VoyagePort> {
  const port = await apiClient.put<VoyagePort>(`/api/voyage-ports/${portId}`, input);

  // Invalidate caches
  await db.deleteCacheValue(PORT_CACHE_KEYS.PORT_BY_ID(portId));
  await invalidatePortsCacheForVoyage(voyageId);

  return port;
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a port
 */
export async function deletePort(portId: number, voyageId: number): Promise<void> {
  await apiClient.delete(`/api/voyage-ports/${portId}`);

  // Invalidate caches
  await db.deleteCacheValue(PORT_CACHE_KEYS.PORT_BY_ID(portId));
  await invalidatePortsCacheForVoyage(voyageId);
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Invalidate ports cache for a voyage
 */
export async function invalidatePortsCacheForVoyage(voyageId: number): Promise<void> {
  await db.deleteCacheValue(PORT_CACHE_KEYS.PORTS_BY_VOYAGE(voyageId));
  // Also invalidate voyage details cache since it includes ports
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyageId));
}
