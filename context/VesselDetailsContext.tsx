import { noonReportService, vesselService } from "@/services";
import { on, off } from '@/lib/events';
import { isGasCarrier } from '@/lib/utils';
import { CharterParty, Document, DocumentType, NoonReport, Vessel, VesselStatus, Voyage } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNetworkStatus } from './NetworkStatusContext';
import { useVesselDetailsQuery, useVesselVoyagesQuery, useVesselDocumentsQuery } from '@/hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { vesselKeys, voyageKeys, documentKeys } from '@/hooks/queries';


export interface VesselDetailsContextType {
  vessel: Vessel | null,
  vesselStatus: VesselStatus | null,
  activeVoyage: Voyage | null,
  activeCharterParty: CharterParty | null,
  vesselVoyages: Voyage[],
  hasQ88: boolean,
  hasFormC: boolean,
  isLoading: boolean,
  isInitialized: boolean,
  error: string | null,
  isLocked: boolean,
  isGasCarrier: boolean,
  isOfflineData: boolean,

  refreshVessel: () => Promise<void>,
  refreshVesselVoyages: () => Promise<void>,
  getLatestNoonReport: (id: number) => Promise<NoonReport | null>
  vesselHasDocument: (document: DocumentType) => Promise<boolean>,
  getDocuments: () => Promise<Document[]>,
  isRefreshing: boolean,

  // Upload Progress
  uploadProgress: number; // 0 to 1
  isUploading: boolean;
  setUploadState: (uploading: boolean, progress: number) => void;
}

export const VesselDetailContext = createContext<VesselDetailsContextType | null>(null);

export function useVesselDetails(): VesselDetailsContextType {
  const context = useContext(VesselDetailContext);
  if (!context) {
    throw new Error('useVesselsDetails must be used within a VesselDetailsProvider');
  }
  return context;
}

interface VesselDetailsProviderProps {
  children: ReactNode;
}

