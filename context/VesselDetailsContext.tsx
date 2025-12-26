import { noonReportService, vesselService, voyageService } from "@/services";
import { on, off } from '@/lib/events';
import { isGasCarrier } from '@/lib/utils';
import { CharterParty, Document, DocumentTypeCategory, NoonReport, Vessel, VesselStatus, Voyage } from "@/types";
import { useLocalSearchParams } from "expo-router";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

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

  refreshVessel: () => Promise<void>,
  refreshVesselVoyages: () => Promise<void>,
  getLatestNoonReport: (id: number) => Promise<NoonReport | null>
  vesselHasDocument: (id: number, document: DocumentTypeCategory) => Promise<boolean>,
  getVesselDocuments: (id: number) => Promise<Document[]>
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVesselDocuments = useCallback(async (vesselId: number): Promise<Document[]> => {
    return await vesselService.getVesselDocuments(vesselId);
  }, [])

  const vesselHasDocument = useCallback(async (vesselId: number, document: DocumentTypeCategory): Promise<boolean> => {
    const documents = await vesselService.getVesselDocuments(vesselId);
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

      const vesselWithStatus = await vesselService.getVesselByIdWithStatus(id);
      if (!vesselWithStatus) {
        throw new Error('Cannot find vessel with id ' + id);
      }

      if (!isMounted) return;

      setVessel(vesselWithStatus.vessel);
      setVesselStatus(vesselWithStatus.latestStatus);
      setActiveVoyage(vesselWithStatus.activeVoyage);
      setActiveCharterParty(vesselWithStatus.activeCharter);

      const loadedVoyages = await voyageService.getVoyagesByVesselId(id);
      if (!isMounted) return;
      setVesselVoyages(loadedVoyages);

      const documents = await vesselService.getVesselDocuments(id);
      const loadHasQ88 = documents.some(d => d.documentType === 'Q88');
      const loadHasFormC = documents.some(d => d.documentType === 'FormC');
      if (!isMounted) return;
      setHasQ88(loadHasQ88);
      setHasFormC(loadHasFormC);

      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize:', err);
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

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
        if (!payload || typeof payload.vesselId === 'undefined') return;
        if (Number(payload.vesselId) !== id) return;

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

    const unsub = on('documents:updated', handler);
    return () => {
      try { unsub(); } catch (e) { off('documents:updated', handler); }
    };
  }, [id]);

  // Derived state
  const isGasCarrierVessel = vessel ? isGasCarrier(vessel) : false;
  const isLocked = isGasCarrierVessel ? !(hasQ88 && hasFormC) : !hasQ88;

  const refreshVessel = useCallback(async () => {
    try {
      setIsLoading(true);
      const vesselWithStatus = await vesselService.getVesselByIdWithStatus(id);
      if (!vesselWithStatus)
        throw new Error('Cannot find vessel with id ' + id);

      setVessel(vesselWithStatus.vessel);
      setVesselStatus(vesselWithStatus.latestStatus)
      setError(null);
    } catch (err) {
      console.error('Failed to refresh vessel:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh vessel');
    } finally {
      setIsLoading(false);
    }
  }, [id])

  const refreshVesselVoyages = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedVoyages = await voyageService.getVoyagesByVesselId(id);
      setVesselVoyages(loadedVoyages);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh voyages:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh voyages');
    } finally {
      setIsLoading(false);
    }
  }, [id])

  const value: VesselDetailsContextType = {
    vessel,
    activeVoyage,
    activeCharterParty,
    vesselStatus,
    vesselVoyages,
    hasQ88,
    hasFormC,
    isLoading,
    isInitialized,
    error,
    isLocked,
    isGasCarrier: isGasCarrierVessel,

    refreshVessel,
    refreshVesselVoyages,
    getLatestNoonReport,
    vesselHasDocument,
    getVesselDocuments
  }

  return (
    <VesselDetailContext.Provider value={value}>
      {children}
    </VesselDetailContext.Provider>
  );
}

export default VesselDetailsProvider;
