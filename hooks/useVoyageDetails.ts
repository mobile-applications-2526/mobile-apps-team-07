import { voyageService } from "@/services";
import { VoyageWithDetails } from "@/types";
import { useEffect, useState } from "react";

export function useVoyageDetails(voyageId: number): VoyageWithDetails | null{
  const [voyageData, setVoyageData] = useState<VoyageWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!voyageId) return;

    setLoading(true);
    setError(null);

    voyageService.getVoyageDetailsById(voyageId)
    .then(data => {
      setVoyageData(data);
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
  }, [voyageId]);

  return voyageData;
}
