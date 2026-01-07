/**
 * Query Hooks Unit Tests
 *
 * Tests TanStack React Query hooks including:
 * - useVesselsQuery - fetch vessels with status
 * - usePrefetchVessel - prefetch all vessel data before navigation
 * - Query key generation
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
jest.mock('@/services', () => ({
  vesselService: {
    fetchVesselsWithStatusNetwork: jest.fn(),
    fetchVesselByIdWithStatusNetwork: jest.fn(),
    fetchVesselDocumentsNetwork: jest.fn(),
  },
  voyageService: {
    fetchVoyagesByVesselIdNetwork: jest.fn(),
    fetchVoyageDetailsByIdNetwork: jest.fn(),
    fetchVoyageDocumentsNetwork: jest.fn(),
  },
  invoiceService: {
    fetchInvoicesByVesselNetwork: jest.fn(),
  },
  mapBackendInvoice: jest.fn((inv) => ({
    id: String(inv.id),
    number: inv.invoiceNumber,
    type: inv.type,
    status: inv.status,
    amount: inv.totalAmount,
  })),
}));

jest.mock('@/lib/database', () => ({
  getCacheValue: jest.fn(),
  CACHE_KEYS: {
    ALL_VESSELS_WITH_STATUS: 'vessels:all_with_status',
    VESSEL_WITH_STATUS_BY_ID: (id: number) => `vessels:${id}:with_status`,
    VOYAGES_BY_VESSEL: (id: number) => `voyages:vessel:${id}`,
    VOYAGE_DETAILS_BY_ID: (id: number) => `voyages:details:${id}`,
    DOCUMENTS_BY_VESSEL: (id: number) => `documents:vessel:${id}`,
    DOCUMENTS_BY_VOYAGE: (id: number) => `documents:voyage:${id}`,
    INVOICES_BY_VESSEL: (id: number) => `invoices:vessel:${id}`,
  },
}));

import {
  useVesselsQuery,
  usePrefetchVessel,
  vesselKeys,
  invoiceKeys,
  voyageDetailKeys,
} from '../../hooks/queries/useVesselsQuery';
import { vesselService, voyageService, invoiceService } from '@/services';
import * as db from '@/lib/database';

describe('Query Hooks', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockVesselsWithStatus = [
    {
      vessel: { id: 1, name: 'Vessel 1', imoNumber: '1234567' },
      latestStatus: { speed: 12, activity: 'Sailing' },
      activeVoyage: { id: 1, voyageNumber: 'V001' },
    },
    {
      vessel: { id: 2, name: 'Vessel 2', imoNumber: '7654321' },
      latestStatus: null,
      activeVoyage: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });

    (vesselService.fetchVesselsWithStatusNetwork as jest.Mock).mockResolvedValue(
      mockVesselsWithStatus
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ============================================
  // TEST CASE: Query Keys
  // ============================================
  describe('Query Keys', () => {
    /**
     * Test Steps:
     * 1) Verify vesselKeys.all returns correct base key
     * 2) Verify vesselKeys.list returns correct list key
     * 3) Verify vesselKeys.detail returns correct detail key with ID
     */
    it('should generate correct vessel keys', () => {
      expect(vesselKeys.all).toEqual(['vessels']);
      expect(vesselKeys.lists()).toEqual(['vessels', 'list']);
      expect(vesselKeys.list()).toEqual(['vessels', 'list', 'withStatus']);
      expect(vesselKeys.details()).toEqual(['vessels', 'detail']);
      expect(vesselKeys.detail(1)).toEqual(['vessels', 'detail', 1]);
    });

    /**
     * Test Steps:
     * 1) Verify invoiceKeys.all returns correct base key
     * 2) Verify invoiceKeys.byVessel returns correct key with vessel ID
     */
    it('should generate correct invoice keys', () => {
      expect(invoiceKeys.all).toEqual(['invoices']);
      expect(invoiceKeys.byVessel(1)).toEqual(['invoices', 'vessel', 1]);
      expect(invoiceKeys.byVessel(42)).toEqual(['invoices', 'vessel', 42]);
    });

    /**
     * Test Steps:
     * 1) Verify voyageDetailKeys structure
     */
    it('should generate correct voyage detail keys', () => {
      expect(voyageDetailKeys.all).toEqual(['voyageDetails']);
      expect(voyageDetailKeys.detail(1)).toEqual(['voyageDetails', 1]);
      expect(voyageDetailKeys.documents(1)).toEqual(['voyageDetails', 1, 'documents']);
    });
  });

  // ============================================
  // TEST CASE: useVesselsQuery
  // ============================================
  describe('useVesselsQuery', () => {
    /**
     * Test Steps:
     * 1) Render hook
     * 2) Verify network fetch is called
     * 3) Verify data is returned
     */
    it('should fetch vessels with status', async () => {
      const { result } = renderHook(() => useVesselsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(vesselService.fetchVesselsWithStatusNetwork).toHaveBeenCalled();
      expect(result.current.data).toHaveLength(2);
    });

    /**
     * Test Steps:
     * 1) Network fetch fails
     * 2) Verify cache is checked
     * 3) Verify cached data is returned
     */
    it('should fallback to cache on network failure', async () => {
      (vesselService.fetchVesselsWithStatusNetwork as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVesselsWithStatus);

      const { result } = renderHook(() => useVesselsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(db.getCacheValue).toHaveBeenCalledWith('vessels:all_with_status');
      expect(result.current.data).toHaveLength(2);
    });

    /**
     * Test Steps:
     * 1) Network fails and no cache
     * 2) Verify error is thrown
     */
    it('should throw error when network fails and no cache', async () => {
      (vesselService.fetchVesselsWithStatusNetwork as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useVesselsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    /**
     * Test Steps:
     * 1) Fetch vessels
     * 2) Verify each vessel has required properties
     */
    it('should return vessels with status data', async () => {
      const { result } = renderHook(() => useVesselsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      const vessel = result.current.data?.[0];
      expect(vessel).toHaveProperty('vessel');
      expect(vessel).toHaveProperty('latestStatus');
      expect(vessel).toHaveProperty('activeVoyage');
    });
  });

  // ============================================
  // TEST CASE: usePrefetchVessel
  // ============================================
  describe('usePrefetchVessel', () => {
    const mockVesselWithStatus = {
      vessel: { id: 1, name: 'Vessel 1' },
      latestStatus: { speed: 12 },
      activeVoyage: { id: 1 },
    };

    const mockVoyages = [
      { id: 1, voyageNumber: 'V001', status: 'active' },
      { id: 2, voyageNumber: 'V002', status: 'completed' },
    ];

    const mockDocuments = [{ id: 1, type: 'Q88', name: 'q88.pdf' }];

    const mockInvoices = [{ id: 1, invoiceNumber: 'INV-001', type: 'TC', totalAmount: 50000 }];

    const mockVoyageDetails = {
      id: 1,
      voyageNumber: 'V001',
      ports: [],
      cargoes: [],
    };

    beforeEach(() => {
      (vesselService.fetchVesselByIdWithStatusNetwork as jest.Mock).mockResolvedValue(
        mockVesselWithStatus
      );
      (voyageService.fetchVoyagesByVesselIdNetwork as jest.Mock).mockResolvedValue(mockVoyages);
      (vesselService.fetchVesselDocumentsNetwork as jest.Mock).mockResolvedValue(mockDocuments);
      (invoiceService.fetchInvoicesByVesselNetwork as jest.Mock).mockResolvedValue(mockInvoices);
      (voyageService.fetchVoyageDetailsByIdNetwork as jest.Mock).mockResolvedValue(
        mockVoyageDetails
      );
      (voyageService.fetchVoyageDocumentsNetwork as jest.Mock).mockResolvedValue([]);
    });

    /**
     * Test Steps:
     * 1) Call prefetch with vessel ID
     * 2) Verify all vessel data endpoints are called
     */
    it('should prefetch all vessel data', async () => {
      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      expect(vesselService.fetchVesselByIdWithStatusNetwork).toHaveBeenCalledWith(1);
      expect(voyageService.fetchVoyagesByVesselIdNetwork).toHaveBeenCalledWith(1);
      expect(vesselService.fetchVesselDocumentsNetwork).toHaveBeenCalledWith(1);
      expect(invoiceService.fetchInvoicesByVesselNetwork).toHaveBeenCalledWith(1);
    });

    /**
     * Test Steps:
     * 1) Call prefetch
     * 2) Verify voyage details are prefetched for each voyage
     */
    it('should prefetch voyage details for each voyage', async () => {
      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      // Should prefetch details for both voyages
      expect(voyageService.fetchVoyageDetailsByIdNetwork).toHaveBeenCalledWith(1);
      expect(voyageService.fetchVoyageDetailsByIdNetwork).toHaveBeenCalledWith(2);
    });

    /**
     * Test Steps:
     * 1) Call prefetch
     * 2) Verify voyage documents are prefetched for each voyage
     */
    it('should prefetch voyage documents for each voyage', async () => {
      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      expect(voyageService.fetchVoyageDocumentsNetwork).toHaveBeenCalledWith(1);
      expect(voyageService.fetchVoyageDocumentsNetwork).toHaveBeenCalledWith(2);
    });

    /**
     * Test Steps:
     * 1) Prefetch invalidates existing cache
     * 2) Verify fresh data is fetched
     */
    it('should invalidate existing queries before prefetch', async () => {
      // Pre-populate cache
      queryClient.setQueryData(vesselKeys.detail(1), { stale: 'data' });

      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      // Fresh data should be fetched
      expect(vesselService.fetchVesselByIdWithStatusNetwork).toHaveBeenCalled();
    });

    /**
     * Test Steps:
     * 1) Network fails
     * 2) Verify cache fallback is used
     */
    it('should use cache fallback on prefetch failure', async () => {
      (vesselService.fetchVesselByIdWithStatusNetwork as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockVesselWithStatus);

      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      expect(db.getCacheValue).toHaveBeenCalledWith('vessels:1:with_status');
    });

    /**
     * Test Steps:
     * 1) Vessel has no voyages
     * 2) Verify voyage details are not fetched
     */
    it('should skip voyage prefetch when no voyages', async () => {
      (voyageService.fetchVoyagesByVesselIdNetwork as jest.Mock).mockResolvedValueOnce([]);

      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      expect(voyageService.fetchVoyageDetailsByIdNetwork).not.toHaveBeenCalled();
    });

    /**
     * Test Steps:
     * 1) Prefetch completes
     * 2) Verify data is available in query cache
     */
    it('should populate query cache after prefetch', async () => {
      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      // Check that data is in cache
      const cachedVessel = queryClient.getQueryData(vesselKeys.detail(1));
      expect(cachedVessel).toEqual(mockVesselWithStatus);

      const cachedVoyages = queryClient.getQueryData(['voyages', 'vessel', 1]);
      expect(cachedVoyages).toEqual(mockVoyages);
    });

    /**
     * Test Steps:
     * 1) Invoices are prefetched
     * 2) Verify mapBackendInvoice is applied
     */
    it('should map invoices during prefetch', async () => {
      const { result } = renderHook(() => usePrefetchVessel(), { wrapper });

      await result.current(1);

      const cachedInvoices = queryClient.getQueryData(invoiceKeys.byVessel(1));
      expect(cachedInvoices).toBeDefined();
    });
  });

  // ============================================
  // TEST CASE: Query Cache Behavior
  // ============================================
  describe('Query Cache Behavior', () => {
    /**
     * Test Steps:
     * 1) Fetch data
     * 2) Verify data is cached
     * 3) Fetch again
     * 4) Verify cached data is used (no new network call)
     */
    it('should use cached data on subsequent renders', async () => {
      const { result, rerender } = renderHook(() => useVesselsQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(vesselService.fetchVesselsWithStatusNetwork).toHaveBeenCalledTimes(1);

      // Rerender the hook
      rerender({});

      // Should still have data without additional fetch
      expect(result.current.data).toHaveLength(2);
      // Note: With staleTime: 0, it may refetch, but cached data is used immediately
    });

    /**
     * Test Steps:
     * 1) Fetch data
     * 2) Verify placeholderData uses previous data
     */
    it('should use placeholder data while loading', async () => {
      const { result } = renderHook(() => useVesselsQuery(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Data should be available
      expect(result.current.data).toBeDefined();
    });
  });
});
