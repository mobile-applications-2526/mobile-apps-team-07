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
  // Identification
  flag: string | null;
  classification: string | null;
  // Build info
  buildYear: number | null;
  drydockDue: string | null;
  // Dimensions
  dwt: number | null;           // Deadweight tonnage (MT)
  summerDraft: number | null;    // Summer draft (M)
  // Capacity
  cubicCapacity: number | null;  // Cubic capacity (M³)
  cargoTanks: number | null;     // Number of cargo tanks
  tankCoating: string | null;    // Tank coating type
  // Cargo limits
  maxCargoTemp: number | null;   // Max cargo temp (°C)
  minCargoTemp: number | null;   // Min cargo temp (°C)
  maxPressure: number | null;    // Max pressure (Bar)
  // Performance
  avgSpeed: number | null;       // Average speed (Knots)
  fuelConsumption: number | null; // Fuel consumption (MT/Day)
  // Voyage info (legacy)
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
  // Identification
  flag?: string | null;
  classification?: string | null;
  // Build info
  buildYear?: number | null;
  drydockDue?: string | null;
  // Dimensions
  dwt?: number | null;
  summerDraft?: number | null;
  // Capacity
  cubicCapacity?: number | null;
  cargoTanks?: number | null;
  tankCoating?: string | null;
  // Cargo limits
  maxCargoTemp?: number | null;
  minCargoTemp?: number | null;
  maxPressure?: number | null;
  // Performance
  avgSpeed?: number | null;
  fuelConsumption?: number | null;
  // Legacy voyage info
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
  flag?: string | null;
  classification?: string | null;
  buildYear?: number | null;
  drydockDue?: string | null;
  dwt?: number | null;
  summerDraft?: number | null;
  cubicCapacity?: number | null;
  cargoTanks?: number | null;
  tankCoating?: string | null;
  maxCargoTemp?: number | null;
  minCargoTemp?: number | null;
  maxPressure?: number | null;
  avgSpeed?: number | null;
  fuelConsumption?: number | null;
  eta?: string | null;
  port?: string | null;
  image?: string | null;
  hasQ88?: boolean;
}

// Noon report for KPI data
export interface NoonReport {
  id: number;
  vesselId: number;
  reportDate: string;
  currentSpeed: number;        // Current speed (Knots)
  fuelConsumed: number;        // Fuel consumed (MT/Day)
  cargoTemp: number | null;    // Current cargo temp (°C)
  position: {
    lat: number;
    lng: number;
  } | null;
  createdAt: string;
}

// Charter Party data
export interface CharterParty {
  id: number;
  vesselId: number;
  voyageId: number;
  warrantySpeed: number;       // Charter party warranty speed (Knots)
  fuelAllowance: number;       // Fuel allowance (MT/Day)
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

// Voyage data
export interface Voyage {
  id: number;
  vesselId: number;
  voyageNumber: string;
  origin: string;
  destination: string;
  cargoType: string | null;
  requiredMinTemp: number | null;  // Required minimum cargo temp (°C)
  departureDate: string | null;
  arrivalDate: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  charterPartyId: number | null;
  createdAt: string;
}

// KPI Performance data for overview
export interface VesselKPIs {
  speed: {
    actual: number | null;
    target: number | null;
    status: 'green' | 'yellow' | 'red' | 'no_data' | 'no_cp';
  };
  fuelConsumption: {
    actual: number | null;
    target: number | null;
    status: 'green' | 'yellow' | 'red' | 'no_data' | 'no_cp';
  };
  cargoTemp: {
    actual: number | null;
    required: number | null;
    status: 'green' | 'yellow' | 'red' | 'no_data' | 'no_voyage';
  };
}

// Vessel type categories
export type VesselTypeCategory = 'Gas Carrier' | 'Chemical Tanker' | 'MR Tanker';

// Vessel subtypes mapped by type
export type VesselSubtypes = {
  'Gas Carrier': 'LPG' | 'LNG' | 'LEG';
  'Chemical Tanker': 'Type 1' | 'Type 2' | 'Type 3';
  'MR Tanker': 'Clean' | 'Dirty';
};
