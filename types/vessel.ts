/**
 * Vessel Types
 * 
 * Type definitions for vessel-related data structures.
 */

// Vessel entity from database
export interface Vessel {
  id: number;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta: string | null;
  port: string | null;
  image: string | null;
  hasQ88: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input type for creating a new vessel
export interface CreateVesselInput {
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta?: string | null;
  port?: string | null;
  image?: string | null;
  hasQ88?: boolean;
}

// Input type for updating a vessel
export interface UpdateVesselInput {
  name?: string;
  imo?: string;
  type?: string;
  subtype?: string;
  eta?: string | null;
  port?: string | null;
  image?: string | null;
  hasQ88?: boolean;
}

// Vessel type categories
export type VesselTypeCategory = 'Gas Carrier' | 'Chemical Tanker' | 'MR Tanker';

// Vessel subtypes mapped by type
export type VesselSubtypes = {
  'Gas Carrier': 'LPG' | 'LNG' | 'LEG';
  'Chemical Tanker': 'Type 1' | 'Type 2' | 'Type 3';
  'MR Tanker': 'Clean' | 'Dirty';
};