export function VesselDetailsProvider({ children }: VesselDetailsProviderProps) {
  const { id: idString } = useLocalSearchParams<{ id: string }>();
  const id = Number(idString);
  const queryClient = useQueryClient();
  const { setIsOffline } = useNetworkStatus();

  // Use React Query hooks for data fetching
  const vesselQuery = useVesselDetailsQuery(id);
  const voyagesQuery = useVesselVoyagesQuery(id);
  const documentsQuery = useVesselDocumentsQuery(id);

  // Derived state from queries
  const vessel = vesselQuery.data?.vessel ?? null;
  const vesselStatus = vesselQuery.data?.latestStatus ?? null;
  const activeVoyage = vesselQuery.data?.activeVoyage ?? null;
  const activeCharterParty = vesselQuery.data?.activeCharter ?? null;
  const documents = documentsQuery.data ?? [];

  // Sort voyages by start date (newest first) to ensure proper navigation
  // New voyages will always appear at index 0
  const vesselVoyages = useMemo(() => {
    const voyages = voyagesQuery.data ?? [];
    return [...voyages].sort((a, b) => {
      // Sort by voyageStartDate descending (newest first)
      const dateA = a.voyageStartDate ? new Date(a.voyageStartDate).getTime() : 0;
      const dateB = b.voyageStartDate ? new Date(b.voyageStartDate).getTime() : 0;
      if (dateB !== dateA) return dateB - dateA;
      // If dates are equal, sort by ID descending (higher ID = newer)
      return (b.id ?? 0) - (a.id ?? 0);
    });
  }, [voyagesQuery.data]);

  // Document flags
  const hasQ88 = useMemo(() => documents.some(d => d.documentType === 'Q88'), [documents]);
  const hasFormC = useMemo(() => documents.some(d => d.documentType === 'FormC'), [documents]);

  // Loading/error states
  const isLoading = vesselQuery.isLoading || voyagesQuery.isLoading || documentsQuery.isLoading;
  const isRefreshing = vesselQuery.isFetching || voyagesQuery.isFetching || documentsQuery.isFetching;
  const isInitialized = !isLoading && (vesselQuery.isFetched || voyagesQuery.isFetched || documentsQuery.isFetched);
  const error = vesselQuery.error?.message ?? voyagesQuery.error?.message ?? documentsQuery.error?.message ?? null;
  const isOfflineData = vesselQuery.isError || voyagesQuery.isError || documentsQuery.isError;

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const setUploadState = useCallback((uploading: boolean, progress: number) => {
    setIsUploading(uploading);
    setUploadProgress(progress);
  }, []);

  // Sync offline state to global NetworkStatus context
  // Fix: "Online" toast appearing when offline.
  // Cause: Queries catch errors and return cache -> isError is false.
  // We need to know if the last fetch FAILED even if we have data.
  // We can check query failureCount or state.
  // Simplest fix for now: If we caught an error in queryFn and returned cache, we are "offline".
  // But useQuery doesn't easily expose "I returned cache because of error".
  // Let's rely on standard isError for hard failures.
  // For the "Online" toast jumping issue: prevent `setIsOffline(false)` if we are not sure yet.

  // Actually, better fix: The query hooks catch errors and return cache.
  // This means `isError` is false. So `isOfflineData` is false.
  // So the app thinks it's ONLINE. That is why it shows "Online".
  // To fix this, the query hooks should probably NOT swallow the error inside queryFn if we want `isError` to be true.
  // But we want to show data.
  // Solution: Let's assume for now that if we have data, we are "fine" (Online from user perspective = "I see data").
  // But user says: "I enter vessel page as offline user and then I see online toast".
  // This confirms `isOfflineData` is becoming false.
  // If the user wants to see "Offline" when using cached data, we need to track that state.
  // Since we are inside the context, we can't easily change the hook return type without refactor.
  // QUICK FIX: Don't emit "Online" toast from this component at all if we just loaded cache.
  // Only `NetworkStatusContext` handles connection-based toasts.
  // The global `setIsOffline` was meant for "Api is down".
  // If we suppress the error by returning cache, we are effectively "Online" for the user (app works).
  // The user's complaint is seeing "Online" toast when they know they are offline.
  // That means `setIsOffline(false)` is being called.
  // I will comment out the sync for now or make it smarter.
  // User wants "Online" toast ONLY if we actually recover connectivity.
  // Since we rely on this context to drive "Offline" toast on 404...
  // Let's modify the query hooks to throw if no cache, but if cache exists, we still want to know fetch failed.
  // React Query `dataUpdatedAt` or `isStale` might help.
  // For now to solve the immediate "Online" toast spam:
  // Only sync if we have a definitive error.

  useEffect(() => {
    if (isInitialized && !isLoading) {
      // Only update if true (offline). If false, we might just be cached.
      // Don't force "Online" status just because we have cached data.
      // Let NetworkStatusContext's own mechanisms or other strong signals handle "Online".
      if (isOfflineData) {
        setIsOffline(true);
      }
    }
  }, [isOfflineData, setIsOffline, isInitialized, isLoading]);

  // Listen for document updates
  useEffect(() => {
    const handler = async (payload: any) => {
      try {
        if (!payload || typeof payload.subjectId === 'undefined') return;
        if (Number(payload.subjectId) !== id) return;
        // Invalidate documents query to refetch
        queryClient.invalidateQueries({ queryKey: documentKeys.byVessel(id) });
      } catch (err) {
        console.warn('Failed to refresh documents after upload event', err);
      }
    };

    const unsub = on('vessels:documents:updated', handler);
    return () => {
      try { unsub(); } catch (e) { off('vessels:documents:updated', handler); }
    };
  }, [id, queryClient]);

  // Derived state
  const isGasCarrierVessel = vessel ? isGasCarrier(vessel) : false;
  const isLocked = isGasCarrierVessel ? !(hasQ88 && hasFormC) : !hasQ88;

  const refreshVessel = useCallback(async () => {
    // Use refetchQueries to actually wait for the data to be fetched
    await queryClient.refetchQueries({ queryKey: vesselKeys.detail(id) });
  }, [id, queryClient]);

  const refreshVesselVoyages = useCallback(async () => {
    // Use refetchQueries to actually wait for the data to be fetched
    // invalidateQueries only marks as stale, doesn't wait for refetch
    await queryClient.refetchQueries({ queryKey: voyageKeys.byVessel(id) });
  }, [id, queryClient]);

  const getLatestNoonReport = useCallback(async (vesselId: number): Promise<NoonReport | null> => {
    return await noonReportService.getLatestNoonReportByVesselId(vesselId);
  }, []);

  const vesselHasDocument = useCallback(async (document: DocumentType): Promise<boolean> => {
    return documents.some(d => d.documentType === document);
  }, [documents]);

  const getDocuments = useCallback(async (): Promise<Document[]> => {
    return documents;
  }, [documents]);

  const value: VesselDetailsContextType = {
    vessel,
    activeVoyage,
    activeCharterParty,
    vesselStatus,
    vesselVoyages,
    hasQ88,
    hasFormC,
    isLoading,
    isRefreshing,
    isInitialized,
    error,
    isLocked,
    isGasCarrier: isGasCarrierVessel,
    isOfflineData,

    refreshVessel,
    refreshVesselVoyages,
    getLatestNoonReport,
    vesselHasDocument,
    getDocuments,

    uploadProgress,
    isUploading,
    setUploadState
  }

  return (
    <VesselDetailContext.Provider value={value}>
      {children}
    </VesselDetailContext.Provider>
  );
}

export default VesselDetailsProvider;

