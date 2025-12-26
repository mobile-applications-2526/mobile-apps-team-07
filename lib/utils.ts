import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isGasCarrier(vessel: any): boolean {
  if (!vessel) return false;
  const vesselTypeRaw = (
    vessel.vesselType ?? vessel.type ?? vessel.vessel_type ?? ''
  ).toString().trim().toLowerCase();
  return vesselTypeRaw.includes('gas') && vesselTypeRaw.includes('carrier');
}
