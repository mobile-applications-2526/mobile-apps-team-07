import { voyageService } from "@/services";
import { Document, VoyageWithDetails } from "@/types";
import { useCallback } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { voyageDetailKeys } from './queries';
import * as db from '@/lib/database';

export function useVoyageDetails(id: number | undefined) {
  const queryClient = useQueryClient();

  // Use React Query for voyage details - persists across navigation
  const { data: voyageWithDetails, isLoading, error, refetch } = useQuery({
    queryKey: voyageDetailKeys.detail(id!),
    queryFn: async (): Promise<VoyageWithDetails | null> => {
      try {
        return await voyageService.fetchVoyageDetailsByIdNetwork(id!);
      } catch (err) {
        console.warn('Network failed for voyage details, using cache:', err);
        const cached = await db.getCacheValue<VoyageWithDetails>(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(id!));
        if (cached) return cached;
        throw err;
      }
    },
    enabled: !!id,
    placeholderData: () => queryClient.getQueryData(voyageDetailKeys.detail(id!)),
  });

  // Use React Query for voyage documents
  const { data: documents = [] } = useQuery({
    queryKey: voyageDetailKeys.documents(id!),
    queryFn: async (): Promise<Document[]> => {
      try {
        return await voyageService.fetchVoyageDocumentsNetwork(id!);
      } catch (err) {
        console.warn('Network failed for voyage documents, using cache:', err);
        const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(id!));
        if (cached) return cached;
        throw err;
      }
    },
    enabled: !!id,
    placeholderData: () => queryClient.getQueryData(voyageDetailKeys.documents(id!)),
  });

  const getDocuments = useCallback(async (): Promise<Document[]> => {
    return documents;
  }, [documents]);

  const loadVoyageDetails = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const updateVoyageLocal = useCallback((updatedVoyage: VoyageWithDetails) => {
    queryClient.invalidateQueries({ queryKey: voyageDetailKeys.detail(id!) });
  }, [id, queryClient]);

  return {
    voyageWithDetails: voyageWithDetails ?? null,
    documents,
    isLoading,
    error: error as Error | null,

    getDocuments,
    refresh: loadVoyageDetails,
    updateLocal: updateVoyageLocal,
  };
}

