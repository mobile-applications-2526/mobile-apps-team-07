/**
 * useVesselVoyagesScreen Hook
 *
 * Business logic for the Vessel Voyages screen.
 * Handles voyage cycling, document verification, and data fetching.
 */

import { useState, useEffect, useCallback } from 'react';
import { useVesselDetails, useHaptics, useVoyageDetails } from '@/hooks';
import { hasMissingVoyageDocuments, getMissingDocumentsMessage } from '@/lib/vesselUtils';
import { VoyagePort, Cargo, CharterParty } from '@/types';
import { voyageService, portService, cargoService, charterService } from '@/services';
import { CreateVoyageInput, UpdateVoyageInput } from '@/services/voyage.service';
import { CreatePortInput, UpdatePortInput } from '@/services/port.service';
import { CreateCargoInput, UpdateCargoInput } from '@/services/cargo.service';

interface UseVesselVoyagesScreenReturn {
  /** The vessel data */
  vessel: ReturnType<typeof useVesselDetails>['vessel'];
  /** List of all voyages for this vessel */
  vesselVoyages: ReturnType<typeof useVesselDetails>['vesselVoyages'];
  /** Current voyage index */
  index: number;
  /** Current voyage details */
  voyageWithDetails: ReturnType<typeof useVoyageDetails>['voyageWithDetails'];
  /** Function to get documents for the voyage */
  getDocuments: ReturnType<typeof useVoyageDetails>['getDocuments'];
  /** Whether vessel data is loading */
  isLoadingVessel: boolean;
  /** Whether voyage details are loading */
  isLoadingVoyage: boolean;
  /** Error fetching voyage details */
  voyageError: ReturnType<typeof useVoyageDetails>['error'];
  /** Whether required documents are missing */
  missingDocs: boolean;
  /** Message about missing documents */
  missingDocsMessage: string;
  /** Handler for cycling between voyages */
  handleCycleVoyage: (direction: 'next' | 'previous') => void;
  /** Handler for adding a new voyage */
  handleAddVoyage: () => void;
  /** Handler for refreshing voyage data */
  handleRefresh: () => void;
  /** Whether the create voyage sheet is visible */
  showCreateVoyageSheet: boolean;
  /** Set create voyage sheet visibility */
  setShowCreateVoyageSheet: (show: boolean) => void;
  /** Whether the add/edit port sheet is visible */
  showPortSheet: boolean;
  /** Set port sheet visibility */
  setShowPortSheet: (show: boolean) => void;
  /** Port being edited (null for new port) */
  editingPort: VoyagePort | null;
  /** Set the port being edited */
  setEditingPort: (port: VoyagePort | null) => void;
  /** Whether the add/edit cargo sheet is visible */
  showCargoSheet: boolean;
  /** Set cargo sheet visibility */
  setShowCargoSheet: (show: boolean) => void;
  /** Cargo being edited (null for new cargo) */
  editingCargo: Cargo | null;
  /** Set the cargo being edited */
  setEditingCargo: (cargo: Cargo | null) => void;
  /** Handler for creating a voyage */
  handleCreateVoyage: (input: CreateVoyageInput) => Promise<void>;
  /** Handler for opening add port sheet */
  handleAddPort: () => void;
  /** Handler for opening edit port sheet */
  handleEditPort: (port: VoyagePort) => void;
  /** Handler for saving a port (create or update) */
  handleSavePort: (input: CreatePortInput | UpdatePortInput) => Promise<void>;
  /** Handler for deleting a port */
  handleDeletePort: (portId: number) => Promise<void>;
  /** Handler for opening add cargo sheet */
  handleAddCargo: () => void;
  /** Handler for opening edit cargo sheet */
  handleEditCargo: (cargo: Cargo) => void;
  /** Handler for saving a cargo (create or update) */
  handleSaveCargo: (input: CreateCargoInput | UpdateCargoInput) => Promise<void>;
  /** Handler for deleting a cargo */
  handleDeleteCargo: (cargoId: number) => Promise<void>;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** List of vessel charters for voyage creation */
  vesselCharters: CharterParty[];
}

/**
 * Custom hook for managing vessel voyages screen state and logic.
 *
 * Features:
 * - Voyage navigation (next/previous)
 * - Document verification
 * - Automatic index bounds checking
 * - Haptic feedback integration
 * - CRUD operations for voyages, ports, and cargo
 *
 * @returns Screen state and handlers
 */
