/**
 * Cargo Service
 * 
 * Business logic layer for cargo operations.
 * Handles data transformation and orchestration between the Server, Cache, and UI.
 * Implements cache-first strategy: load from cache immediately, then fetch from backend and update cache.
 */

import { Document, Cargo } from "@/types";
import { apiClient } from "./api-client.service";
import * as db from '@/lib/database';

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
 * Fetch cargoes by vessel ID from backend and update cache
 */
async function fetchAndCacheCargoesByVoyageId(voyageId: number): Promise<Cargo[]> {
  const cargoes = await apiClient.get<Cargo[]>(`/api/cargoes/cargo/${voyageId}`);

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
 * Network-only fetch for cargoes by vessel ID. Does not return cached data.
 * Throws on network error / non-ok response.
 */
export async function fetchCargoesByVoyageIdNetwork(voyageId: number): Promise<Cargo[]> {
  const cargoes = await apiClient.get<Cargo[]>(`/api/cargoes/cargo/${voyageId}`);

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
