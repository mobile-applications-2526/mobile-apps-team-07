/**
 * useVesselVoyagesScreen Hook
 * 
 * Business logic for the Vessel Voyages screen.
 * Handles voyage cycling, document verification, and data fetching.
 */

import { useState, useEffect } from 'react';
import { useVesselDetails, useHaptics, useVoyageDetails } from '@/hooks';
import { hasMissingVoyageDocuments, getMissingDocumentsMessage } from '@/lib/vesselUtils';

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
}

/**
 * Custom hook for managing vessel voyages screen state and logic.
 * 
 * Features:
 * - Voyage navigation (next/previous)
 * - Document verification
 * - Automatic index bounds checking
 * - Haptic feedback integration
 * 
 * @returns Screen state and handlers
 */
export function useVesselVoyagesScreen(): UseVesselVoyagesScreenReturn {
  const haptics = useHaptics();
  const [index, setIndex] = useState<number>(0);

  const {
    vessel,
    vesselVoyages,
    isLoading: isLoadingVessel,
    hasQ88,
    hasFormC,
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
    // TODO: Navigate to add voyage screen
  };

  const handleRefresh = () => {
    haptics.lightImpact();
    refresh();
  };

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
  };
}
