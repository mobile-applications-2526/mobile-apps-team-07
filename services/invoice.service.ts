import { API_URL } from './config';

export type RawInvoice = any;

/**
 * Fetch invoices for a vessel
 */
export async function getInvoicesByVessel(vesselId: number): Promise<RawInvoice[]> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/invoices`);
  if (!response.ok) {
    throw new Error(`Failed to fetch invoices for vessel ${vesselId}: ${response.status}`);
  }
  return await response.json();
}

/**
 * Fetch a single invoice by id
 */
export async function getInvoiceById(id: number) {
  const response = await fetch(`${API_URL}/api/invoices/${id}`);
  if (!response.ok) throw new Error('Failed to fetch invoice');
  return await response.json();
}

export default { getInvoicesByVessel, getInvoiceById };
