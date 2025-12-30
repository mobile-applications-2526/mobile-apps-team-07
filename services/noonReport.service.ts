import { NoonReport } from "@/types";
import { API_URL, defaultHeaders } from "./config";

export async function getLatestNoonReportByVesselId(vesselId: number): Promise<NoonReport | null> {
  const response = await fetch(`${API_URL}/api/vessels/${vesselId}/noon-reports/latest`, { headers: defaultHeaders });
  return await response.json();
}
