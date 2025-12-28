import { voyageService } from "@/services";
import { Document, VoyageWithDetails } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useVoyageDetails(id: number | undefined) {
  const [voyageWithDetails, setVoyageData] = useState<VoyageWithDetails | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadVoyageDetails = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Network First
      try {
        const data = await voyageService.fetchVoyageDetailsByIdNetwork(id);
        if (data) {
          setVoyageData(data);
        }

        const docsData = await voyageService.fetchVoyageDocumentsNetwork(id);
        if(docsData){
          setDocuments(docsData);
        }
      } catch (networkErr) {
        console.warn('Network failed for voyageWithDetails details, falling back to cache', networkErr);

        // Cache Fallback
        const cachedData = await voyageService.getVoyageDetailsById(id);
        if (cachedData) {
          setVoyageData(cachedData);
        } else {
          // No cache available, set error
          setError(networkErr instanceof Error ? networkErr : new Error('Network failed and no cache available'));
        }
      }
    } catch (err) {
      console.error('Failed to load voyageWithDetails details:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const getDocuments = useCallback(async (): Promise<Document[]> => {
    if(!id) return [];
    return await voyageService.getVoyageDocuments(id);
  }, [])

  useEffect(() => {
    loadVoyageDetails();
  }, [loadVoyageDetails]);

  const updateVoyageLocal = useCallback((updatedVoyage: VoyageWithDetails) => {
    setVoyageData(updatedVoyage);
  }, []);

  return {
    voyageWithDetails,
    documents,
    isLoading,
    error,

    getDocuments,
    refresh: loadVoyageDetails,
    updateLocal: updateVoyageLocal,
  };
}
