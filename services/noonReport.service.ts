import { NoonReport } from "@/types";

export async function getLatestNoonReportByVesselId(vesselId: number): Promise<NoonReport | null> {
  const response = await fetch(`http://10.0.2.2:8080/api/vessels/${vesselId}/noon-reports/latest`);
  return await response.json();
}
