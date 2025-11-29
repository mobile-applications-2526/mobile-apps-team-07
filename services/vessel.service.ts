/**
 * Vessel Service
 * 
 * Business logic layer for vessel operations.
 * Handles data transformation and orchestration between the database and UI.
 */

import * as db from '@/lib/database';
import { Vessel, CreateVesselInput, UpdateVesselInput } from '@/types';

// ============================================
// VESSEL CRUD OPERATIONS
// ============================================

/**
 * Get all vessels
 */
export async function getAllVessels(): Promise<Vessel[]> {
  return db.getAllVessels();
}

/**
 * Get a vessel by ID
 */
export async function getVesselById(id: number): Promise<Vessel | null> {
  return db.getVesselById(id);
}

/**
 * Get a vessel by IMO number
 */
export async function getVesselByImo(imo: string): Promise<Vessel | null> {
  return db.getVesselByImo(imo);
}

/**
 * Create a new vessel
 */
export async function createVessel(input: CreateVesselInput): Promise<Vessel> {
  // Validate IMO doesn't exist
  const exists = await db.imoExists(input.imo);
  if (exists) {
    throw new Error(`Vessel with IMO ${input.imo} already exists`);
  }
  
  return db.createVessel(input);
}

/**
 * Update an existing vessel
 */
export async function updateVessel(
  id: number, 
  input: UpdateVesselInput
): Promise<Vessel | null> {
  // If updating IMO, validate it doesn't exist for another vessel
  if (input.imo) {
    const existingVessel = await db.getVesselByImo(input.imo);
    if (existingVessel && existingVessel.id !== id) {
      throw new Error(`Vessel with IMO ${input.imo} already exists`);
    }
  }
  
  return db.updateVessel(id, input);
}

/**
 * Delete a vessel
 */
export async function deleteVessel(id: number): Promise<boolean> {
  return db.deleteVessel(id);
}

// ============================================
// VESSEL QUERIES
// ============================================

/**
 * Search vessels by name or IMO
 */
export async function searchVessels(query: string): Promise<Vessel[]> {
  return db.searchVessels(query);
}

/**
 * Get vessels by type
 */
export async function getVesselsByType(type: string): Promise<Vessel[]> {
  return db.getVesselsByType(type);
}

/**
 * Get total vessel count
 */
export async function getVesselsCount(): Promise<number> {
  return db.getVesselsCount();
}

// ============================================
// VESSEL UTILITIES
// ============================================

/**
 * Check if an IMO number already exists
 */
export async function imoExists(imo: string): Promise<boolean> {
  return db.imoExists(imo);
}

/**
 * Get all IMO numbers
 */
export async function getAllImos(): Promise<string[]> {
  return db.getAllImos();
}

/**
 * Check if a vessel has an active voyage
 */
export function hasActiveVoyage(vessel: Vessel): boolean {
  return Boolean(vessel.eta && vessel.port);
}

/**
 * Get active voyages count for a vessel
 */
export function getActiveVoyagesCount(vessel: Vessel): number {
  return hasActiveVoyage(vessel) ? 1 : 0;
}
