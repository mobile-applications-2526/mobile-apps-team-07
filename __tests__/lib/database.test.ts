/**
 * Database (Cache) Module Unit Tests
 *
 * Tests SQLite cache operations including:
 * - Setting cache values
 * - Getting cache values
 * - Deleting cache values
 * - Cache expiration
 * - Cache keys
 */

import * as db from '../../lib/database';
import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite
const mockDatabase = {
  execAsync: jest.fn(),
  runAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  getAllAsync: jest.fn(),
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  }),
}));

describe('Database Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the internal db reference by re-mocking
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDatabase);
  });

  // ============================================
  // CACHE KEYS
  // ============================================
  describe('CACHE_KEYS', () => {
    it('should generate correct ALL_VESSELS key', () => {
      expect(db.CACHE_KEYS.ALL_VESSELS).toBe('vessels:all');
    });

    it('should generate correct ALL_VESSELS_WITH_STATUS key', () => {
      expect(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS).toBe('vessels:all_with_status');
    });

    it('should generate correct VESSEL_BY_ID key', () => {
      expect(db.CACHE_KEYS.VESSEL_BY_ID(1)).toBe('vessels:1');
      expect(db.CACHE_KEYS.VESSEL_BY_ID(123)).toBe('vessels:123');
    });

    it('should generate correct VESSEL_WITH_STATUS_BY_ID key', () => {
      expect(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(1)).toBe('vessels:1:with_status');
      expect(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(42)).toBe('vessels:42:with_status');
    });

    it('should generate correct VOYAGES_BY_VESSEL key', () => {
      expect(db.CACHE_KEYS.VOYAGES_BY_VESSEL(1)).toBe('voyages:vessel:1');
    });

    it('should generate correct VOYAGE_DETAILS_BY_ID key', () => {
      expect(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(5)).toBe('voyages:details:5');
    });

    it('should generate correct VOYAGE_BY_ID key', () => {
      expect(db.CACHE_KEYS.VOYAGE_BY_ID(10)).toBe('voyages:10');
    });

    it('should generate correct CARGOES_BY_VOYAGE key', () => {
      expect(db.CACHE_KEYS.CARGOES_BY_VOYAGE(3)).toBe('cargoes:voyage:3');
    });

    it('should generate correct CARGO_BY_ID key', () => {
      expect(db.CACHE_KEYS.CARGO_BY_ID(7)).toBe('cargoes:7');
    });

    it('should generate correct DOCUMENTS_BY_VESSEL key', () => {
      expect(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(1)).toBe('documents:vessel:1');
    });

    it('should generate correct DOCUMENTS_BY_VOYAGE key', () => {
      expect(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(2)).toBe('documents:voyage:2');
    });

    it('should generate correct DOCUMENTS_BY_CARGO key', () => {
      expect(db.CACHE_KEYS.DOCUMENTS_BY_CARGO(3)).toBe('documents:cargoes:3');
    });

    it('should generate correct INVOICES_BY_VESSEL key', () => {
      expect(db.CACHE_KEYS.INVOICES_BY_VESSEL(1)).toBe('invoices:vessel:1');
    });

    it('should generate correct LATEST_NOON_REPORT key', () => {
      expect(db.CACHE_KEYS.LATEST_NOON_REPORT(1)).toBe('noon_reports:vessel:1:latest');
    });

    it('should generate correct VOYAGE_NOON_REPORTS key', () => {
      expect(db.CACHE_KEYS.VOYAGE_NOON_REPORTS(5)).toBe('noon_reports:voyage:5');
    });

    it('should generate correct LAST_SYNC key', () => {
      expect(db.CACHE_KEYS.LAST_SYNC).toBe('metadata:last_sync');
    });
  });

  // ============================================
  // GET DATABASE
  // ============================================
  describe('getDatabase', () => {
    it('should create database if not exists', async () => {
      await db.getDatabase();

      expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('safarban.db');
    });

    it('should return same instance on subsequent calls', async () => {
      const db1 = await db.getDatabase();
      const db2 = await db.getDatabase();

      // openDatabaseAsync should only be called once (cached)
      expect(db1).toBeDefined();
      expect(db2).toBeDefined();
    });
  });

  // ============================================
  // SET CACHE VALUE
  // ============================================
  describe('setCacheValue', () => {
    it('should store value as JSON', async () => {
      const testData = { id: 1, name: 'Test' };

      await db.setCacheValue('test:key', testData);

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR REPLACE'),
        expect.arrayContaining(['test:key', JSON.stringify(testData)])
      );
    });

    it('should store array values', async () => {
      const testArray = [1, 2, 3];

      await db.setCacheValue('test:array', testArray);

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([JSON.stringify(testArray)])
      );
    });

    it('should store with expiration time', async () => {
      const testData = { id: 1 };

      await db.setCacheValue('test:expiring', testData, 60);

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          'test:expiring',
          JSON.stringify(testData),
          expect.any(String), // cachedAt
          expect.any(String), // expiresAt
        ])
      );
    });

    it('should store with null expiration when not specified', async () => {
      const testData = { id: 1 };

      await db.setCacheValue('test:no-expiry', testData);

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([null]) // expiresAt should be null
      );
    });
  });

  // ============================================
  // GET CACHE VALUE
  // ============================================
  describe('getCacheValue', () => {
    it('should return parsed JSON value', async () => {
      const storedData = { id: 1, name: 'Test' };
      mockDatabase.getFirstAsync.mockResolvedValueOnce({
        value: JSON.stringify(storedData),
        expiresAt: null,
      });

      const result = await db.getCacheValue('test:key');

      expect(result).toEqual(storedData);
    });

    it('should return null for non-existent key', async () => {
      mockDatabase.getFirstAsync.mockResolvedValueOnce(null);

      const result = await db.getCacheValue('non:existent');

      expect(result).toBeNull();
    });

    it('should return null for expired cache', async () => {
      const pastDate = new Date(Date.now() - 10000).toISOString();
      mockDatabase.getFirstAsync.mockResolvedValueOnce({
        value: JSON.stringify({ id: 1 }),
        expiresAt: pastDate,
      });

      const result = await db.getCacheValue('test:expired');

      expect(result).toBeNull();
    });

    it('should return value for non-expired cache', async () => {
      const futureDate = new Date(Date.now() + 100000).toISOString();
      const data = { id: 1 };
      mockDatabase.getFirstAsync.mockResolvedValueOnce({
        value: JSON.stringify(data),
        expiresAt: futureDate,
      });

      const result = await db.getCacheValue('test:valid');

      expect(result).toEqual(data);
    });

    it('should return null for invalid JSON', async () => {
      mockDatabase.getFirstAsync.mockResolvedValueOnce({
        value: 'not valid json',
        expiresAt: null,
      });

      const result = await db.getCacheValue('test:invalid');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // DELETE CACHE VALUE
  // ============================================
  describe('deleteCacheValue', () => {
    it('should delete cache by key', async () => {
      await db.deleteCacheValue('test:key');

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cache'),
        ['test:key']
      );
    });
  });

  // ============================================
  // CLEAR ALL CACHE
  // ============================================
  describe('clearAllCache', () => {
    it('should delete all cache entries', async () => {
      await db.clearAllCache();

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cache')
      );
    });
  });

  // ============================================
  // CLEAR EXPIRED CACHE
  // ============================================
  describe('clearExpiredCache', () => {
    it('should delete expired cache entries', async () => {
      await db.clearExpiredCache();

      expect(mockDatabase.runAsync).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cache WHERE expiresAt'),
        expect.arrayContaining([expect.any(String)])
      );
    });
  });

  // ============================================
  // GET CACHE METADATA
  // ============================================
  describe('getCacheMetadata', () => {
    it('should return cache metadata', async () => {
      const cachedAt = new Date().toISOString();
      mockDatabase.getFirstAsync.mockResolvedValueOnce({ cachedAt });

      const result = await db.getCacheMetadata('test:key');

      expect(result).toEqual({ cachedAt });
    });

    it('should return null for non-existent key', async () => {
      mockDatabase.getFirstAsync.mockResolvedValueOnce(null);

      const result = await db.getCacheMetadata('non:existent');

      expect(result).toBeNull();
    });
  });

  // ============================================
  // RESET DATABASE
  // ============================================
  describe('resetDatabase', () => {
    it('should drop and recreate cache table', async () => {
      await db.resetDatabase();

      expect(mockDatabase.execAsync).toHaveBeenCalledWith(
        expect.stringContaining('DROP TABLE IF EXISTS cache')
      );
    });
  });
});
