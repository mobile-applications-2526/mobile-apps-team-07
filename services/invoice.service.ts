import { apiClient } from './api-client.service';
import * as db from '@/lib/database';

export type RawInvoice = any;

/**
 * Fetch invoices for a vessel
 */
export async function getInvoicesByVessel(vesselId: number): Promise<RawInvoice[]> {
  const cached = await db.getCacheValue<RawInvoice[]>(db.CACHE_KEYS.INVOICES_BY_VESSEL(vesselId));
  if (cached) {
    // background update
    fetchInvoicesByVesselNetwork(vesselId).catch(err => console.error("Background invoice fetch failed", err));
    return cached;
  }
  return await fetchInvoicesByVesselNetwork(vesselId);
}

/**
 * Network-only fetch for invoices.
 */
export async function fetchInvoicesByVesselNetwork(vesselId: number): Promise<RawInvoice[]> {
  const data = await apiClient.get<RawInvoice[]>(`/api/vessels/${vesselId}/invoices`);
  await db.setCacheValue(db.CACHE_KEYS.INVOICES_BY_VESSEL(vesselId), data);
  return data;
}

/**
 * Fetch a single invoice by id
 */
export async function getInvoiceById(id: number) {
  return await apiClient.get(`/api/invoices/${id}`);
}

/**
 * Update the payment status for an invoice
 */
export async function updateInvoiceStatus(id: number, status: string) {
  return await apiClient.put(`/api/invoices/${id}/status`, { status });
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: number) {
  await apiClient.delete(`/api/invoices/${id}`);
  return;
}

/**
 * Update an invoice (full update) and return updated invoice
 */
export async function updateInvoice(id: number, payload: any) {
  return await apiClient.put(`/api/invoices/${id}`, payload);
}

/**
 * Create a new TC invoice
 */
export async function createTCInvoice(payload: any) {
  try {
    return await apiClient.post('/api/invoices/tc', payload);
  } catch (err: any) {
    throw new Error(`Failed to create TC invoice: ${err.message}`);
  }
}

/**
 * Create a new VC invoice
 */
export async function createVCInvoice(payload: any) {
  try {
    return await apiClient.post('/api/invoices/vc', payload);
  } catch (err: any) {
    throw new Error(`Failed to create VC invoice: ${err.message}`);
  }
}

export default { getInvoicesByVessel, getInvoiceById, updateInvoiceStatus, deleteInvoice, updateInvoice, createTCInvoice };
