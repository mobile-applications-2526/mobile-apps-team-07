/**
 * Hooks Index
 * 
 * Barrel exports for all custom hooks.
 */


export { useAnimatedModal } from './useAnimatedModal';
export { useToast } from './useToast';
export { useHaptics } from './useHaptics';
export { useVesselDocuments } from './useVesselDocuments';
export { useVoyageDetails } from './useVoyageDetails';

// Re-export context hooks
export { useVessels } from '@/context/VesselContext';
export { useVesselDetails } from '@/context/VesselDetailsContext';
