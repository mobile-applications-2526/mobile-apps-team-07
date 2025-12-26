import { voyageService } from "@/services";
import { VoyageWithDetails } from "@/types";
import { useEffect, useState } from "react";

export function useVoyageDetails(voyageId: number): VoyageWithDetails | null {
  const [voyageData, setVoyageData] = useState<VoyageWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!voyageId) return;

    setLoading(true);
    setError(null);

    // Network First
    voyageService.fetchVoyageDetailsByIdNetwork(voyageId)
      .then(data => {
        if (data) setVoyageData(data);
      })
      .catch(networkErr => {
        console.warn('Network failed for voyage details, falling back to cache', networkErr);
        // Cache Fallback
        voyageService.getVoyageDetailsById(voyageId)
          .then(cachedVal => {
            if (cachedVal) setVoyageData(cachedVal);
            // If no cache, we might want to set error, but for now we failed silently on cache load in original too?
            // Original: .catch(err => setError(err))
            else setError(networkErr instanceof Error ? networkErr : new Error('Network failed and no cache'));
          })
          .catch(cacheErr => {
            setError(networkErr instanceof Error ? networkErr : new Error('Network failed and no cache'));
          });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [voyageId]);

  return voyageData;
}
