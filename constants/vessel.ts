/**
 * Vessel Constants
 * 
 * Constants related to vessel types and configurations.
 */

import { DocumentTypeCategory, VesselTypeCategory } from '@/types';

// Available vessel types
export const VESSEL_TYPES: VesselTypeCategory[] = [
  'Gas Carrier',
  'Chemical Tanker', 
  'MR Tanker',
];

export const DOCUMENT_TYPES: DocumentTypeCategory[] = [
    'Q88', 'FormC', 'ClassCert', 'CharterParty'
]

// Subtypes mapped by vessel type
export const VESSEL_SUBTYPES: Record<VesselTypeCategory, string[]> = {
  'Gas Carrier': ['LPG', 'LNG', 'LEG'],
  'Chemical Tanker': ['Type 1', 'Type 2', 'Type 3'],
  'MR Tanker': ['Clean', 'Dirty'],
};

// IMO number validation
export const IMO_NUMBER_LENGTH = 7;
export const IMO_NUMBER_REGEX = /^\d{7}$/;

// Vessel name constraints
export const VESSEL_NAME_MAX_LENGTH = 50;
export const VESSEL_NAME_MIN_LENGTH = 2;
