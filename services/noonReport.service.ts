import { NoonReport } from "@/types";
import { API_URL } from ".";

export async function getLatestNoonReportByVesselId(vesselId: number): Promise<NoonReport | null> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/noon-reports/latest`);
  return await response.json();
}
