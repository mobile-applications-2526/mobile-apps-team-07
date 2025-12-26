/**
 * VesselContext
 * 
 * React context for managing vessel state throughout the application.
 * Uses the vessel service for database operations.
 */

import React, { createContext, useContext, useEffect, useCallback, useState, ReactNode } from 'react';
import { Vessel, VesselWithStatus, CreateVesselInput, Document, DocumentTypeCategory } from '@/types';
import { vesselService } from '@/services';
import { DOCUMENT_TYPES } from '@/constants';
import { useNetworkStatus } from './NetworkStatusContext';

// ============================================
// TYPES
// ============================================

interface VesselContextType {
  // State
  vessels: Vessel[];
  vesselsWithStatus: VesselWithStatus[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  // Whether data being shown is from cache because network fetch failed on startup
  isOfflineData: boolean;

  // Actions
  refreshVessels: () => Promise<void>;
  refreshVesselsWithStatus: () => Promise<void>
  getVessel: (id: number) => Promise<Vessel | null>;
  getVesselWithStatus: (id: number) => Promise<VesselWithStatus | null>
  createVessel: (input: CreateVesselInput) => Promise<Vessel>;
  updateVessel: (input: Vessel) => Promise<Vessel | null>;
  deleteVessel: (id: number) => Promise<boolean>;

  // Utilities
  imoExists: (imo: string) => Promise<boolean>;
  getAllImos: () => string[];
  searchVessels: (query: string) => Promise<Vessel[]>;
}

// ============================================
// CONTEXT
// ============================================

const VesselContext = createContext<VesselContextType | null>(null);

// ============================================
// HOOK
// ============================================

export function useVessels(): VesselContextType {
  const context = useContext(VesselContext);
  if (!context) {
    throw new Error('useVessels must be used within a VesselProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

interface VesselProviderProps {
  children: ReactNode;
}

export function VesselProvider({ children }: VesselProviderProps) {

  const [vesselsWithStatus, setVesselsWithStatus] = useState<VesselWithStatus[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineData, setIsOfflineData] = useState(false);
  const { setIsOffline } = useNetworkStatus();

  // Sync offline state to global NetworkStatus
  useEffect(() => {
    if (isInitialized && !isLoading) {
      setIsOffline(isOfflineData);
    }
  }, [isOfflineData, setIsOffline, isInitialized, isLoading]);

  // Initialize database and load vessels
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Prefer a fresh network fetch on startup. If it succeeds use that data; if it fails fall back to cache and mark offline.
      try {
        const fresh = await vesselService.fetchVesselsWithStatusNetwork();
        setVessels(fresh.map(v => v.vessel));
        setVesselsWithStatus(fresh);
        setIsOfflineData(false);
        setIsInitialized(true);
      } catch (networkErr) {
        // Network failed — try to load cached data and flag offline
        console.warn('Network fetch failed during initialization, falling back to cache:', networkErr);
        const cached = await vesselService.getAllVesselsWithStatus();
        setVessels(cached.map(v => v.vessel));
        setVesselsWithStatus(cached);
        setIsOfflineData(true);
        setIsInitialized(true);
      }
    } catch (err) {
      console.error('Failed to initialize:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh vessels from database
  const refreshVessels = useCallback(async () => {
    try {
      setIsLoading(true);
      const loadedVessels = await vesselService.getAllVessels();
      setVessels(loadedVessels);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh vessels:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh vessels');
    } finally {
      setIsLoading(false);
    }
  }, []);

  //Get All Vessels With Status
  const refreshVesselsWithStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      // Prefer network refresh; fall back to cache if network fails
      try {
        const fresh = await vesselService.fetchVesselsWithStatusNetwork();
        setVesselsWithStatus(fresh);
        setVessels(fresh.map(v => v.vessel));
        setIsOfflineData(false);
      } catch (networkErr) {
        console.warn('Network refresh failed, using cached data:', networkErr);
        const cached = await vesselService.getAllVesselsWithStatus();
        setVesselsWithStatus(cached);
        setVessels(cached.map(v => v.vessel));
        setIsOfflineData(true);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to refresh vessels with Status:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh vessels with Status');
    } finally {
      setIsLoading(false);
    }
  }, []);


  // Get single vessel by ID
  const getVessel = useCallback(async (id: number): Promise<Vessel | null> => {
    try {
      return await vesselService.getVesselById(id);
    } catch (err) {
      console.error('Failed to get vessel:', err);
      return null;
    }
  }, []);

  // Get single vessel by ID
  const getVesselWithStatus = useCallback(async (id: number): Promise<VesselWithStatus | null> => {
    try {
      return await vesselService.getVesselByIdWithStatus(id);
    } catch (err) {
      console.error('Failed to get vessel:', err);
      return null;
    }
  }, []);

  // Create new vessel
  const createVessel = useCallback(async (input: CreateVesselInput): Promise<Vessel> => {
    const newVessel = await vesselService.createVessel(input);
    setVessels(prev => [newVessel, ...prev]);
    return newVessel;
  }, []);

  // Update existing vessel
  const updateVessel = useCallback(async (input: Vessel): Promise<Vessel | null> => {
    // Optimistic update: apply change locally immediately so UI reflects the edit
    setVessels(prev => prev.map(v => v.id === input.id ? input : v));
    setVesselsWithStatus(prev => prev.map(vws => vws.vessel.id === input.id ? { ...vws, vessel: input } : vws));

    try {
      const updatedVessel = await vesselService.updateVessel(input);
      if (updatedVessel) {
        // Replace with authoritative response
        setVessels(prev => prev.map(v => v.id === input.id ? updatedVessel : v));
        setVesselsWithStatus(prev => prev.map(vws => vws.vessel.id === input.id ? { ...vws, vessel: updatedVessel } : vws));
        return updatedVessel;
      }
      // If backend not implemented yet, keep optimistic result
      return input;
    } catch (err) {
      console.error('Failed to update vessel in service:', err);
      // On error, keep optimistic change (could also revert) and return null to signal failure
      return null;
    }
  }, []);

  // Delete vessel
  const deleteVessel = useCallback(async (id: number): Promise<boolean> => {
    const success = await vesselService.deleteVessel(id);

    if (success) {
      setVesselsWithStatus(prev => prev.filter(v => v.vessel.id !== id));
      setVessels(prev => prev.filter(v => v.id !== id));
    }

    return success;
  }, []);

  // Check if IMO exists
  const imoExists = useCallback(async (imo: string): Promise<boolean> => {
    return await vesselService.imoExists(imo);
  }, []);

  // Get all IMOs from current state (synchronous)
  const getAllImos = useCallback((): string[] => {
    return vessels.map(v => v.imoNumber);
  }, [vessels]);

  // Search vessels
  const searchVessels = useCallback(async (query: string): Promise<Vessel[]> => {
    return await vesselService.searchVessels(query);
  }, []);


  const value: VesselContextType = {
    vessels,
    vesselsWithStatus,
    isLoading,
    isInitialized,
    error,
    isOfflineData,
    refreshVessels,
    refreshVesselsWithStatus,
    getVessel,
    getVesselWithStatus,
    createVessel,
    updateVessel,
    deleteVessel,
    imoExists,
    getAllImos,
    searchVessels,
  };

  return (
    <VesselContext.Provider value={value}>
      {children}
    </VesselContext.Provider>
  );
}

export default VesselProvider;
