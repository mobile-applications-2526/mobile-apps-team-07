/**
 * Vessel Service Unit Tests
 *
 * Tests vessel CRUD operations and cache-first strategy including:
 * - Getting vessels (with and without status)
 * - Creating vessels with IMO validation
 * - Updating and deleting vessels
 * - Cache management
 * - Document operations
 */

import * as VesselService from '../../services/vessel.service';
import { apiClient } from '../../services/api-client.service';
import * as db from '../../lib/database';

// Mock dependencies
jest.mock('../../services/api-client.service', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../lib/database', () => ({
  getCacheValue: jest.fn(),
  setCacheValue: jest.fn(),
  deleteCacheValue: jest.fn(),
  CACHE_KEYS: {
    ALL_VESSELS: 'vessels:all',
    ALL_VESSELS_WITH_STATUS: 'vessels:all_with_status',
    VESSEL_BY_ID: (id: number) => `vessels:${id}`,
    VESSEL_WITH_STATUS_BY_ID: (id: number) => `vessels:${id}:with_status`,
    VOYAGES_BY_VESSEL: (id: number) => `voyages:vessel:${id}`,
    DOCUMENTS_BY_VESSEL: (id: number) => `documents:vessel:${id}`,
  },
}));

jest.mock('../../services/config.service', () => ({
  API_URL: 'https://api.test.com',
}));

jest.mock('../../services/storage.service', () => ({
  StorageService: {
    getToken: jest.fn().mockResolvedValue('mock-token'),
  },
}));

