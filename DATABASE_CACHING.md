# Safarban Database Caching Implementation

## Overview

This document describes the local database caching system implemented in the Safarban React Native application. The caching layer acts as an intermediate storage between the app and the backend API, providing:

- **Instant data loading** from local cache
- **Offline capability** with stale data
- **Automatic background updates** from the backend
- **Cache invalidation** on mutations

## Architecture

### Cache-First Strategy

The app implements a **cache-first** approach:

1. **Initial Load**: Check local cache first
2. **Return Cached Data**: If available, show immediately to user
3. **Background Fetch**: Simultaneously fetch fresh data from backend
4. **Silent Update**: Update cache and UI with fresh data when available
5. **No Cache Fallback**: If no cache exists, fetch from backend (blocking)

### Key Components

```
┌─────────────────────────────────────────────────────────┐
│                     React Native App                     │
│  ┌────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  UI Layer  │  │  Services   │  │  Cache (SQLite) │  │
│  │ (Context)  │─▶│  (API +     │─▶│  (database.ts)  │  │
│  │            │  │   Caching)  │  │                 │  │
│  └────────────┘  └─────────────┘  └─────────────────┘  │
│                         │                                │
│                         ▼                                │
│                  ┌──────────────┐                        │
│                  │ Backend API  │                        │
│                  │ (Spring Boot)│                        │
│                  └──────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

## Implementation Details

### Database Schema

The cache uses a simple key-value store in SQLite:

```sql
CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,              -- JSON stringified data
  cachedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  expiresAt TEXT                    -- Optional expiration
);
```

### Core Files

#### 1. `lib/database.ts`
Core database operations providing generic caching functions:

- `getDatabase()` - Initialize and get DB instance
- `setCacheValue<T>(key, value)` - Store data as JSON
- `getCacheValue<T>(key)` - Retrieve and parse data
- `deleteCacheValue(key)` - Invalidate cache entry
- `clearAllCache()` - Clear all cached data
- `CACHE_KEYS` - Centralized cache key definitions

#### 2. `services/database.service.ts`
Higher-level database management:

- `initializeDatabase()` - Setup on app start
- `resetDatabase()` - Dev/testing utility
- `clearAllCache()` - Clear all cached data
- `getCacheAge(key)` - Check cache freshness
- `isCacheStale(key, minutes)` - Staleness check

#### 3. Service Layer Integration

All services (`vessel.service.ts`, `voyage.service.ts`, `noonReport.service.ts`) implement:

**Public API** (cache-first):
```typescript
export async function getAllVessels(): Promise<Vessel[]> {
  // 1. Try cache first
  const cached = await db.getCacheValue<Vessel[]>(db.CACHE_KEYS.ALL_VESSELS);
  
  // 2. Return cached immediately
  if (cached) {
    // 3. Fetch fresh in background
    fetchAndCacheAllVessels().catch(console.error);
    return cached;
  }
  
  // 4. No cache, fetch blocking
  return await fetchAndCacheAllVessels();
}
```

**Private Fetcher** (backend + cache):
```typescript
async function fetchAndCacheAllVessels(): Promise<Vessel[]> {
  const response = await fetch(`${API_URL}/api/vessels`);
  const vessels = await response.json();
  
  // Update cache
  await db.setCacheValue(db.CACHE_KEYS.ALL_VESSELS, vessels);
  
  return vessels;
}
```

### Cache Keys Structure

Standardized cache keys for consistency:

```typescript
CACHE_KEYS = {
  // Vessels
  ALL_VESSELS: 'vessels:all',
  ALL_VESSELS_WITH_STATUS: 'vessels:all_with_status',
  VESSEL_BY_ID: (id) => `vessels:${id}`,
  VESSEL_WITH_STATUS_BY_ID: (id) => `vessels:${id}:with_status`,
  
  // Voyages
  VOYAGES_BY_VESSEL: (vesselId) => `voyages:vessel:${vesselId}`,
  VOYAGE_BY_ID: (id) => `voyages:${id}`,
  
  // Documents
  DOCUMENTS_BY_VESSEL: (vesselId) => `documents:vessel:${vesselId}`,
  
  // Noon Reports
  LATEST_NOON_REPORT: (vesselId) => `noon_reports:vessel:${vesselId}:latest`,
}
```

## Cache Invalidation Strategy

### On Mutations

When data is modified, affected caches are invalidated:

**Create Vessel:**
```typescript
// Invalidate list caches
await db.deleteCacheValue(CACHE_KEYS.ALL_VESSELS);
await db.deleteCacheValue(CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
```

**Delete Vessel:**
```typescript
// Invalidate all vessel-related caches
await db.deleteCacheValue(CACHE_KEYS.VESSEL_BY_ID(id));
await db.deleteCacheValue(CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id));
await db.deleteCacheValue(CACHE_KEYS.ALL_VESSELS);
await db.deleteCacheValue(CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
await db.deleteCacheValue(CACHE_KEYS.VOYAGES_BY_VESSEL(id));
await db.deleteCacheValue(CACHE_KEYS.DOCUMENTS_BY_VESSEL(id));
```

### Expiration (Optional)

Caches can have automatic expiration:

```typescript
// Cache for 30 minutes
await db.setCacheValue(key, data, 30);

// Auto-cleanup on get
const cached = await db.getCacheValue(key); // null if expired
```

## User Experience Flow

### Cold Start (No Cache)
```
1. App opens → Database initializes
2. User opens vessel list → Shows loading
3. Fetch from backend → Display vessels
4. Cache stored for next time
```

### Warm Start (With Cache)
```
1. App opens → Database initializes
2. User opens vessel list → Instant display from cache
3. Background fetch from backend → Silent update
4. Fresh data replaces cached (if different)
```

### Offline Mode
```
1. App opens → Database initializes
2. User opens vessel list → Shows cached data
3. Background fetch fails → User still sees stale data
4. Connection restored → Next background fetch succeeds
```

## Benefits

✅ **Instant Loading** - Cached data shows immediately  
✅ **Better UX** - No loading spinners for repeat views  
✅ **Offline Support** - Works without connection (stale data)  
✅ **Reduced Backend Load** - Fewer API calls  
✅ **Always Fresh** - Background updates ensure accuracy  
✅ **Simple Implementation** - Generic key-value store  
✅ **Type Safe** - TypeScript generics preserve types  

## Maintenance

### Clear Cache (Dev/Testing)
```typescript
import { databaseService } from '@/services';

// Clear all cache
await databaseService.clearAllCache();

// Reset database completely
await databaseService.resetDatabase();
```

### Monitor Cache
```typescript
import * as db from '@/lib/database';

// Check cache age
const age = await databaseService.getCacheAge(db.CACHE_KEYS.ALL_VESSELS);
console.log(`Cache is ${age}ms old`);

// Check if stale (> 5 minutes)
const isStale = await databaseService.isCacheStale(
  db.CACHE_KEYS.ALL_VESSELS, 
  5
);
```

## Future Enhancements

- [ ] Automatic cache expiration policies
- [ ] Cache size management (LRU eviction)
- [ ] Sync status indicators in UI
- [ ] Retry logic for failed background fetches
- [ ] Cache warmup strategies
- [ ] Compression for large datasets
- [ ] Differential updates (delta sync)

## Testing

### Test Cache Behavior
```typescript
// 1. Clear cache
await databaseService.clearAllCache();

// 2. First load (should hit backend)
const vessels1 = await vesselService.getAllVessels();

// 3. Second load (should use cache)
const vessels2 = await vesselService.getAllVessels(); // Instant!

// 4. Check cache exists
const cached = await db.getCacheValue(db.CACHE_KEYS.ALL_VESSELS);
console.log('Cached:', cached !== null);
```

## Migration from Old Version

The new caching system replaces the old database implementation from `Safarban_with_database`. Key differences:

### Old Approach
- ❌ Stored dummy data in SQLite as source of truth
- ❌ Required data migration and seeding
- ❌ Complex schema with multiple tables
- ❌ No backend integration

### New Approach
- ✅ Backend is source of truth
- ✅ SQLite is cache only
- ✅ Simple key-value schema
- ✅ Full backend integration
- ✅ Automatic updates from backend
- ✅ No dummy data needed

## Dependencies

- `expo-sqlite` (v16.0.10) - SQLite database for React Native/Expo

## Support

For issues or questions about the caching implementation, refer to:
- `lib/database.ts` - Core cache operations
- `services/database.service.ts` - Database management
- Service files - Integration examples
