/**
 * Hooks Index
 * 
 * Barrel exports for all custom hooks.
 */


export { useAnimatedModal } from './useAnimatedModal';
export { useToast } from './useToast';
export { useHaptics } from './useHaptics';
export { useDocuments } from './useDocuments';
export { useVoyageDetails } from './useVoyageDetails';
export { useVesselDetails } from '@/context/VesselDetailsContext';
export * from './useFleetOverview';
export * from './useInvoices';

// Re-export context hooks
export { useVessels } from '@/context/VesselContext';
// export { useVesselDetails } from '@/context/VesselDetailsContext'; // Removed duplicate
