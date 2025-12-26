import { API_URL } from './config';
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
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/invoices`);
  if (!response.ok) {
    throw new Error(`Failed to fetch invoices for vessel ${vesselId}: ${response.status}`);
  }
  const data = await response.json();
  await db.setCacheValue(db.CACHE_KEYS.INVOICES_BY_VESSEL(vesselId), data);
  return data;
}

/**
 * Fetch a single invoice by id
 */
export async function getInvoiceById(id: number) {
  const response = await fetch(`${API_URL}/api/invoices/${id}`);
  if (!response.ok) throw new Error('Failed to fetch invoice');
  return await response.json();
}

/**
 * Update the payment status for an invoice
 */
export async function updateInvoiceStatus(id: number, status: string) {
  const response = await fetch(`${API_URL}/api/invoices/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error(`Failed to update invoice ${id} status: ${response.status}`);
  return await response.json();
}

/**
 * Delete an invoice
 */
export async function deleteInvoice(id: number) {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, { method: 'DELETE' });
  if (!response.ok && response.status !== 204) throw new Error(`Failed to delete invoice ${id}: ${response.status}`);
  return;
}

/**
 * Update an invoice (full update) and return updated invoice
 */
export async function updateInvoice(id: number, payload: any) {
  const response = await fetch(`${API_URL}/api/invoices/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`Failed to update invoice ${id}: ${response.status}`);
  return await response.json();
}

/**
 * Create a new TC invoice
 */
export async function createTCInvoice(payload: any) {
  const response = await fetch(`${API_URL}/api/invoices/tc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to create TC invoice: ${response.status} - ${errText}`);
  }
  return await response.json();
}

export default { getInvoicesByVessel, getInvoiceById, updateInvoiceStatus, deleteInvoice, updateInvoice, createTCInvoice };
