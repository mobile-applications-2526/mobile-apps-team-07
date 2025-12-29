import { noonReportService, vesselService, voyageService } from "@/services";
import { on, off } from '@/lib/events';
import { isGasCarrier } from '@/lib/utils';
import { CharterParty, Document, DocumentType, NoonReport, Vessel, VesselStatus, Voyage } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";
import { useNetworkStatus } from './NetworkStatusContext';


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
  isRefreshing: boolean
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
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [vesselStatus, setVesselStatus] = useState<VesselStatus | null>(null);
  const [activeVoyage, setActiveVoyage] = useState<Voyage | null>(null);
  const [activeCharterParty, setActiveCharterParty] = useState<CharterParty | null>(null);
  const [vesselVoyages, setVesselVoyages] = useState<Voyage[]>([]);
  const [hasQ88, setHasQ88] = useState<boolean>(false);
  const [hasFormC, setHasFormC] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const { setIsOffline } = useNetworkStatus();

  // Sync offline state to global NetworkStatus context
  useEffect(() => {
    if (isInitialized && !isLoading) {
      setIsOffline(isOfflineData);
    }
  }, [isOfflineData, setIsOffline, isInitialized, isLoading]);
  const getDocuments = useCallback(async (): Promise<Document[]> => {
    return await vesselService.getVesselDocuments(id);
  }, [])

  const vesselHasDocument = useCallback(async (document: DocumentType): Promise<boolean> => {
    const documents = await vesselService.getVesselDocuments(id);
    return documents.some(d => d.documentType == document);
  }, [])

  const getLatestNoonReport = useCallback(async (vesselId: number): Promise<NoonReport | null> => {
    return await noonReportService.getLatestNoonReportByVesselId(vesselId);
  }, [])

  const initializeData = async (isMounted: boolean) => {
    if (!id || isNaN(id)) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      let offline = false;

      // 1. VESSEL DETAILS
      try {
        const fresh = await vesselService.fetchVesselByIdWithStatusNetwork(id);
        if (fresh) {
          if (!isMounted) return;
          setVessel(fresh.vessel);
          setVesselStatus(fresh.latestStatus);
          setActiveVoyage(fresh.activeVoyage);
          setActiveCharterParty(fresh.activeCharter);
        }
      } catch (networkError) {
        console.warn('Network failed for vessel details, falling back to cache');
        offline = true;

        const cached = await vesselService.getVesselByIdWithStatus(id);
        if (cached) {
          if (!isMounted) return;
          setVessel(cached.vessel);
          setVesselStatus(cached.latestStatus);
          setActiveVoyage(cached.activeVoyage);
          setActiveCharterParty(cached.activeCharter);
        } else {
          throw new Error('No data available (offline and no cache)');
        }
      }

      // 2. VOYAGES
      try {
        const freshVoyages = await voyageService.fetchVoyagesByVesselIdNetwork(id);
        if (isMounted) setVesselVoyages(freshVoyages);
      } catch (e) {
        console.warn('Network failed for voyages, falling back to cache');
        offline = true;
        // Fallback
        const cachedVoyages = await voyageService.getVoyagesByVesselId(id);
        if (isMounted) setVesselVoyages(cachedVoyages);
      }

      // 3. DOCUMENTS
      try {
        const freshDocs = await vesselService.fetchVesselDocumentsNetwork(id);
        if (isMounted) processDocuments(freshDocs);
      } catch (e) {
        console.warn('Network failed for documents, falling back to cache');
        offline = true;
        const cachedDocs = await vesselService.getVesselDocuments(id);
        if (isMounted) processDocuments(cachedDocs);
      }

      setIsOfflineData(offline);
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize:', err);
      // Even if initialization fails completely, if we rendered something from cache, maybe don't error out completely?
      // But here the first try-catch fallback logic throws if NO cache. So this catch is valid for "No Data at all".
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  const processDocuments = (documents: Document[]) => {
    const loadHasQ88 = documents.some(d => d.documentType === 'Q88');
    const loadHasFormC = documents.some(d => d.documentType === 'FormC');
    setHasQ88(loadHasQ88);
    setHasFormC(loadHasFormC);
  }

  useEffect(() => {
    let isMounted = true;

    initializeData(isMounted);

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Listen for document updates so we can refresh the 'hasQ88' / 'hasFormC' flags
  useEffect(() => {
    const handler = async (payload: any) => {
      try {
        if (!payload || typeof payload.subjectId === 'undefined') return;
        if (Number(payload.subjectId) !== id) return;

        // Recompute documents -> hasQ88 / hasFormC
        const docs = await vesselService.getVesselDocuments(id);
        const loadHasQ88 = docs.some(d => d.documentType === 'Q88');
        const loadHasFormC = docs.some(d => d.documentType === 'FormC');
        setHasQ88(loadHasQ88);
        setHasFormC(loadHasFormC);
      } catch (err) {
        console.warn('Failed to refresh documents after upload event', err);
      }
    };

    const unsub = on('vessels:documents:updated', handler);
    return () => {
      try { unsub(); } catch (e) { off('vessels:documents:updated', handler); }
    };
  }, [id]);

  // Derived state
  const isGasCarrierVessel = vessel ? isGasCarrier(vessel) : false;
  const isLocked = isGasCarrierVessel ? !(hasQ88 && hasFormC) : !hasQ88;

  const refreshVessel = useCallback(async () => {
    try {
      if (!isInitialized) setIsLoading(true);
      else setIsRefreshing(true);

      const vesselWithStatus = await vesselService.getVesselByIdWithStatus(id);
      if (!vesselWithStatus)
        throw new Error('Cannot find vessel with id ' + id);

      setVessel(vesselWithStatus.vessel);
      setVesselStatus(vesselWithStatus.latestStatus)
      setError(null);
    } catch (err) {
      console.error('Failed to refresh vessel:', err);
      // Don't overwrite main error state on background refresh fail
      if (!isInitialized) setError(err instanceof Error ? err.message : 'Failed to refresh vessel');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, isInitialized])

  const refreshVesselVoyages = useCallback(async () => {
    try {
      if (!isInitialized) setIsLoading(true);
      else setIsRefreshing(true);

      const loadedVoyages = await voyageService.getVoyagesByVesselId(id);
      setVesselVoyages(loadedVoyages);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh voyages:', err);
      if (!isInitialized) setError(err instanceof Error ? err.message : 'Failed to refresh voyages');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, isInitialized])

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
    getDocuments
  }

  return (
    <VesselDetailContext.Provider value={value}>
      {children}
    </VesselDetailContext.Provider>
  );
}

export default VesselDetailsProvider;
