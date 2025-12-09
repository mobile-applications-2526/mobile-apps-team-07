/**
 * Vessel Types
 * 
 * Type definitions for vessel-related data structures.
 */

import { Timestamp } from "react-native-reanimated/lib/typescript/commonTypes";

// Vessel entity from database
export interface Vessel {
  id: number;
  vesselName: string;
  imoNumber: string;
  vesselType: VesselTypeCategory;
  vesselSubtype: string;
  // Identification
  flag: string | null;
  classificationSociety: string | null;
  // Build info
  buildYear: number | null;
  // Dimensions
  dwtMt: number | null;           // Deadweight tonnage (MT)
  // Capacity
  cubicCapacityM3: number | null;  // Cubic capacity (M³)
  cargoTanksCount: number | null;     // Number of cargo tanks
  tankCoating: string | null;    // Tank coating type
  // Cargo limits
  maxCargoTempC: number | null;   // Max cargo temp (°C)
  minCargoTempC: number | null;   // Min cargo temp (°C)
  maxPressureBar: number | null;    // Max pressure (Bar)
  summerDraftM: number | null;    // Summer draft (M)
  // Performance
  drydockDueDate: Date;
  averageSpeedKnots: number | null;       // Average speed (Knots)
  fuelConsumptionMtDay: number | null; // Fuel consumption (MT/Day)
  vesselPictureUrl: string | null;
}

export interface CreateVesselInput {
  vesselName: string;
  imoNumber: string;
  vesselType: string;
  vesselSubtype: string;
  vesselPictureUrl: string | null;
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
  id: 0,
  reportDateTime: Timestamp,
  reportType: string,
  latitude: number,
  longitude: number,
  activity: string,
  portName: string,
  distanceTravelledNm: number,
  distanceToGoNm: number,
  averageSpeedKnots: number,
  swellHeightM: number,
  windForceBeaufort: number,
  seaCondition: string,
  cargoTempAvgC: number,
  cargoPressureAvgBar: number,
  fuelConsumptionMe: number,
  fuelConsumptionAe: number,
  fuelRob: number,
  remarks: string
}

// Charter Party data
export interface CharterBase {
  id: number,
  charterReference: string,
  chartererName: string,
  charterDateStart: Date,
  charterDateEnd: Date,
  isActive: boolean,
  charterRepresentativeName: string,
  charterRepresentativeTel: string,
  charterRepresentativeEmail: string,
  charterTerms: string,
  remarks: string,
};

export interface TCCharter extends CharterBase{
  dailyHireRate: number;
  paymentTerms: string;
  hirePaymentAdvanceDays: number;
}

export interface VCCharter extends CharterBase{
  freightRateMt: number;
  freightBasis: string;
  freightLumpsum: boolean,
  demurrageRateHourly: number,
  despatchRateHourly: number,
  laytimeHoursLoad: number,
  laytimeHoursDischarge: number,
  isCvc: boolean;
}

//vessel status
export interface VesselStatus {
  id: number;
  reportDateTime: Timestamp;
  reportType: string;
  latitude: number; 
  longitude: number; 
  activity: VesselActivityCategory;
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

export interface VesselWithStatus {
  vessel: Vessel;
  latestStatus: VesselStatus;
  activeVoyage: Voyage;
  activeCharter: CharterBase
}

export interface Document {
  id: number,
  documentType: DocumentTypeCategory;
  documentNumber: string;
  documentDate: Date;
  fileUrl: string;
  remarks: string;
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
export type VesselTypeCategory = 
  | 'Gas Carrier' 
  | 'Chemical Tanker' 
  | 'MR Tanker';

export type VesselActivityCategory = 
  | 'Underway '
  | 'Loading' 
  | 'Discharging' 
  | 'Anchored' 
  | 'Drifting';

export type VoyageStatus = 
  | 'Ballast' 
  | 'Loading' 
  | 'Laden' 
  | 'Discharging' 
  | 'Complete';

export type DocumentTypeCategory =   
  | 'Q88'
  | 'FormC'
  | 'ClassCert'
  | 'CharterParty'
  | 'BillOfLading'
  | 'CargoManifest'
  | 'CertificateOrigin'
  | 'PackingList'
  | 'CommercialInvoice'
  | 'StatementFacts'
  | 'NoticeReadiness'
  | 'LetterProtest'
  | 'SurveyorReport'
  | 'UllageReport'
  | 'TimeSheet'
  | 'BunkerDeliveryNote'
  | 'LoadingPlan'
  | 'StowagePlan'
  | 'DischargePlan'
  | 'PortClearance'
  | 'CustomsDeclaration'
  | 'CrewList';


// Vessel subtypes mapped by type
export type VesselSubtypeCategory = {
  'Gas Carrier': 'LPG' | 'LNG' | 'LEG';
  'Chemical Tanker': 'Type 1' | 'Type 2' | 'Type 3';
  'MR Tanker': 'Clean' | 'Dirty';
};
