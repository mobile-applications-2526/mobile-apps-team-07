/**
 * Database Service
 * 
 * Handles database initialization and provides a clean API for caching operations.
 * Integrates caching with backend API calls.
 */

import * as db from '@/lib/database';

/**
 * Initialize the database
 */
export async function initializeDatabase(): Promise<void> {
  await db.getDatabase();
  
  // Clear any expired cache on startup
  await db.clearExpiredCache();
  
  console.log('Database initialized and ready');
}

/**
 * Reset the database (for development/testing)
 */
export async function resetDatabase(): Promise<void> {
  await db.resetDatabase();
  console.log('Database reset complete');
}

/**
 * Clear all cached data
 */
export async function clearAllCache(): Promise<void> {
  await db.clearAllCache();
  console.log('All cache cleared');
}

/**
 * Get cache metadata to check when data was last updated
 */
export async function getCacheAge(key: string): Promise<number | null> {
  const metadata = await db.getCacheMetadata(key);
  if (!metadata) return null;
  
  const cachedAt = new Date(metadata.cachedAt);
  const now = new Date();
  return now.getTime() - cachedAt.getTime();
}

/**
 * Check if cache is stale (older than specified minutes)
 */
export async function isCacheStale(key: string, staleAfterMinutes: number = 5): Promise<boolean> {
  const age = await getCacheAge(key);
  if (age === null) return true; // No cache = stale
  
  return age > staleAfterMinutes * 60 * 1000;
}
