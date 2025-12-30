/**
 * Voyage Service
 * 
 * Business logic layer for voyage operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Document, Voyage, VoyageWithDetails } from "@/types";
import { apiClient } from "./api.client";
import * as db from '@/lib/database';

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