export function useVesselVoyagesScreen(): UseVesselVoyagesScreenReturn {
  const haptics = useHaptics();
  const [index, setIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  // Bottom sheet visibility state
  const [showCreateVoyageSheet, setShowCreateVoyageSheet] = useState(false);
  const [showPortSheet, setShowPortSheet] = useState(false);
  const [showCargoSheet, setShowCargoSheet] = useState(false);

  // Editing state
  const [editingPort, setEditingPort] = useState<VoyagePort | null>(null);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  // Charters for voyage creation
  const [vesselCharters, setVesselCharters] = useState<CharterParty[]>([]);

  const {
    vessel,
    vesselVoyages,
    isLoading: isLoadingVessel,
    hasQ88,
    hasFormC,
    refreshVesselVoyages,
  } = useVesselDetails();

  // Document verification
  const missingDocs = hasMissingVoyageDocuments(vessel, hasQ88, hasFormC);
  const missingDocsMessage = getMissingDocumentsMessage(vessel);

  // Get current voyage ID and fetch its details
  const currentVoyageId = vesselVoyages?.[index]?.id;
  const {
    voyageWithDetails,
    getDocuments,
    isLoading: isLoadingVoyage,
    error: voyageError,
    refresh,
  } = useVoyageDetails(currentVoyageId);

  // Reset index if voyages list changes and current index is out of bounds
  useEffect(() => {
    if (vesselVoyages.length > 0 && index >= vesselVoyages.length) {
      setIndex(0);
    }
  }, [vesselVoyages.length, index]);

  // Fetch charters for voyage creation
  useEffect(() => {
    if (vessel?.id) {
      charterService.getVesselCharters(vessel.id).then(setVesselCharters);
    }
  }, [vessel?.id]);

  const handleCycleVoyage = (direction: 'next' | 'previous') => {
    haptics.lightImpact();
    setIndex((prevIndex) => {
      if (direction === 'next') {
        return Math.max(prevIndex - 1, 0);
      } else {
        return Math.min(prevIndex + 1, vesselVoyages.length - 1);
      }
    });
  };

  const handleAddVoyage = () => {
    haptics.mediumImpact();
    setShowCreateVoyageSheet(true);
  };

  const handleRefresh = () => {
    haptics.lightImpact();
    refresh();
  };

  // Voyage CRUD
  const handleCreateVoyage = useCallback(
    async (input: CreateVoyageInput) => {
      if (!vessel) return;
      setIsSaving(true);
      try {
        await voyageService.createVoyage(input);
        haptics.successNotification();
        setShowCreateVoyageSheet(false);
        // Refresh to get the new voyage
        await refreshVesselVoyages();
        // Set index to 0 to show the newest voyage
        setIndex(0);
      } catch (error) {
        haptics.errorNotification();
        console.error('Failed to create voyage:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [vessel, haptics, refreshVesselVoyages]
  );

  // Port CRUD
  const handleAddPort = useCallback(() => {
    haptics.mediumImpact();
    setEditingPort(null);
    setShowPortSheet(true);
  }, [haptics]);

  const handleEditPort = useCallback(
    (port: VoyagePort) => {
      haptics.lightImpact();
      setEditingPort(port);
      setShowPortSheet(true);
    },
    [haptics]
  );

  const handleSavePort = useCallback(
    async (input: CreatePortInput | UpdatePortInput) => {
      if (!currentVoyageId) return;
      setIsSaving(true);
      try {
        if (editingPort) {
          // Update existing port
          await portService.updatePort(editingPort.id, currentVoyageId, input);
        } else {
          // Create new port
          await portService.createPort(currentVoyageId, input as CreatePortInput);
        }
        haptics.successNotification();
        setShowPortSheet(false);
        setEditingPort(null);
        await refresh();
      } catch (error) {
        haptics.errorNotification();
        console.error('Failed to save port:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [currentVoyageId, editingPort, haptics, refresh]
  );

  const handleDeletePort = useCallback(
    async (portId: number) => {
      if (!currentVoyageId) return;
      setIsSaving(true);
      try {
        await portService.deletePort(portId, currentVoyageId);
        haptics.successNotification();
        setShowPortSheet(false);
        setEditingPort(null);
        await refresh();
      } catch (error) {
        haptics.errorNotification();
        console.error('Failed to delete port:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [currentVoyageId, haptics, refresh]
  );

  // Cargo CRUD
  const handleAddCargo = useCallback(() => {
    haptics.mediumImpact();
    setEditingCargo(null);
    setShowCargoSheet(true);
  }, [haptics]);

  const handleEditCargo = useCallback(
    (cargo: Cargo) => {
      haptics.lightImpact();
      setEditingCargo(cargo);
      setShowCargoSheet(true);
    },
    [haptics]
  );

  const handleSaveCargo = useCallback(
    async (input: CreateCargoInput | UpdateCargoInput) => {
      if (!currentVoyageId) return;
      setIsSaving(true);
      try {
        if (editingCargo) {
          // Update existing cargo
          await cargoService.updateCargo(editingCargo.id, currentVoyageId, input);
        } else {
          // Create new cargo
          await cargoService.createCargo(currentVoyageId, input as CreateCargoInput);
        }
        haptics.successNotification();
        setShowCargoSheet(false);
        setEditingCargo(null);
        await refresh();
      } catch (error) {
        haptics.errorNotification();
        console.error('Failed to save cargo:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [currentVoyageId, editingCargo, haptics, refresh]
  );

  const handleDeleteCargo = useCallback(
    async (cargoId: number) => {
      if (!currentVoyageId) return;
      setIsSaving(true);
      try {
        await cargoService.deleteCargo(cargoId, currentVoyageId);
        haptics.successNotification();
        setShowCargoSheet(false);
        setEditingCargo(null);
        await refresh();
      } catch (error) {
        haptics.errorNotification();
        console.error('Failed to delete cargo:', error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [currentVoyageId, haptics, refresh]
  );

  return {
    vessel,
    vesselVoyages,
    index,
    voyageWithDetails,
    getDocuments,
    isLoadingVessel,
    isLoadingVoyage,
    voyageError,
    missingDocs,
    missingDocsMessage,
    handleCycleVoyage,
    handleAddVoyage,
    handleRefresh,
    // Bottom sheet state
    showCreateVoyageSheet,
    setShowCreateVoyageSheet,
    showPortSheet,
    setShowPortSheet,
    editingPort,
    setEditingPort,
    showCargoSheet,
    setShowCargoSheet,
    editingCargo,
    setEditingCargo,
    // CRUD handlers
    handleCreateVoyage,
    handleAddPort,
    handleEditPort,
    handleSavePort,
    handleDeletePort,
    handleAddCargo,
    handleEditCargo,
    handleSaveCargo,
    handleDeleteCargo,
    isSaving,
    vesselCharters,
  };
}
