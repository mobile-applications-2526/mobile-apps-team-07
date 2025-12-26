/**
 * Cargo Types
 * 
 * Type definitions for cargo-related data structures.
 */

export interface Cargo {
  id: number;
  cargoType: string;
  requiredTempC: number; 
  nominatedQuantityMt: number; 
  blQuantityMt: number; 
  shoreQuantityMt: number; 
  shipQuantityMt: number; 
  apiGravity: number; 
  density15c: number; 
  sulphurPct: number; 
  waterContentPct: number;
  unNumber: string; 
  imoClass: string; 
  loadingInstructions: string; 
  dischargeInstructions: string; 
  chartererName: string; 
  receiverName: string;
}
