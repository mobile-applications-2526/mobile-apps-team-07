/**
 * Invoice Service Unit Tests
 *
 * Tests invoice operations including:
 * - Fetching invoices by vessel
 * - Creating TC and VC invoices
 * - Updating invoice status
 * - Deleting invoices
 * - Cache management
 */

import {
  getInvoicesByVessel,
  fetchInvoicesByVesselNetwork,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  updateInvoice,
  createTCInvoice,
  createVCInvoice,
} from '../../services/invoice.service';
import { apiClient } from '../../services/api.client';
import * as db from '../../lib/database';

// Mock dependencies
jest.mock('../../services/api.client', () => ({
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
    INVOICES_BY_VESSEL: (vesselId: number) => `invoices:vessel:${vesselId}`,
  },
}));

describe('Invoice Service', () => {
  // Sample test data
  const mockTCInvoice = {
    id: 1,
    invoiceNumber: 'INV-TC-001',
    type: 'TC',
    amount: 50000,
    currency: 'USD',
    status: 'pending',
    vesselId: 1,
    createdAt: '2024-01-15T00:00:00Z',
  };

  const mockVCInvoice = {
    id: 2,
    invoiceNumber: 'INV-VC-001',
    type: 'VC',
    amount: 75000,
    currency: 'USD',
    status: 'paid',
    vesselId: 1,
    createdAt: '2024-01-20T00:00:00Z',
  };

  const mockInvoices = [mockTCInvoice, mockVCInvoice];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // GET INVOICES BY VESSEL
  // ============================================
  describe('getInvoicesByVessel', () => {
    it('should return cached invoices if available', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(mockInvoices);

      const result = await getInvoicesByVessel(1);

      expect(db.getCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.INVOICES_BY_VESSEL(1)
      );
      expect(result).toEqual(mockInvoices);
    });

    it('should fetch from API when cache is empty', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockInvoices);

      const result = await getInvoicesByVessel(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/1/invoices');
      expect(result).toEqual(mockInvoices);
    });

    it('should cache API response', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockInvoices);

      await getInvoicesByVessel(1);

      expect(db.setCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.INVOICES_BY_VESSEL(1),
        mockInvoices
      );
    });

    it('should return empty array when no invoices exist', async () => {
      (db.getCacheValue as jest.Mock).mockResolvedValueOnce(null);
      (apiClient.get as jest.Mock).mockResolvedValueOnce([]);

      const result = await getInvoicesByVessel(1);

      expect(result).toEqual([]);
    });
  });

  // ============================================
  // FETCH INVOICES NETWORK ONLY
  // ============================================
  describe('fetchInvoicesByVesselNetwork', () => {
    it('should always fetch from network and update cache', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockInvoices);

      const result = await fetchInvoicesByVesselNetwork(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/vessels/1/invoices');
      expect(db.setCacheValue).toHaveBeenCalledWith(
        db.CACHE_KEYS.INVOICES_BY_VESSEL(1),
        mockInvoices
      );
      expect(result).toEqual(mockInvoices);
    });

    it('should throw error on network failure', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchInvoicesByVesselNetwork(1)).rejects.toThrow('Network error');
    });
  });

  // ============================================
  // GET INVOICE BY ID
  // ============================================
  describe('getInvoiceById', () => {
    it('should fetch invoice by ID', async () => {
      (apiClient.get as jest.Mock).mockResolvedValueOnce(mockTCInvoice);

      const result = await getInvoiceById(1);

      expect(apiClient.get).toHaveBeenCalledWith('/api/invoices/1');
      expect(result).toEqual(mockTCInvoice);
    });

    it('should throw error when invoice not found', async () => {
      (apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

      await expect(getInvoiceById(999)).rejects.toThrow('Not found');
    });
  });

  // ============================================
  // UPDATE INVOICE STATUS
  // ============================================
  describe('updateInvoiceStatus', () => {
    it('should update invoice status to paid', async () => {
      const updatedInvoice = { ...mockTCInvoice, status: 'paid' };
      (apiClient.put as jest.Mock).mockResolvedValueOnce(updatedInvoice);

      const result = await updateInvoiceStatus(1, 'paid');

      expect(apiClient.put).toHaveBeenCalledWith('/api/invoices/1/status', {
        status: 'paid',
      });
      expect(result.status).toBe('paid');
    });

    it('should update invoice status to overdue', async () => {
      const updatedInvoice = { ...mockTCInvoice, status: 'overdue' };
      (apiClient.put as jest.Mock).mockResolvedValueOnce(updatedInvoice);

      const result = await updateInvoiceStatus(1, 'overdue');

      expect(result.status).toBe('overdue');
    });

    it('should update invoice status to pending', async () => {
      const updatedInvoice = { ...mockVCInvoice, status: 'pending' };
      (apiClient.put as jest.Mock).mockResolvedValueOnce(updatedInvoice);

      const result = await updateInvoiceStatus(2, 'pending');

      expect(result.status).toBe('pending');
    });
  });

  // ============================================
  // DELETE INVOICE
  // ============================================
  describe('deleteInvoice', () => {
    it('should delete invoice successfully', async () => {
      (apiClient.delete as jest.Mock).mockResolvedValueOnce({});

      await expect(deleteInvoice(1)).resolves.toBeUndefined();

      expect(apiClient.delete).toHaveBeenCalledWith('/api/invoices/1');
    });

    it('should throw error on delete failure', async () => {
      (apiClient.delete as jest.Mock).mockRejectedValueOnce(
        new Error('Delete failed')
      );

      await expect(deleteInvoice(1)).rejects.toThrow('Delete failed');
    });
  });

  // ============================================
  // UPDATE INVOICE
  // ============================================
  describe('updateInvoice', () => {
    it('should update invoice with new data', async () => {
      const updatePayload = { amount: 60000, currency: 'EUR' };
      const updatedInvoice = { ...mockTCInvoice, ...updatePayload };
      (apiClient.put as jest.Mock).mockResolvedValueOnce(updatedInvoice);

      const result = await updateInvoice(1, updatePayload);

      expect(apiClient.put).toHaveBeenCalledWith('/api/invoices/1', updatePayload);
      expect(result).toEqual(updatedInvoice);
    });

    it('should throw error on update failure', async () => {
      (apiClient.put as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

      await expect(updateInvoice(1, {})).rejects.toThrow('Update failed');
    });
  });

  // ============================================
  // CREATE TC INVOICE
  // ============================================
  describe('createTCInvoice', () => {
    const tcInvoicePayload = {
      vesselId: 1,
      voyageId: 1,
      amount: 50000,
      currency: 'USD',
      dailyHireRate: 10000,
      daysCharged: 5,
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-15',
    };

    it('should create TC invoice successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockTCInvoice);

      const result = await createTCInvoice(tcInvoicePayload);

      expect(apiClient.post).toHaveBeenCalledWith('/api/invoices/tc', tcInvoicePayload);
      expect(result).toEqual(mockTCInvoice);
    });

    it('should throw error with formatted message on failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(
        new Error('Validation error: Invalid vessel ID')
      );

      await expect(createTCInvoice(tcInvoicePayload)).rejects.toThrow(
        'Failed to create TC invoice: Validation error: Invalid vessel ID'
      );
    });

    it('should handle server errors', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(
        new Error('Internal server error')
      );

      await expect(createTCInvoice(tcInvoicePayload)).rejects.toThrow(
        'Failed to create TC invoice: Internal server error'
      );
    });
  });

  // ============================================
  // CREATE VC INVOICE
  // ============================================
  describe('createVCInvoice', () => {
    const vcInvoicePayload = {
      vesselId: 1,
      voyageId: 1,
      amount: 75000,
      currency: 'USD',
      freightRate: 15,
      cargoQuantity: 5000,
      invoiceDate: '2024-01-20',
      dueDate: '2024-02-20',
    };

    it('should create VC invoice successfully', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockVCInvoice);

      const result = await createVCInvoice(vcInvoicePayload);

      expect(apiClient.post).toHaveBeenCalledWith('/api/invoices/vc', vcInvoicePayload);
      expect(result).toEqual(mockVCInvoice);
    });

    it('should throw error with formatted message on failure', async () => {
      (apiClient.post as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid cargo quantity')
      );

      await expect(createVCInvoice(vcInvoicePayload)).rejects.toThrow(
        'Failed to create VC invoice: Invalid cargo quantity'
      );
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle invoice with zero amount', async () => {
      const zeroAmountInvoice = { ...mockTCInvoice, amount: 0 };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(zeroAmountInvoice);

      const result = await getInvoiceById(1);

      expect(result.amount).toBe(0);
    });

    it('should handle invoice with different currencies', async () => {
      const eurInvoice = { ...mockTCInvoice, currency: 'EUR' };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(eurInvoice);

      const result = await getInvoiceById(1);

      expect(result.currency).toBe('EUR');
    });

    it('should handle large invoice amounts', async () => {
      const largeAmountInvoice = { ...mockTCInvoice, amount: 9999999.99 };
      (apiClient.get as jest.Mock).mockResolvedValueOnce(largeAmountInvoice);

      const result = await getInvoiceById(1);

      expect(result.amount).toBe(9999999.99);
    });
  });
});
