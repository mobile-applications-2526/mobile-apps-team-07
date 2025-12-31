/**
 * Voyage Constants
 *
 * Constants related to voyages, ports, and cargo configurations.
 */

import { PortType, VoyageStatus } from '@/types';

// ============================================
// VOYAGE STATUS
// ============================================

export const VOYAGE_STATUSES: VoyageStatus[] = [
  'Ballast',
  'Loading',
  'Laden',
  'Discharging',
  'Complete',
];

export const VOYAGE_STATUS_LABELS: Record<VoyageStatus, string> = {
  'Ballast': 'Ballast',
  'Loading': 'Loading',
  'Laden': 'Laden',
  'Discharging': 'Discharging',
  'Complete': 'Complete',
};

export const VOYAGE_STATUS_COLORS: Record<VoyageStatus, { bg: string; text: string }> = {
  'Ballast': { bg: 'bg-blue-500', text: 'text-blue-500' },
  'Loading': { bg: 'bg-amber-500', text: 'text-amber-500' },
  'Laden': { bg: 'bg-green-500', text: 'text-green-500' },
  'Discharging': { bg: 'bg-purple-500', text: 'text-purple-500' },
  'Complete': { bg: 'bg-gray-500', text: 'text-gray-500' },
};

export const VOYAGE_STATUS_OPTIONS = VOYAGE_STATUSES.map((status) => ({
  label: VOYAGE_STATUS_LABELS[status],
  value: status,
}));

// ============================================
// PORT TYPES
// ============================================

export const PORT_TYPES: PortType[] = ['Load', 'Discharge'];

export const PORT_TYPE_LABELS: Record<PortType, string> = {
  'Load': 'Loading',
  'Discharge': 'Discharge',
};

export const PORT_TYPE_COLORS: Record<PortType, { bg: string; text: string }> = {
  'Load': { bg: 'bg-green-500/20', text: 'text-green-500' },
  'Discharge': { bg: 'bg-blue-500/20', text: 'text-blue-500' },
};

export const PORT_TYPE_OPTIONS = PORT_TYPES.map((type) => ({
  label: PORT_TYPE_LABELS[type],
  value: type,
}));

// ============================================
// CARGO TYPES
// ============================================

export const CARGO_TYPES = [
  'LPG',
  'Propane',
  'Butane',
  'Ammonia',
  'VCM',
  'Ethylene',
  'Propylene',
  'MOGAS 95',
  'Naphtha',
  'Condensate',
] as const;

export const CARGO_TYPE_OPTIONS = CARGO_TYPES.map((type) => ({
  label: type,
  value: type,
}));

// ============================================
// IMO HAZARD CLASSES
// ============================================

export const IMO_HAZARD_CLASSES = [
  { value: '', label: 'None' },
  { value: '2.1', label: '2.1 - Flammable Gas' },
  { value: '2.2', label: '2.2 - Non-Flammable Gas' },
  { value: '2.3', label: '2.3 - Toxic Gas' },
  { value: '3', label: '3 - Flammable Liquid' },
  { value: '8', label: '8 - Corrosive' },
] as const;

// ============================================
// COMMON PORTS (for autocomplete)
// ============================================

export const COMMON_PORTS = [
  'Ras Laffan, Qatar',
  'Jebel Ali, UAE',
  'Singapore',
  'Fujairah, UAE',
  'Rotterdam, Netherlands',
  'Houston, USA',
  'Yokohama, Japan',
  'Ulsan, South Korea',
  'Mumbai, India',
  'Dammam, Saudi Arabia',
  'Dahej, India',
  'Hazira, India',
  'Chennai, India',
  'Kochi, India',
  'Mangalore, India',
] as const;
