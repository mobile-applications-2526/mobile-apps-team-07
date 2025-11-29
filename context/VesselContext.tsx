/**
 * VesselContext
 * 
 * React context for managing vessel state throughout the application.
 * Uses the vessel service for database operations.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Vessel, CreateVesselInput, UpdateVesselInput } from '@/types';
import { vesselService, databaseService } from '@/services';

// ============================================
// TYPES
// ============================================

interface VesselContextType {
  // State
  vessels: Vessel[];
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  refreshVessels: () => Promise<void>;
  getVessel: (id: number) => Promise<Vessel | null>;
  createVessel: (input: CreateVesselInput) => Promise<Vessel>;
  updateVessel: (id: number, input: UpdateVesselInput) => Promise<Vessel | null>;
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

      // Initialize database and seed data
      await databaseService.initializeDatabase();

      // Load vessels
      const loadedVessels = await vesselService.getAllVessels();
      setVessels(loadedVessels);
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

  // Get single vessel by ID
  const getVessel = useCallback(async (id: number): Promise<Vessel | null> => {
    try {
      return await vesselService.getVesselById(id);
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
  const updateVessel = useCallback(async (id: number, input: UpdateVesselInput): Promise<Vessel | null> => {
    const updatedVessel = await vesselService.updateVessel(id, input);
    
    if (updatedVessel) {
      setVessels(prev => prev.map(v => v.id === id ? updatedVessel : v));
    }
    
    return updatedVessel;
  }, []);

  // Delete vessel
  const deleteVessel = useCallback(async (id: number): Promise<boolean> => {
    const success = await vesselService.deleteVessel(id);
    
    if (success) {
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
    return vessels.map(v => v.imo);
  }, [vessels]);

  // Search vessels
  const searchVessels = useCallback(async (query: string): Promise<Vessel[]> => {
    return await vesselService.searchVessels(query);
  }, []);

  const value: VesselContextType = {
    vessels,
    isLoading,
    isInitialized,
    error,
    refreshVessels,
    getVessel,
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
