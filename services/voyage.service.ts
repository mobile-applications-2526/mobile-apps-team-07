/**
 * Voyage Service
 * 
 * Business logic layer for voyage operations.
 * Handles data transformation and orchestration between the Server and UI.
 */

import { Voyage } from "@/types";

export async function getAllVoyages(): Promise<Voyage[]> {
  const response = await fetch(`http://10.0.2.2:8080/api/voyages`);
  return await response.json();
}

export async function getVoyageById(id: number): Promise<Voyage | null> {
  const response = await fetch(`http://10.0.2.2:8080/api/voyages/${id}`);
  return await response.json();
}

export async function getVoyagesByVesselId(vesselId: number): Promise<Voyage[]> {
  const response = await fetch(`http://10.0.2.2:8080/api/vessels/${vesselId}/voyages`);
  return await response.json();
}
