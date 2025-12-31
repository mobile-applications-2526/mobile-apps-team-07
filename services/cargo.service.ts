/**
 * Cargo Service
 *
 * Business logic layer for cargo operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Document, Cargo } from "@/types";
import { apiClient } from "./api.client";
import * as db from '@/lib/database';

// ============================================
// TYPES
// ============================================

export interface CreateCargoInput {
  cargoType: string;
  nominatedQuantityMt: number;
  requiredTempC?: number;
  blQuantityMt?: number;
  shoreQuantityMt?: number;
  shipQuantityMt?: number;
  apiGravity?: number;
  density15c?: number;
  sulphurPct?: number;
  waterContentPct?: number;
  unNumber?: string;
  imoClass?: string;
  loadingInstructions?: string;
  dischargeInstructions?: string;
  chartererName?: string;
  receiverName?: string;
}

export interface UpdateCargoInput extends Partial<CreateCargoInput> {}

/**
 * Get all cargoes (with basic caching)
 */
export async function getAllCargoes(): Promise<Cargo[]> {
  return await apiClient.get<Cargo[]>('/api/cargoes');
}

/**
 * Get cargo by ID (cache-first strategy)
 */
export async function getCargoById(id: number): Promise<Cargo | null> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Cargo>(db.CACHE_KEYS.CARGO_BY_ID(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheCargoById(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheCargoById(id);
}

/*
 * Get cargo documents by ID (cache-first strategy)
 */
export async function getCargoDocuments(id: number): Promise<Document[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_CARGO(id));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheCargoDocuments(id).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheCargoDocuments(id);
}

/**
 * Fetch cargo by ID from backend and update cache
 */
async function fetchAndCacheCargoById(id: number): Promise<Cargo | null> {
  try {
    const cargo = await apiClient.get<Cargo>(`/api/cargoes/${id}`);

    // Cache the result
    await db.setCacheValue(db.CACHE_KEYS.CARGO_BY_ID(id), cargo);

    return cargo;
  } catch (err) {
    return null;
  }
}

/**
 * Get cargoes by vessel ID (cache-first strategy)
 */
export async function getCargoesByVoyageId(voyageId: number): Promise<Cargo[]> {
  // Try to get from cache first
  const cached = await db.getCacheValue<Cargo[]>(db.CACHE_KEYS.CARGOES_BY_VOYAGE(voyageId));

  // Return cached data immediately if available
  if (cached) {
    // Fetch fresh data in background and update cache
    fetchAndCacheCargoesByVoyageId(voyageId).catch(err =>
      console.error('Background fetch failed:', err)
    );
    return cached;
  }

  // No cache, fetch from backend
  return await fetchAndCacheCargoesByVoyageId(voyageId);
}

/**
 * Fetch cargoes by voyage ID from backend and update cache
 */
async function fetchAndCacheCargoesByVoyageId(voyageId: number): Promise<Cargo[]> {
  const cargoes = await apiClient.get<Cargo[]>(`/api/cargoes/voyage/${voyageId}`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.CARGOES_BY_VOYAGE(voyageId), cargoes);

  return cargoes;
}

/**
 * Fetch cargoes by vessel ID from backend and update cache
 */
async function fetchAndCacheCargoDocuments(id: number): Promise<Document[]> {
  const documents = await apiClient.get<Document[]>(`/api/cargoes/${id}/documents`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_CARGO(id), documents);

  return documents;
}

/**
 * Network-only fetch for cargoes by voyage ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchCargoesByVoyageIdNetwork(voyageId: number): Promise<Cargo[]> {
  const cargoes = await apiClient.get<Cargo[]>(`/api/cargoes/voyage/${voyageId}`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.CARGOES_BY_VOYAGE(voyageId), cargoes);

  return cargoes;
}

/**
 * Network-only fetch for cargo documents. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchCargoDocumentsNetwork(id: number): Promise<Document[]> {
  const documents = await apiClient.get<Document[]>(`/api/cargoes/${id}/documents`);

  // Cache the result
  await db.setCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_CARGO(id), documents);

  return documents;
}

// ============================================
// CREATE OPERATIONS
// ============================================

export interface CreateCargoPayload extends CreateCargoInput {
  voyageId: number;
}

/**
 * Create a new cargo for a voyage
 */
export async function createCargo(voyageId: number, input: CreateCargoInput): Promise<Cargo> {
  const payload: CreateCargoPayload = {
    ...input,
    voyageId,
  };
  const cargo = await apiClient.post<Cargo>(`/api/cargoes`, payload);

  // Invalidate voyage cargoes cache to refetch with the new cargo
  await invalidateCargoesCacheForVoyage(voyageId);

  return cargo;
}

// ============================================
// UPDATE OPERATIONS
// ============================================

/**
 * Update an existing cargo
 */
export async function updateCargo(cargoId: number, voyageId: number, input: UpdateCargoInput): Promise<Cargo> {
  const cargo = await apiClient.put<Cargo>(`/api/cargoes/${cargoId}`, input);

  // Invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.CARGO_BY_ID(cargoId));
  await invalidateCargoesCacheForVoyage(voyageId);

  return cargo;
}

// ============================================
// DELETE OPERATIONS
// ============================================

/**
 * Delete a cargo
 */
export async function deleteCargo(cargoId: number, voyageId: number): Promise<void> {
  await apiClient.delete(`/api/cargoes/${cargoId}`);

  // Invalidate caches
  await db.deleteCacheValue(db.CACHE_KEYS.CARGO_BY_ID(cargoId));
  await db.deleteCacheValue(db.CACHE_KEYS.DOCUMENTS_BY_CARGO(cargoId));
  await invalidateCargoesCacheForVoyage(voyageId);
}

// ============================================
// CACHE MANAGEMENT
// ============================================

/**
 * Invalidate cargoes cache for a voyage
 */
export async function invalidateCargoesCacheForVoyage(voyageId: number): Promise<void> {
  await db.deleteCacheValue(db.CACHE_KEYS.CARGOES_BY_VOYAGE(voyageId));
  // Also invalidate voyage details cache since it includes cargoes
  await db.deleteCacheValue(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyageId));
}
