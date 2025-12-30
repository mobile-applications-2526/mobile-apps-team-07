import { cargoService } from "@/services";
import { Cargo, Document } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useCargoDetails(id: number | undefined) {
  const [cargo, setCargoData] = useState<Cargo | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadCargoDetails = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // Network First
      try {
        const data = await cargoService.getCargoById(id);
        if (data) {
          setCargoData(data);
        }
        
        const docsData = await cargoService.fetchCargoDocumentsNetwork(id);
        if (docsData) {
          setDocuments(docsData);
        }
      } catch (networkErr) {
        console.warn('Network failed for cargo details, falling back to cache', networkErr);
        
        // Cache Fallback
        const cachedData = await cargoService.getCargoById(id);
        if (cachedData) {
          setCargoData(cachedData);
        } else {
          // No cache available, set error
          setError(networkErr instanceof Error ? networkErr : new Error('Network failed and no cache available'));
        }
      }
    } catch (err) {
      console.error('Failed to load cargo details:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const getDocuments = useCallback(async (): Promise<Document[]> => {
    if (!id) return [];
    return await cargoService.getCargoDocuments(id);
  }, [id]);

  useEffect(() => {
    loadCargoDetails();
  }, [loadCargoDetails]);

  const updateCargoLocal = useCallback((updatedCargo: Cargo) => {
    setCargoData(updatedCargo);
  }, []);

  return {
    cargo,
    documents,
    isLoading,
    error,
    getDocuments,
    refresh: loadCargoDetails,
    updateLocal: updateCargoLocal,
  };
}
