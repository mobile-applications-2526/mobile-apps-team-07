/**
 * Utility Functions Unit Tests
 *
 * Tests utility functions including:
 * - cn (className merge)
 * - isGasCarrier
 * - formatValue
 * - formatCurrency
 */

import { cn, isGasCarrier, formatValue, formatCurrency } from '../../lib/utils';

describe('Utility Functions', () => {
  // ============================================
  // cn (className merge)
  // ============================================
  describe('cn', () => {
    it('should merge class names', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('active-class');
    });

    it('should filter out falsy values', () => {
      const result = cn('base', false, null, undefined, 'other');
      expect(result).toBe('base other');
    });

    it('should merge conflicting Tailwind classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('should handle object syntax', () => {
      const result = cn({ 'active-class': true, 'inactive-class': false });
      expect(result).toBe('active-class');
    });
  });

  // ============================================
  // isGasCarrier
  // ============================================
  describe('isGasCarrier', () => {
    it('should return true for Gas Carrier vessel', () => {
      const vessel = { vesselType: 'Gas Carrier' };
      expect(isGasCarrier(vessel)).toBe(true);
    });

    it('should return true for gas carrier (lowercase)', () => {
      const vessel = { vesselType: 'gas carrier' };
      expect(isGasCarrier(vessel)).toBe(true);
    });

    it('should return true for GAS CARRIER (uppercase)', () => {
      const vessel = { vesselType: 'GAS CARRIER' };
      expect(isGasCarrier(vessel)).toBe(true);
    });

    it('should return true for vessel.type property', () => {
      const vessel = { type: 'Gas Carrier' };
      expect(isGasCarrier(vessel)).toBe(true);
    });

    it('should return true for vessel.vessel_type property', () => {
      const vessel = { vessel_type: 'Gas Carrier' };
      expect(isGasCarrier(vessel)).toBe(true);
    });

    it('should return false for Chemical Tanker', () => {
      const vessel = { vesselType: 'Chemical Tanker' };
      expect(isGasCarrier(vessel)).toBe(false);
    });

    it('should return false for MR Tanker', () => {
      const vessel = { vesselType: 'MR Tanker' };
      expect(isGasCarrier(vessel)).toBe(false);
    });

    it('should return false for null vessel', () => {
      expect(isGasCarrier(null)).toBe(false);
    });

    it('should return false for undefined vessel', () => {
      expect(isGasCarrier(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isGasCarrier({})).toBe(false);
    });

    it('should return false for vessel without type', () => {
      const vessel = { name: 'Test Vessel' };
      expect(isGasCarrier(vessel)).toBe(false);
    });

    it('should handle partial match correctly', () => {
      // "gas" without "carrier" should return false
      const vessel = { vesselType: 'Natural Gas' };
      expect(isGasCarrier(vessel)).toBe(false);
    });

    it('should handle whitespace in type', () => {
      const vessel = { vesselType: '  Gas Carrier  ' };
      expect(isGasCarrier(vessel)).toBe(true);
    });
  });

  // ============================================
  // formatValue
  // ============================================
  describe('formatValue', () => {
    it('should format value with suffix', () => {
      expect(formatValue(100, ' MT')).toBe('100 MT');
    });

    it('should format string value with suffix', () => {
      expect(formatValue('50', ' knots')).toBe('50 knots');
    });

    it('should return dash for null value', () => {
      expect(formatValue(null)).toBe('-');
    });

    it('should return dash for undefined value', () => {
      expect(formatValue(undefined)).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(formatValue('')).toBe('-');
    });

    it('should format zero value', () => {
      expect(formatValue(0, '%')).toBe('0%');
    });

    it('should handle value without suffix', () => {
      expect(formatValue(42)).toBe('42');
    });

    it('should handle decimal values', () => {
      expect(formatValue(3.14, ' m')).toBe('3.14 m');
    });

    it('should handle negative values', () => {
      expect(formatValue(-10, ' deg')).toBe('-10 deg');
    });

    it('should handle large numbers', () => {
      expect(formatValue(1000000, ' USD')).toBe('1000000 USD');
    });
  });

  // ============================================
  // formatCurrency
  // ============================================
  describe('formatCurrency', () => {
    it('should format USD amount correctly', () => {
      expect(formatCurrency(1000, 'USD')).toBe('USD 1,000.00');
    });

    it('should format EUR amount correctly', () => {
      expect(formatCurrency(1000, 'EUR')).toBe('EUR 1,000.00');
    });

    it('should default to USD when currency not specified', () => {
      expect(formatCurrency(500)).toBe('USD 500.00');
    });

    it('should format zero amount', () => {
      expect(formatCurrency(0, 'USD')).toBe('USD 0.00');
    });

    it('should format large amounts with commas', () => {
      expect(formatCurrency(1234567.89, 'USD')).toBe('USD 1,234,567.89');
    });

    it('should handle decimal amounts', () => {
      expect(formatCurrency(99.99, 'USD')).toBe('USD 99.99');
    });

    it('should round to two decimal places', () => {
      expect(formatCurrency(100.999, 'USD')).toBe('USD 101.00');
    });

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500, 'USD');
      expect(result).toContain('500.00');
    });

    it('should handle string numbers', () => {
      expect(formatCurrency(1000 as any, 'USD')).toBe('USD 1,000.00');
    });

    it('should handle NaN gracefully', () => {
      expect(formatCurrency(NaN, 'USD')).toBe('USD 0.00');
    });

    it('should handle null/undefined gracefully', () => {
      expect(formatCurrency(null as any, 'USD')).toBe('USD 0.00');
      expect(formatCurrency(undefined as any, 'USD')).toBe('USD 0.00');
    });

    it('should format small decimal amounts', () => {
      expect(formatCurrency(0.01, 'USD')).toBe('USD 0.01');
    });

    it('should format amounts with single decimal', () => {
      expect(formatCurrency(100.5, 'USD')).toBe('USD 100.50');
    });
  });
});
