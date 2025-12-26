/**
 * Charter Types
 * 
 * Type definitions for charter-related data structures.
 */

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
  isVC: false;
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
  isVC: true;
}

export type CharterParty = TCCharter | VCCharter;
