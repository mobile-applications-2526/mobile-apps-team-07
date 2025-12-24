/**
 * Cache Usage Examples
 * 
 * This file demonstrates how to use the caching system in various scenarios.
 */

import { vesselService, voyageService, databaseService } from '@/services';
import * as db from '@/lib/database';

// ============================================
// BASIC USAGE - Services handle caching automatically
// ============================================

async function loadVesselListExample() {
  // This automatically:
  // 1. Checks cache first
  // 2. Returns cached data immediately if available
  // 3. Fetches fresh data in background
  // 4. Updates cache silently
  const vessels = await vesselService.getAllVessels();
  
  console.log('Vessels loaded (possibly from cache):', vessels.length);
  // User sees data instantly!
}

async function loadVesselDetailsExample(vesselId: number) {
  // Same cache-first strategy for individual vessels
  const vessel = await vesselService.getVesselById(vesselId);
  
  console.log('Vessel loaded:', vessel?.vesselName);
  // Instant display from cache, silent background update
}

// ============================================
// CHECKING CACHE STATE
// ============================================

async function checkCacheStatusExample() {
  // Check if data is cached
  const cached = await db.getCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  console.log('Has cached vessels:', cached !== null);
  
  // Check cache age
  const age = await databaseService.getCacheAge(db.CACHE_KEYS.ALL_VESSELS);
  if (age !== null) {
    console.log(`Cache is ${Math.round(age / 1000)} seconds old`);
  }
  
  // Check if cache is stale (older than 5 minutes)
  const isStale = await databaseService.isCacheStale(
    db.CACHE_KEYS.ALL_VESSELS,
    5 // minutes
  );
  console.log('Cache is stale:', isStale);
}

// ============================================
// MANUAL CACHE MANAGEMENT
// ============================================

async function clearCacheExample() {
  // Clear specific cache entry
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  console.log('Vessel list cache cleared');
  
  // Clear all cache
  await databaseService.clearAllCache();
  console.log('All cache cleared');
}

async function forceRefreshExample() {
  // Force refresh by clearing cache first
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  
  // Next call will fetch from backend (blocking)
  const vessels = await vesselService.getAllVessels();
  console.log('Fresh data loaded:', vessels.length);
}

// ============================================
// CUSTOM CACHING (Advanced)
// ============================================

async function customCacheExample() {
  // Store custom data with expiration
  const customData = { myData: 'value' };
  await db.setCacheValue('my:custom:key', customData, 60); // expires in 60 minutes
  
  // Retrieve custom data
  const retrieved = await db.getCacheValue<{ myData: string }>('my:custom:key');
  console.log('Custom data:', retrieved);
  
  // Clean up
  await db.deleteCacheValue('my:custom:key');
}

// ============================================
// HANDLING MUTATIONS
// ============================================

async function createVesselExample() {
  // When creating/updating/deleting, services automatically invalidate cache
  const newVessel = await vesselService.createVessel({
    vesselName: 'New Vessel',
    imoNumber: '1234567',
    vesselType: 'Gas Carrier',
    vesselSubtype: 'LPG',
    vesselPictureUrl: null,
  });
  
  // Cache is automatically invalidated, next fetch will be fresh
  console.log('Created vessel:', newVessel.vesselName);
}

// ============================================
// OFFLINE BEHAVIOR
// ============================================

async function offlineExample() {
  try {
    // Try to load vessels
    const vessels = await vesselService.getAllVessels();
    
    // If cache exists, user sees data even offline
    console.log('Loaded vessels (might be stale):', vessels.length);
    
    // Background fetch will fail silently if offline
    // User continues seeing cached data
  } catch (error) {
    console.error('Failed to load:', error);
    // This only happens if NO cache exists AND offline
  }
}

// ============================================
// REFRESH PATTERNS
// ============================================

async function pullToRefreshExample() {
  // User pulls to refresh
  
  // Option 1: Just call service (it will update cache in background)
  await vesselService.getAllVessels();
  
  // Option 2: Force fresh data by clearing cache first
  await db.deleteCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  await vesselService.getAllVessels();
}

async function periodicRefreshExample() {
  // Refresh every 5 minutes
  setInterval(async () => {
    // Just calling the service triggers background update
    await vesselService.getAllVessels();
    console.log('Background refresh complete');
  }, 5 * 60 * 1000);
}

// ============================================
// DEBUGGING
// ============================================

async function debugCacheExample() {
  // List all cache keys (would need to implement getAllCacheKeys)
  const allVessels = await db.getCacheValue(db.CACHE_KEYS.ALL_VESSELS);
  const allVesselsWithStatus = await db.getCacheValue(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
  
  console.log('Cache contents:');
  console.log('- All Vessels:', allVessels ? 'CACHED' : 'NOT CACHED');
  console.log('- Vessels with Status:', allVesselsWithStatus ? 'CACHED' : 'NOT CACHED');
  
  // Check database file size (would need native module)
  // const dbPath = await db.getDatabase().then(d => d.databasePath);
  // console.log('Database path:', dbPath);
}

// ============================================
// TESTING UTILITIES
// ============================================

export const CacheTestUtils = {
  /**
   * Clear everything for clean test state
   */
  async clearAll() {
    await databaseService.clearAllCache();
  },
  
  /**
   * Pre-populate cache for testing
   */
  async seedCache() {
    const mockVessels = [
      { id: 1, vesselName: 'Test Vessel 1', /* ... */ },
      { id: 2, vesselName: 'Test Vessel 2', /* ... */ },
    ];
    await db.setCacheValue(db.CACHE_KEYS.ALL_VESSELS, mockVessels);
  },
  
  /**
   * Verify cache hit
   */
  async verifyCacheHit(key: string): Promise<boolean> {
    const cached = await db.getCacheValue(key);
    return cached !== null;
  },
  
  /**
   * Get cache age in seconds
   */
  async getCacheAgeSeconds(key: string): Promise<number | null> {
    const age = await databaseService.getCacheAge(key);
    return age !== null ? Math.round(age / 1000) : null;
  },
};
