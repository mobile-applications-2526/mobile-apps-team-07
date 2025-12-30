/**
 * Vessel Utility Functions
 * 
 * Domain-specific business logic for vessel operations.
 */

import type { Vessel } from '@/types/vessel';

/**
 * Determines if a vessel is a gas carrier based on its type.
 * 
 * @param vessel - The vessel object or vessel type string
 * @returns True if the vessel is a gas carrier, false otherwise
 */
export function isGasCarrier(vessel: Vessel | string | null | undefined): boolean {
  if (!vessel) return false;
  
  const vesselTypeRaw = typeof vessel === 'string' 
    ? vessel 
    : (
        (vessel as any)?.vesselType ?? 
        (vessel as any)?.type ?? 
        (vessel as any)?.vessel_type ?? 
        ''
      ).toString();
  
  const vesselType = vesselTypeRaw.trim().toLowerCase();
  return vesselType.includes('gas') && vesselType.includes('carrier');
}

/**
 * Checks if a vessel has the required documents for unlocking voyages.
 * 
 * @param vessel - The vessel object or vessel type
 * @param hasQ88 - Whether Q88 document is uploaded
 * @param hasFormC - Whether Form C document is uploaded
 * @returns True if required documents are missing, false otherwise
 */
export function hasMissingVoyageDocuments(
  vessel: Vessel | string | null | undefined,
  hasQ88: boolean,
  hasFormC: boolean
): boolean {
  const isGas = isGasCarrier(vessel);
  return isGas ? !(hasQ88 && hasFormC) : !hasQ88;
}

/**
 * Gets the missing documents message for a vessel.
 * 
 * @param vessel - The vessel object or vessel type
 * @returns User-friendly message about missing documents
 */
export function getMissingDocumentsMessage(vessel: Vessel | string | null | undefined): string {
  const isGas = isGasCarrier(vessel);
  return isGas
    ? 'Please upload Q88 and Form C in the Specs section to unlock this page.'
    : 'Please upload Q88 in the Specs section to unlock this page.';
}

/**
 * Validates if a vessel name is valid.
 * 
 * @param name - The vessel name to validate
 * @returns True if valid, false otherwise
 */
export function isValidVesselName(name: string | null | undefined): boolean {
  if (!name || typeof name !== 'string') return false;
  return name.trim().length >= 2;
}

/**
 * Validates if an IMO number is in the correct format.
 * IMO numbers are 7 digits, typically formatted as "IMO" followed by 7 digits.
 * 
 * @param imo - The IMO number to validate
 * @returns True if valid, false otherwise
 */
export function isValidIMONumber(imo: string | null | undefined): boolean {
  if (!imo || typeof imo !== 'string') return false;
  
  // Remove "IMO" prefix if present
  const cleaned = imo.replace(/^IMO\s*/i, '').trim();
  
  // Check if it's exactly 7 digits
  return /^\d{7}$/.test(cleaned);
}
