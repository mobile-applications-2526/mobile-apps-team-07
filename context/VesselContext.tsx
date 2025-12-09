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

  // Initialize database and load vessels
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load vessels
      const loadedVesselsWithStatus = await vesselService.getAllVesselsWithStatus();
      setVessels(loadedVesselsWithStatus.map(v => v.vessel));
      setVesselsWithStatus(loadedVesselsWithStatus);
      setIsInitialized(true);
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
      const loadedVesselsWithStatus = await vesselService.getAllVesselsWithStatus();
      setVesselsWithStatus(loadedVesselsWithStatus);
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
  const getVesselWithStatus = useCallback(async (id: number): Promise<VesselWithStatus| null> => {
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
    const updatedVessel = await vesselService.updateVessel(input);
    
    if (updatedVessel) {
      setVessels(prev => prev.map(v => v.id === input.id ? updatedVessel : v));
    }
    
    return updatedVessel;
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
