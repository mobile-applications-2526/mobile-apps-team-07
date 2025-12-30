/**
 * Vessel Types
 * 
 * Type definitions for vessel-related data structures.
 */

import { Timestamp } from "react-native-reanimated/lib/typescript/commonTypes";
import { CharterParty } from "./charter";
import { Voyage } from "./voyage";

export interface Vessel {
  id: number;
  vesselName: string;
  vesselType: VesselType;
  vesselSubtype: VesselSubtype;
  imoNumber: string;
  flag: string | null;
  classificationSociety: string | null;
  buildYear: number | null;
  dwtMt: number | null;                 // Deadweight tonnage (MT)
  cubicCapacityM3: number | null;       // Cubic capacity (M³)
  cargoTanksCount: number | null;       // Number of cargo tanks
  tankCoating: string | null;           // Tank coating type
  maxCargoTempC: number | null;         // Max cargo temp (°C)
  minCargoTempC: number | null;         // Min cargo temp (°C)
  maxPressureBar: number | null;        // Max pressure (Bar)
  summerDraftM: number | null;          // Summer draft (M)
  drydockDueDate: Date;
  averageSpeedKnots: number | null;     // Average speed (Knots)
  fuelConsumptionMtDay: number | null;  // Fuel consumption (MT/Day)
  vesselPicture: string | null;
}

export interface CreateVesselInput {
  vesselName: string;
  imoNumber: string;
  vesselType: VesselType;
  vesselSubtype: VesselSubtype;
  vesselPicture: string | null;
}

// Input type for updating a vessel
export interface UpdateVesselInput {
  name?: string;
  imo?: string;
  type?: VesselType;
  subtype?: VesselSubtype;
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
  vesselPicture?: string | null;
  hasQ88?: boolean;
}

export interface VesselStatus {
  id: number;
  reportDateTime: Timestamp;
  reportType: string;
  latitude: number;
  longitude: number;
  activity: VesselActivity;
  portName: number;
  distanceTravelledNm: number;
  distanceToGoNm: number;
  averageSpeedKnots: number;
  swellHeightM: number;
  windForceBeaufort: number;
  seaCondition: string;
  cargoTempAvgC: number;
  cargoPressureAvgBar: number;
  fuelConsumptionMe: number;
  fuelConsumptionAe: number;
  fuelRob: number;
  remarks: string;
};

export interface VesselWithStatus {
  vessel: Vessel;
  latestStatus: VesselStatus;
  activeVoyage: Voyage;
  activeCharter: CharterParty;
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

export type VesselType =
  | 'Gas Carrier'
  | 'Chemical Tanker'
  | 'MR Tanker';

export type VesselSubtype =
  | 'LPG'    | 'LNG'    | 'LEG'
  | 'Type 1' | 'Type 2' | 'Type 3'
  | 'Clean'  | 'Dirty';

export type VesselActivity =
  | 'Underway'
  | 'Loading'
  | 'Discharging'
  | 'Anchored'
  | 'Drifting';

export type NoonReport = VesselStatus;
