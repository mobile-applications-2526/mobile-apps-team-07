import { useQuery, useQueryClient } from '@tanstack/react-query';
import { VesselWithStatus, Voyage, Document, VoyageWithDetails } from '@/types';
import { vesselService, voyageService, invoiceService, mapBackendInvoice } from '@/services';
import * as db from '@/lib/database';
import { voyageKeys, documentKeys } from './useVesselDetailsQuery';

// Query keys
export const vesselKeys = {
    all: ['vessels'] as const,
    lists: () => [...vesselKeys.all, 'list'] as const,
    list: () => [...vesselKeys.lists(), 'withStatus'] as const,
    details: () => [...vesselKeys.all, 'detail'] as const,
    detail: (id: number) => [...vesselKeys.details(), id] as const,
};

// Invoice query keys
export const invoiceKeys = {
    all: ['invoices'] as const,
    byVessel: (vesselId: number) => [...invoiceKeys.all, 'vessel', vesselId] as const,
};

// Voyage detail keys
export const voyageDetailKeys = {
    all: ['voyageDetails'] as const,
    detail: (voyageId: number) => [...voyageDetailKeys.all, voyageId] as const,
    documents: (voyageId: number) => [...voyageDetailKeys.all, voyageId, 'documents'] as const,
};

/**
 * Hook to fetch all vessels with status
 */
export function useVesselsQuery() {
    return useQuery({
        queryKey: vesselKeys.list(),
        queryFn: async (): Promise<VesselWithStatus[]> => {
            try {
                return await vesselService.fetchVesselsWithStatusNetwork();
            } catch (err) {
                console.warn('Network failed, using cache:', err);
                const cached = await db.getCacheValue<VesselWithStatus[]>(db.CACHE_KEYS.ALL_VESSELS_WITH_STATUS);
                if (cached) return cached;
                throw err;
            }
        },
        placeholderData: (previousData) => previousData,
    });
}

/**
 * Hook to prefetch ALL vessel data before navigation
 * Always fetches fresh data (invalidates existing cache first)
 */
export function usePrefetchVessel() {
    const queryClient = useQueryClient();

    return async (id: number) => {
        // Invalidate existing cache to ensure fresh data
        queryClient.invalidateQueries({ queryKey: vesselKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: voyageKeys.byVessel(id) });
        queryClient.invalidateQueries({ queryKey: documentKeys.byVessel(id) });
        queryClient.invalidateQueries({ queryKey: invoiceKeys.byVessel(id) });

        // Phase 1: Fetch vessel core data in parallel
        const [_, voyages] = await Promise.all([
            // 1. Vessel Details
            queryClient.fetchQuery({
                queryKey: vesselKeys.detail(id),
                queryFn: async () => {
                    try {
                        return await vesselService.fetchVesselByIdWithStatusNetwork(id);
                    } catch (err) {
                        const cached = await db.getCacheValue<VesselWithStatus>(db.CACHE_KEYS.VESSEL_WITH_STATUS_BY_ID(id));
                        if (cached) return cached;
                        throw err;
                    }
                },
            }),
            // 2. Voyages List - return result so we can use it
            queryClient.fetchQuery({
                queryKey: voyageKeys.byVessel(id),
                queryFn: async (): Promise<Voyage[]> => {
                    try {
                        return await voyageService.fetchVoyagesByVesselIdNetwork(id);
                    } catch (err) {
                        const cached = await db.getCacheValue<Voyage[]>(db.CACHE_KEYS.VOYAGES_BY_VESSEL(id));
                        if (cached) return cached;
                        throw err;
                    }
                }
            }),
            // 3. Vessel Documents
            queryClient.prefetchQuery({
                queryKey: documentKeys.byVessel(id),
                queryFn: async () => {
                    try {
                        return await vesselService.fetchVesselDocumentsNetwork(id);
                    } catch (err) {
                        const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_VESSEL(id));
                        if (cached) return cached;
                        throw err;
                    }
                }
            }),
            // 4. Invoices (map to Invoice type during prefetch)
            queryClient.prefetchQuery({
                queryKey: invoiceKeys.byVessel(id),
                queryFn: async () => {
                    try {
                        const raw = await invoiceService.fetchInvoicesByVesselNetwork(id);
                        return (raw || []).map(mapBackendInvoice);
                    } catch (err) {
                        const cached = await db.getCacheValue<any[]>(db.CACHE_KEYS.INVOICES_BY_VESSEL(id));
                        if (cached) return cached.map(mapBackendInvoice);
                        throw err;
                    }
                }
            })
        ]);

        // Phase 2: Prefetch each voyage's details and documents
        if (voyages && voyages.length > 0) {
            await Promise.all(voyages.map(voyage =>
                Promise.all([
                    // Voyage details
                    queryClient.prefetchQuery({
                        queryKey: voyageDetailKeys.detail(voyage.id),
                        queryFn: async () => {
                            try {
                                return await voyageService.fetchVoyageDetailsByIdNetwork(voyage.id);
                            } catch (err) {
                                const cached = await db.getCacheValue<VoyageWithDetails>(db.CACHE_KEYS.VOYAGE_DETAILS_BY_ID(voyage.id));
                                if (cached) return cached;
                                throw err;
                            }
                        }
                    }),
                    // Voyage documents
                    queryClient.prefetchQuery({
                        queryKey: voyageDetailKeys.documents(voyage.id),
                        queryFn: async () => {
                            try {
                                return await voyageService.fetchVoyageDocumentsNetwork(voyage.id);
                            } catch (err) {
                                const cached = await db.getCacheValue<Document[]>(db.CACHE_KEYS.DOCUMENTS_BY_VOYAGE(voyage.id));
                                if (cached) return cached;
                                throw err;
                            }
                        }
                    })
                ])
            ));
        }
    };
}


