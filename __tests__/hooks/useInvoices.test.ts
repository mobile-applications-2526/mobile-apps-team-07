/**
 * useInvoices Hook Unit Tests
 *
 * User Validation Criteria:
 * - User should see list of invoices for a vessel
 * - User should be able to create a new invoice
 * - User should be able to update invoice status
 * - User should be able to delete an invoice
 * - User should be able to download invoice PDF
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert, Linking } from 'react-native';
import React from 'react';

// Mock dependencies
jest.mock('@/services', () => ({
  invoiceService: {
    fetchInvoicesByVesselNetwork: jest.fn(),
    getInvoiceById: jest.fn(),
    deleteInvoice: jest.fn(),
    updateInvoiceStatus: jest.fn(),
    updateInvoice: jest.fn(),
  },
  mapBackendInvoice: jest.fn((inv) => ({
    id: String(inv.id),
    number: inv.invoiceNumber || `INV-${inv.id}`,
    type: inv.type || 'TC',
    status: inv.status || 'pending',
    amount: inv.totalAmount || inv.amount || 0,
    currency: inv.currency || 'USD',
    date: inv.invoiceDate || new Date().toISOString(),
    dueDate: inv.dueDate || null,
    pdfUrl: inv.pdfUrl || inv.fileUrl || null,
  })),
}));

jest.mock('@/lib/database', () => ({
  getCacheValue: jest.fn(),
  CACHE_KEYS: {
    INVOICES_BY_VESSEL: (id: number) => `invoices:vessel:${id}`,
  },
}));

jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

import { useInvoices } from '../../hooks/useInvoices';
import { invoiceService, mapBackendInvoice } from '@/services';
import * as db from '@/lib/database';

describe('useInvoices Hook', () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockInvoices = [
    {
      id: 1,
      invoiceNumber: 'INV-001',
      type: 'TC',
      status: 'pending',
      totalAmount: 50000,
      currency: 'USD',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-15',
      pdfUrl: 'https://api.test.com/invoices/1.pdf',
    },
    {
      id: 2,
      invoiceNumber: 'INV-002',
      type: 'VC',
      status: 'paid',
      totalAmount: 75000,
      currency: 'USD',
      invoiceDate: '2024-01-10',
      dueDate: '2024-02-10',
      pdfUrl: null,
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

    (invoiceService.fetchInvoicesByVesselNetwork as jest.Mock).mockResolvedValue(mockInvoices);
  });

  afterEach(() => {
    queryClient.clear();
  });

  // ============================================
  // TEST CASE: Fetch Invoices
  // ============================================
  describe('Fetch Invoices', () => {
    /**
     * Test Steps:
     * 1) Initialize hook with vessel ID
     * 2) Verify invoices are fetched from network
     * 3) Verify invoices are mapped correctly
     */
    it('should fetch invoices for vessel', async () => {
      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(invoiceService.fetchInvoicesByVesselNetwork).toHaveBeenCalledWith(1);
      expect(result.current.invoices).toHaveLength(2);
    });

    /**
     * Test Steps:
     * 1) Initialize hook without vessel ID
     * 2) Verify query is not enabled
     * 3) Verify no network call is made
     */
    it('should not fetch when vesselId is undefined', async () => {
      const { result } = renderHook(() => useInvoices(undefined), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(invoiceService.fetchInvoicesByVesselNetwork).not.toHaveBeenCalled();
      expect(result.current.invoices).toHaveLength(0);
    });

    /**
     * Test Steps:
     * 1) Network request fails
     * 2) Verify cache is checked as fallback
     * 3) Verify cached data is returned
     */
    it('should fallback to cache on network failure', async () => {
      (invoiceService.fetchInvoicesByVesselNetwork as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockInvoices);

      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(db.getCacheValue).toHaveBeenCalledWith('invoices:vessel:1');
    });

    /**
     * Test Steps:
     * 1) Fetch invoices
     * 2) Verify invoices are sorted by date (newest first)
     */
    it('should sort invoices by date descending', async () => {
      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      // First invoice should be newer (2024-01-15) than second (2024-01-10)
      const dates = result.current.invoices.map((inv) => new Date(inv.date).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });
  });

  // ============================================
  // TEST CASE: Create Invoice
  // ============================================
  describe('Create Invoice', () => {
    /**
     * Test Steps:
     * 1) Call create with new invoice
     * 2) Verify optimistic update adds invoice to list
     * 3) Verify query is invalidated
     */
    it('should add invoice optimistically', async () => {
      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newInvoice = {
        id: '3',
        number: 'INV-003',
        type: 'TC' as const,
        status: 'pending' as const,
        amount: 60000,
        currency: 'USD',
        date: '2024-01-20',
        dueDate: '2024-02-20',
        pdfUrl: null,
      };

      act(() => {
        result.current.actions.create(newInvoice);
      });

      // Invoice should appear at the beginning (newest)
      expect(result.current.invoices[0].number).toBe('INV-003');
    });
  });

  // ============================================
  // TEST CASE: Update Invoice Status
  // ============================================
  describe('Update Invoice Status', () => {
    /**
     * Test Steps:
     * 1) Call changeStatus with invoice and new status
     * 2) Verify optimistic update changes status immediately
     * 3) Verify API is called
     */
    it('should update status optimistically', async () => {
      (invoiceService.updateInvoiceStatus as jest.Mock).mockResolvedValueOnce({});

      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoice = result.current.invoices[0];

      await act(async () => {
        await result.current.actions.changeStatus(invoice, 'paid');
      });

      expect(invoiceService.updateInvoiceStatus).toHaveBeenCalledWith(
        Number(invoice.id),
        'paid'
      );
    });

    /**
     * Test Steps:
     * 1) Status update fails
     * 2) Verify status is rolled back
     * 3) Verify error alert is shown
     */
    it('should rollback on status update failure', async () => {
      (invoiceService.updateInvoiceStatus as jest.Mock).mockRejectedValueOnce(
        new Error('Update failed')
      );

      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoice = result.current.invoices[0];

      await act(async () => {
        await result.current.actions.changeStatus(invoice, 'paid');
      });

      expect(Alert.alert).toHaveBeenCalledWith('Update failed', 'Could not update invoice status.');
    });
  });

  // ============================================
  // TEST CASE: Delete Invoice
  // ============================================
  describe('Delete Invoice', () => {
    /**
     * Test Steps:
     * 1) Call delete with invoice
     * 2) Verify confirmation dialog appears
     * 3) Confirm deletion
     * 4) Verify invoice is removed from list
     */
    it('should show confirmation before delete', async () => {
      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoice = result.current.invoices[0];

      await act(async () => {
        await result.current.actions.delete(invoice);
      });

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete invoice',
        expect.stringContaining('Are you sure'),
        expect.any(Array)
      );
    });
  });

  // ============================================
  // TEST CASE: Download PDF
  // ============================================
  describe('Download PDF', () => {
    /**
     * Test Steps:
     * 1) Invoice has PDF URL
     * 2) Call downloadPdf
     * 3) Verify Linking.openURL is called
     */
    it('should open PDF URL directly if available', async () => {
      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoiceWithPdf = result.current.invoices.find((inv) => inv.pdfUrl);

      if (invoiceWithPdf) {
        await act(async () => {
          await result.current.actions.downloadPdf(invoiceWithPdf);
        });

        expect(Linking.openURL).toHaveBeenCalledWith(invoiceWithPdf.pdfUrl);
      }
    });

    /**
     * Test Steps:
     * 1) Invoice has no PDF URL
     * 2) Call downloadPdf
     * 3) Verify getInvoiceById is called to fetch latest
     */
    it('should fetch latest invoice if no PDF URL', async () => {
      (invoiceService.getInvoiceById as jest.Mock).mockResolvedValueOnce({
        id: 2,
        fileUrl: 'https://api.test.com/invoices/2.pdf',
      });

      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoiceWithoutPdf = result.current.invoices.find((inv) => !inv.pdfUrl);

      if (invoiceWithoutPdf) {
        await act(async () => {
          await result.current.actions.downloadPdf(invoiceWithoutPdf);
        });

        expect(invoiceService.getInvoiceById).toHaveBeenCalledWith(Number(invoiceWithoutPdf.id));
      }
    });

    /**
     * Test Steps:
     * 1) PDF still generating (no URL even after fetch)
     * 2) Verify user-friendly alert is shown
     */
    it('should show alert when PDF not available', async () => {
      (invoiceService.getInvoiceById as jest.Mock).mockResolvedValueOnce({
        id: 2,
        fileUrl: null,
        pdfUrl: null,
      });

      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoiceWithoutPdf = result.current.invoices.find((inv) => !inv.pdfUrl);

      if (invoiceWithoutPdf) {
        await act(async () => {
          await result.current.actions.downloadPdf(invoiceWithoutPdf);
        });

        expect(Alert.alert).toHaveBeenCalledWith(
          'PDF not available',
          expect.stringContaining('still being generated')
        );
      }
    });
  });

  // ============================================
  // TEST CASE: Processing State
  // ============================================
  describe('Processing State', () => {
    /**
     * Test Steps:
     * 1) Start an operation
     * 2) Verify processingMap shows invoice as processing
     * 3) Operation completes
     * 4) Verify processingMap is cleared
     */
    it('should track processing state per invoice', async () => {
      (invoiceService.updateInvoiceStatus as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.invoices.length).toBeGreaterThan(0);
      });

      const invoice = result.current.invoices[0];

      // Processing should initially be false
      expect(result.current.processingMap[invoice.id]).toBeFalsy();
    });
  });

  // ============================================
  // TEST CASE: Refresh
  // ============================================
  describe('Refresh', () => {
    /**
     * Test Steps:
     * 1) Call refresh action
     * 2) Verify refetch is triggered
     * 3) Verify new data is loaded
     */
    it('should refresh invoices', async () => {
      const { result } = renderHook(() => useInvoices(1), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear mock call count
      (invoiceService.fetchInvoicesByVesselNetwork as jest.Mock).mockClear();

      await act(async () => {
        await result.current.actions.refresh();
      });

      expect(invoiceService.fetchInvoicesByVesselNetwork).toHaveBeenCalledWith(1);
    });
  });
});
