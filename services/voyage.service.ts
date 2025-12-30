/**
 * Voyage Service
 * 
 * Business logic layer for voyage operations.
 * Handles data transformation and orchestration between the Server and UI.
 */

import { Voyage } from "@/types";
import { API_URL, defaultHeaders } from "./config";

export async function getAllVoyages(): Promise<Voyage[]> {
  const response = await fetch(`${API_URL}/api/voyages`, { headers: defaultHeaders });
  return await response.json();
}

export async function getVoyageById(id: number): Promise<Voyage | null> {
  const response = await fetch(`${API_URL}/api/voyages/${id}`, { headers: defaultHeaders });
  return await response.json();
}

export async function getVoyagesByVesselId(vesselId: number): Promise<Voyage[]> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/voyages`, { headers: defaultHeaders });
  return await response.json();
}