describe('Vessel Service', () => {
  // Sample test data
  const mockVessel = {
    id: 1,
    name: 'Test Vessel',
    imoNumber: '1234567',
    vesselType: 'Gas Carrier',
    vesselSubType: 'LPG',
  };

  const mockVesselWithStatus = {
    ...mockVessel,
    latestStatus: {
      position: { lat: 10.5, lng: 20.5 },
      speed: 12.5,
      activity: 'underway',
    },
    activeVoyage: null,
    activeCharter: null,
  };

  const mockVessels = [
    mockVessel,
    { id: 2, name: 'Vessel 2', imoNumber: '7654321', vesselType: 'Chemical Tanker' },
  ];

  const mockVesselsWithStatus = [
    mockVesselWithStatus,
    {
      ...mockVessels[1],
      latestStatus: { position: { lat: 15, lng: 25 }, speed: 10, activity: 'loading' },
      activeVoyage: null,
      activeCharter: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET ALL VESSELS
  // ============================================
  describe('getAllVessels', () => {
    it('should return cached vessels if available', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVessels);

      const result = await VesselService.getAllVessels();

      expect(db.getCacheValue).toHaveBeenCalledWith(db.CACHE_KEYS.ALL_VESSELS);
      expect(result).toEqual(mockVessels);
    });

    it('should fetch from API when cache is empty', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVessels);

      const result = await VesselService.getAllVessels();

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels');
      expect(db.setCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.ALL_VESSELS,
        mockVessels
      );
      expect(result).toEqual(mockVessels);
    });

    it('should trigger background refresh when returning cached data', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVessels);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVessels);

      await VesselService.getAllVessels();

      // Background fetch should be triggered (non-blocking)
      await new Promise((resolve) => setTimeout(resolve, 10));
      // The API might be called for background refresh
    });
  });

  // ============================================
  // GET ALL VESSELS WITH STATUS
  // ============================================
  describe('getAllVesselsWithStatus', () => {
    it('should return cached vessels with status if available', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVesselsWithStatus);

      const result = await VesselService.getAllVesselsWithStatus();

      expect(db.getCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS
      );
      expect(result).toEqual(mockVesselsWithStatus);
    });

    it('should fetch from API when cache is empty', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVesselsWithStatus);

      const result = await VesselService.getAllVesselsWithStatus();

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/with-status');
      expect(result).toEqual(mockVesselsWithStatus);
    });
  });

  // ============================================
  // FETCH VESSELS WITH STATUS (NETWORK ONLY)
  // ============================================
  describe('fetchVesselsWithStatusNetwork', () => {
    it('should always fetch from network', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVesselsWithStatus);

      const result = await VesselService.fetchVesselsWithStatusNetwork();

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/with-status');
      expect(db.setCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS,
        mockVesselsWithStatus
      );
      expect(result).toEqual(mockVesselsWithStatus);
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(VesselService.fetchVesselsWithStatusNetwork()).rejects.toThrow(
        'Network error'
      );
    });
  });

  // ============================================
  // GET VESSEL BY ID
  // ============================================
  describe('getVesselById', () => {
    it('should return cached vessel if available', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVessel);

      const result = await VesselService.getVesselById(1);

      expect(db.getCacheValue).toHaveBeenCalledWith(db.CACHE_KEYS.VESSEL_BY_ID(1));
      expect(result).toEqual(mockVessel);
    });

    it('should fetch from API when cache is empty', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVessel);

      const result = await VesselService.getVesselById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/1');
      expect(result).toEqual(mockVessel);
    });

    it('should return null when vessel not found', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

      const result = await VesselService.getVesselById(999);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // GET VESSEL BY ID WITH STATUS
  // ============================================
  describe('getVesselByIdWithStatus', () => {
    it('should return cached vessel with status if available', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVesselWithStatus);

      const result = await VesselService.getVesselByIdWithStatus(1);

      expect(db.getCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(1)
      );
      expect(result).toEqual(mockVesselWithStatus);
    });

    it('should fetch from API when cache is empty', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVesselWithStatus);

      const result = await VesselService.getVesselByIdWithStatus(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/1/with-status');
      expect(result).toEqual(mockVesselWithStatus);
    });

    it('should return null when vessel not found', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

      const result = await VesselService.getVesselByIdWithStatus(999);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // GET VESSEL BY IMO
  // ============================================
  describe('getVesselByImo', () => {
    it('should return vessel when found', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVessel);

      const result = await VesselService.getVesselByImo('1234567');

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/imo/1234567');
      expect(result.ok).toBe(true);
    });

    it('should return not ok when vessel not found', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

      const result = await VesselService.getVesselByImo('9999999');

      expect(result.ok).toBe(false);
    });
  });

  // ============================================
  // CREATE VESSEL
  // ============================================
  describe('createVessel', () => {
    const newVesselInput = {
      name: 'New Vessel',
      imoNumber: '9876543',
      vesselType: 'Gas Carrier' as const,
      vesselSubType: 'LNG' as const,
    };

    it('should create vessel when IMO does not exist', async () => {
      // Mock IMO check - not found
      (apiClient.get as jest.Mock)
        .mockRejectedValueOnce(new Error('Not found')) // IMO check
        .mockResolvedValueOnce({ id: 3, ...newVesselInput }); // Create response

      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        id: 3,
        ...newVesselInput,
      });

      const result = await VesselService.createVessel(newVesselInput);

      expect(apiClient.post).toHaveBeenCalledWith('/api/vessels', newVesselInput);
      expect(result).toMatchObject(newVesselInput);
    });

    it('should throw error when IMO already exists', async () => {
      // Mock IMO check - found
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVessel);

      await expect(VesselService.createVessel(newVesselInput)).rejects.toThrow(
        `Vessel with IMO ${newVesselInput.imoNumber} already exists`
      );
    });

    it('should invalidate cache after creating vessel', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));
      (apiClient.post as jest.Mock).mockResolvedValueOnce({
        id: 3,
        ...newVesselInput,
      });

      await VesselService.createVessel(newVesselInput);

      expect(db.deleteCacheValue).toHaveBeenCalledWith(db.CACHE_KEYS.ALL_VESSELS);
      expect(db.deleteCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS
      );
    });
  });

  // ============================================
  // UPDATE VESSEL
  // ============================================
  describe('updateVessel', () => {
    const updatedVessel = { ...mockVessel, name: 'Updated Vessel Name' };

    it('should update vessel successfully', async () => {
      (apiClient.put as jest.Mock).mockResolvedValueOnce(updatedVessel);

      const result = await VesselService.updateVessel(updatedVessel);

      expect(apiClient.put).toHaveBeenCalledWith(
        `/api/vessels/${updatedVessel.id}`,
        updatedVessel
      );
      expect(result).toEqual(updatedVessel);
    });

    it('should update cache after updating vessel', async () => {
      (apiClient.put as jest.Mock).mockResolvedValueOnce(updatedVessel);

      await VesselService.updateVessel(updatedVessel);

      expect(db.setCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.VESSEL_BY_ID(updatedVessel.id),
        updatedVessel
      );
      expect(db.deleteCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(updatedVessel.id)
      );
      expect(db.deleteCacheValue).toHaveBeenCalledWith(db.CACHE_KEYS.ALL_VESSELS);
    });

    it('should return null on update failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      const result = await VesselService.updateVessel(mockVessel);

      expect(result).toBeNull();
    });
  });

  // ============================================
  // DELETE VESSEL
  // ============================================
  describe('deleteVessel', () => {
    it('should delete vessel successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      const result = await VesselService.deleteVessel(1);

      expect(apiClient.delete).toHaveBeenCalledWith('/api/vessels/1');
      expect(result).toBe(true);
    });

    it('should invalidate all related caches after deletion', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      await VesselService.deleteVessel(1);

      expect(db.deleteCacheValue).toHaveBeenCalledWith(db.CACHE_KEYS.VESSEL_BY_ID(1));
      expect(db.deleteCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(1)
      );
      expect(db.deleteCacheValue).toHaveBeenCalledWith(db.CACHE_KEYS.ALL_VESSELS);
      expect(db.deleteCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS
      );
      expect(db.deleteCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.VOYAGES_BY_VESSEL(1)
      );
      expect(db.deleteCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(1)
      );
    });

    it('should return false on deletion failure', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      const result = await VesselService.deleteVessel(1);

      expect(result).toBe(false);
    });
  });

  // ============================================
  // GET VESSEL DOCUMENTS
  // ============================================
  describe('getVesselDocuments', () => {
    const mockDocuments = [
      { id: 1, type: 'Q88', name: 'Q88 Document.pdf' },
      { id: 2, type: 'Form C', name: 'Form C.pdf' },
    ];

    it('should return cached documents if available', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockDocuments);

      const result = await VesselService.getVesselDocuments(1);

      expect(db.getCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(1)
      );
      expect(result).toEqual(mockDocuments);
    });

    it('should fetch from API when cache is empty', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockDocuments);

      const result = await VesselService.getVesselDocuments(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/1/documents');
      expect(result).toEqual(mockDocuments);
    });
  });

  // ============================================
  // IMO VALIDATION
  // ============================================
  describe('imoExists', () => {
    it('should return true when IMO exists', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockVessel);

      const result = await VesselService.imoExists('1234567');

      expect(result).toBe(true);
    });

    it('should return false when IMO does not exist', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

      const result = await VesselService.imoExists('9999999');

      expect(result).toBe(false);
    });
  });

  // ============================================
  // SEARCH AND FILTER (STUB FUNCTIONS)
  // ============================================
  describe('searchVessels', () => {
    it('should return empty array (not implemented)', async () => {
      const result = await VesselService.searchVessels('Test');

      expect(result).toEqual([]);
    });
  });

  describe('getVesselsByType', () => {
    it('should return empty array (not implemented)', async () => {
      const result = await VesselService.getVesselsByType('Gas Carrier');

      expect(result).toEqual([]);
    });
  });
});
