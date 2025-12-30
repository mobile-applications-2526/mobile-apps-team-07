/**
 * Voyage Types
 * 
 * Type definitions for voyage-related data structures.
 */

import { Cargo } from "./cargo";
import { CharterParty } from "./charter";
import { VoyagePort } from "./port";
import { Vessel, VesselStatus } from "./vessel";

// Voyage data
export interface Voyage {
  id: number;
  voyageNumber: string;
  voyageStatus: VoyageStatus;
  loadRegion: string;
  dischargeRegion: string;
  voyageStartDate: Date;
  voyageEndDate: Date;
  voyageInstructions: string;
  remarks: string;
}

export interface VoyageWithDetails {
  voyage: Voyage;
  vessel: Vessel;
  ports: VoyagePort[];
  noonReports: VesselStatus[];
  cargoes: Cargo[];
  charter: CharterParty;
}

export type VoyageStatus = 
  | 'Ballast' 
  | 'Loading' 
  | 'Laden' 
  | 'Discharging' 
  | 'Complete';
