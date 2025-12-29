import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VesselWithStatus, Voyage, Document } from '@/types';
import { vesselService, voyageService } from '@/services';
import * as db from '@/lib/database';
import { vesselKeys } from './useVesselsQuery';

// Voyage query keys
export const voyageKeys = {
    all: ['voyages'] as const,
    byVessel: (vesselId: number) => [...voyageKeys.all, 'vessel', vesselId] as const,
};

// Document query keys
export const documentKeys = {
    all: ['documents'] as const,
    byVessel: (vesselId: number) => [...documentKeys.all, 'vessel', vesselId] as const,
};

/**
 * Hook to fetch vessel details with status
 * Uses placeholderData to instantly show prefetched/cached data
 */
export function useVesselDetailsQuery(id: number) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: vesselKeys.detail(id),
        queryFn: async (): Promise<VesselWithStatus | null> => {
            try {
                return await vesselService.fetchVesselByIdWithStatusNetwork(id);
            } catch (err) {
                console.warn('Network failed for vessel details, using cache:', err);
                const cached = await db.getCacheValue<VesselWithStatus>(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id));
                if (cached) return cached;
                throw err;
            }
        },
        enabled: !!id && !isNaN(id),
        // Instantly show any existing data from cache
        placeholderData: () => queryClient.getQueryData(vesselKeys.detail(id)),
    });
}

/**
 * Hook to fetch voyages for a vessel
 */
export function useVesselVoyagesQuery(vesselId: number) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: voyageKeys.byVessel(vesselId),
        queryFn: async (): Promise<Voyage[]> => {
            try {
                return await voyageService.fetchVoyagesByVesselIdNetwork(vesselId);
            } catch (err) {
                console.warn('Network failed for voyages, using cache:', err);
                const cached = await db.getCacheValue<Voyage[]>(db.CACHE_KEYS.VOYAGES_BY_VESSEL(vesselId));
                if (cached) return cached;
                throw err;
            }
        },
        enabled: !!vesselId && !isNaN(vesselId),
        placeholderData: () => queryClient.getQueryData(voyageKeys.byVessel(vesselId)),
    });
}

/**
 * Hook to fetch documents for a vessel
 */
export function useVesselDocumentsQuery(vesselId: number) {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: documentKeys.byVessel(vesselId),
        queryFn: async (): Promise<Document[]> => {
            try {
                return await vesselService.fetchVesselDocumentsNetwork(vesselId);
            } catch (err) {
                console.warn('Network failed for documents, using cache:', err);
                const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(vesselId));
                if (cached) return cached;
                throw err;
            }
        },
        enabled: !!vesselId && !isNaN(vesselId),
        placeholderData: () => queryClient.getQueryData(documentKeys.byVessel(vesselId)),
    });
}

