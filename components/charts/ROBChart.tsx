/**
 * ROB (Remaining On Board) Chart
 *
 * Shows fuel ROB with progress bar and projected depletion.
 * Uses React Native views for compatibility.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { BunkerInventory, FuelType } from '@/types';

interface ROBData {
  date: Date;
  bunkerInventory: BunkerInventory[];
}

interface ROBChartProps {
  data: ROBData[];
  fuelType?: FuelType;
  height?: number;
  showProjection?: boolean;
  minimumThreshold?: number; // MT
}

const FUEL_COLORS: Record<FuelType, string> = {
  HFO: '#FF6B6B',
  LSFO: '#4ECDC4',
  MGO: '#45B7D1',
  MDO: '#96CEB4',
  ULSFO: '#FFEAA7',
};

const FUEL_NAMES: Record<FuelType, string> = {
  HFO: 'Heavy Fuel Oil',
  LSFO: 'Low Sulphur FO',
  MGO: 'Marine Gas Oil',
  MDO: 'Marine Diesel',
  ULSFO: 'Ultra Low Sulphur',
};

export function ROBChart({
  data,
  fuelType = 'LSFO',
  height = 220,
  showProjection = true,
  minimumThreshold = 100,
}: ROBChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Process data for the selected fuel type
  const { robHistory, currentRob, avgConsumption, daysRemaining, maxRob } = useMemo(() => {
    const robData: { date: Date; rob: number }[] = [];
    let totalConsumption = 0;
    let consumptionCount = 0;
    let maxVal = 0;

    data.forEach((entry) => {
      const inventory = entry.bunkerInventory?.find((b) => b.fuelType === fuelType);
      if (inventory) {
        robData.push({
          date: entry.date,
          rob: inventory.robMt,
        });
        if (inventory.robMt > maxVal) maxVal = inventory.robMt;
        if (inventory.consumedMt && inventory.consumedMt > 0) {
          totalConsumption += inventory.consumedMt;
          consumptionCount++;
        }
      }
    });

    // Calculate average daily consumption
    const avgDailyConsumption = consumptionCount > 0 ? totalConsumption / consumptionCount : 0;
    const latestRob = robData.length > 0 ? robData[robData.length - 1].rob : 0;
    const days = avgDailyConsumption > 0 ? Math.floor(latestRob / avgDailyConsumption) : 0;

    return {
      robHistory: robData.slice(-14), // Last 14 days
      currentRob: latestRob,
      avgConsumption: avgDailyConsumption,
      daysRemaining: days,
      maxRob: maxVal || 1000,
    };
  }, [data, fuelType]);

  if (!robHistory.length) {
    return (
      <View style={[styles.container, { height, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
        <Text style={[styles.noData, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          No ROB data available for {FUEL_NAMES[fuelType]}
        </Text>
      </View>
    );
  }

  // Calculate bar heights
  const barWidth = Math.min(20, (screenWidth - 80) / robHistory.length - 4);
  const chartHeight = height - 120;

  // Status color based on days remaining
  const getStatusColor = () => {
    if (daysRemaining >= 14) return '#22c55e';
    if (daysRemaining >= 7) return '#eab308';
    return '#ef4444';
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
            {fuelType} ROB
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Remaining On Board
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={[styles.statValue, { color: FUEL_COLORS[fuelType] }]}>
            {currentRob.toFixed(1)} MT
          </Text>
          <Text style={[styles.statLabel, { color: getStatusColor() }]}>
            ~{daysRemaining} days remaining
          </Text>
        </View>
      </View>

      {/* Progress bar showing current ROB vs max */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, (currentRob / maxRob) * 100)}%`,
                backgroundColor: FUEL_COLORS[fuelType],
              },
            ]}
          />
          {/* Minimum threshold marker */}
          <View
            style={[
              styles.thresholdMarker,
              { left: `${(minimumThreshold / maxRob) * 100}%` },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            0 MT
          </Text>
          <Text style={[styles.progressLabel, { color: '#ef4444' }]}>
            Min: {minimumThreshold} MT
          </Text>
          <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {maxRob.toFixed(0)} MT
          </Text>
        </View>
      </View>

      {/* Simple bar chart showing ROB trend */}
      <View style={[styles.chartArea, { height: chartHeight }]}>
        <View style={styles.barsContainer}>
          {robHistory.map((day, index) => {
            const barHeight = (day.rob / maxRob) * chartHeight * 0.9;
            const isLast = index === robHistory.length - 1;
            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(2, barHeight),
                      width: barWidth,
                      backgroundColor: isLast ? FUEL_COLORS[fuelType] : isDark ? '#4b5563' : '#d1d5db',
                      opacity: isLast ? 1 : 0.6,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Footer with consumption rate */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <View style={[styles.footerDot, { backgroundColor: FUEL_COLORS[fuelType] }]} />
          <Text style={[styles.footerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Avg consumption: {avgConsumption.toFixed(1)} MT/day
          </Text>
        </View>
        {showProjection && (
          <View style={styles.footerItem}>
            <View style={[styles.footerDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.footerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              Min threshold: {minimumThreshold} MT
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stats: {
    alignItems: 'flex-end',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  thresholdMarker: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#ef4444',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 10,
  },
  chartArea: {
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  footerText: {
    fontSize: 11,
  },
  noData: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 40,
  },
});

export default ROBChart;
