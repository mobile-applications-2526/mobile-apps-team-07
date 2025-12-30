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

export function formatValue(value: string | number | null | undefined, suffix: string = ''): string {
  if (value === null || value === undefined || value === '') return '-';
  return `${value}${suffix}`;
}

export function formatCurrency(amount: number, currency = 'USD') {
  try {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency} ${formatted}`;
  } catch (e) {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
}
