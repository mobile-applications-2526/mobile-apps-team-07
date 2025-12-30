/**
 * Database Module
 * 
 * Core SQLite database operations for local caching.
 * Acts as a cache layer between the React Native app and the backend API.
 * Stores data as JSON strings for simplicity and flexibility.
 */

import * as SQLite from 'expo-sqlite';

// Database instance
let db: SQLite.SQLiteDatabase | null = null;

// Database version for migrations
const DB_VERSION = 1;

// ============================================
// DATABASE INITIALIZATION
// ============================================

/**
 * Get or create database instance
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('safarban.db');
    await initializeDatabase();
  }
  return db;
}

/**
 * Initialize database tables for caching
 * Using simple key-value store with JSON for flexibility
 */
async function initializeDatabase(): Promise<void> {
  if (!db) return;

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    
    -- Simple cache table storing data as JSON
    CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      cachedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      expiresAt TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expiresAt);
  `);
}

/**
 * Reset database (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('safarban.db');
  }

  await db.execAsync(`DROP TABLE IF EXISTS cache;`);
  await initializeDatabase();
  console.log('Database cache reset complete');
}

// ============================================
// GENERIC CACHE OPERATIONS
// ============================================

/**
 * Set a cache value
 */
export async function setCacheValue<T>(key: string, value: T, expiresInMinutes?: number): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  const expiresAt = expiresInMinutes
    ? new Date(Date.now() + expiresInMinutes * 60 * 1000).toISOString()
    : null;

  await database.runAsync(
    `INSERT OR REPLACE INTO cache (key, value, cachedAt, expiresAt) VALUES (?, ?, ?, ?)`,
    [key, JSON.stringify(value), now, expiresAt]
  );
}

/**
 * Get a cache value
 */
export async function getCacheValue<T>(key: string): Promise<T | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ value: string; expiresAt: string | null }>(
    'SELECT value, expiresAt FROM cache WHERE key = ?',
    [key]
  );

  if (!row) return null;

  // Check if expired
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
    await deleteCacheValue(key);
    return null;
  }

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

/**
 * Delete a cache value
 */
export async function deleteCacheValue(key: string): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cache WHERE key = ?', [key]);
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM cache');
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache(): Promise<void> {
  const database = await getDatabase();
  const now = new Date().toISOString();
  await database.runAsync('DELETE FROM cache WHERE expiresAt IS NOT NULL AND expiresAt < ?', [now]);
}

/**
 * Get cache metadata (when it was last updated)
 */
export async function getCacheMetadata(key: string): Promise<{ cachedAt: string } | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<{ cachedAt: string }>(
    'SELECT cachedAt FROM cache WHERE key = ?',
    [key]
  );
  return row || null;
}

// ============================================
// SPECIALIZED CACHE KEYS FOR THE APP
// ============================================

export const CACHE_KEYS = {
  // Vessel caches
  ALL_VESSELS: 'vessels:all',
  ALL_VESSELS_WITH_STATUS: 'vessels:all_with_status',
  VESSEL_BY_ID: (id: number) => `vessels:${id}`,
  VESSEL_WITH_STATUS_BY_ID: (id: number) => `vessels:${id}:with_status`,

  // Voyage caches
  VOYAGES_BY_VESSEL: (vesselId: number) => `voyages:vessel:${vesselId}`,
  VOYAGE_DETAILS_BY_ID: (id: number) => `voyages:details:${id}`,
  VOYAGE_BY_ID: (id: number) => `voyages:${id}`,

  // Cargo caches
  CARGOES_BY_VOYAGE: (voyageId: number) => `cargoes:voyage:${voyageId}`,
  CARGO_BY_ID: (id: number) => `cargoes:${id}`,

  // Document caches
  DOCUMENTS_BY_VESSEL: (vesselId: number) => `documents:vessel:${vesselId}`,
  DOCUMENTS_BY_VOYAGE: (voyageId: number) => `documents:voyage:${voyageId}`,
  DOCUMENTS_BY_CARGO: (cargoId: number) => `documents:cargoes:${cargoId}`,
  INVOICES_BY_VESSEL: (vesselId: number) => `invoices:vessel:${vesselId}`,

  // Noon report caches
  LATEST_NOON_REPORT: (vesselId: number) => `noon_reports:vessel:${vesselId}:latest`,
  VOYAGE_NOON_REPORTS: (voyageId: number) => `noon_reports:voyage:${voyageId}`,

  // Metadata
  LAST_SYNC: 'metadata:last_sync',
};
