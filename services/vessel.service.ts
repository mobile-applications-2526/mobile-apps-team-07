/**
 * Vessel Service
 * 
 * Business logic layer for vessel operations.
 * Handles data transformation and orchestration between the Server and UI.
 */

import { Vessel, CreateVesselInput, Document, VesselWithStatus } from '@/types';
import { API_URL } from '.';

// ============================================
// VESSEL CRUD OPERATIONS
// ============================================

/**
 * Get all vessels
 */
export async function getAllVessels(): Promise<Vessel[]> {
  const response = await fetch(`${API_URL}/api/vessels`);
  return await response.json();
}

/**
 * Get all vessels with status
 */
export async function getAllVesselsWithStatus(): Promise<VesselWithStatus[]> {
  const response = await fetch(`${API_URL}/api/vessels/with-status`);
  return await response.json();
}

/**
 * Get a vessel by ID
 */
export async function getVesselById(id: number): Promise<Vessel | null> {
  const response = await fetch(`${API_URL}/api/vessels/${id}`);
  return await response.json();
}

/**
 * Get a vessel with status by ID
 */
export async function getVesselByIdWithStatus(id: number): Promise<VesselWithStatus | null> {
  const response = await fetch(`${API_URL}/api/vessels/${id}/with-status`);
  return await response.json();
}

/**
 * Get a vessel by IMO number
 */
export async function getVesselByImo(imoNumber: string): Promise<Response> {
  const response = await fetch(`${API_URL}/api/vessels/imo/${imoNumber}`);
  return response;
}

/**
 * Create a new vessel
 */
export async function createVessel(input: CreateVesselInput): Promise<Vessel> {
  // Validate IMO doesn't exist
  if (await imoExists(input.imoNumber)) 
    throw new Error(`Vessel with IMO ${input.imoNumber} already exists`);
  
  const response = await fetch(`${API_URL}/api/vessels`, {
    method: 'POST',
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(input)
  });
  return await response.json();
}

/**
 * Update an existing vessel
 */
export async function updateVessel(vessel: Vessel): Promise<Vessel | null> {
  return null;
}

/**
 * Delete a vessel
 */
export async function deleteVessel(id: number): Promise<boolean> {
  const response = await fetch(`${API_URL}/api/vessels/${id}`,{
    method: "DELETE"
  });
  return response.status === 204;
}

/**
 * get Documents By Vessel id
 */
export async function getVesselDocuments(id: number): Promise<Document[]> {
  const response = await fetch(`${API_URL}/api/vessels/${id}/documents`);
  return await response.json();
}

// ============================================
// VESSEL QUERIES
// ============================================

/**
 * Search vessels by name or IMO
 */
export async function searchVessels(query: string): Promise<Vessel[]> {
  return [];
}

/**
 * Get vessels by type
 */
export async function getVesselsByType(type: string): Promise<Vessel[]> {
  return [];
}

// ============================================
// VESSEL UTILITIES
// ============================================

/**
 * Check if an IMO number already exists
 */
export async function imoExists(imoNumber: string): Promise<boolean> {
  const exists = await getVesselByImo(imoNumber);
  return exists.ok;
}
