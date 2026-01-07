/**
 * Water Chart
 *
 * Shows water inventory levels with progress bar visualization.
 * Uses React Native views for compatibility.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { WaterInventory, WaterType } from '@/types';

interface WaterData {
  date: Date;
  waterInventory: WaterInventory[];
}

interface WaterChartProps {
  data: WaterData[];
  height?: number;
  showFreshWaterOnly?: boolean;
}

const WATER_COLORS: Record<WaterType, string> = {
  FRESH: '#45B7D1',
  BALLAST: '#95A5A6',
  GRAY: '#7F8C8D',
  PRODUCED: '#3498DB',
};

const WATER_NAMES: Record<WaterType, string> = {
  FRESH: 'Fresh Water',
  BALLAST: 'Ballast Water',
  GRAY: 'Gray Water',
  PRODUCED: 'Produced Water',
};

export function WaterChart({
  data,
  height = 200,
  showFreshWaterOnly = true,
}: WaterChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Process water data
  const { waterHistory, latestWater, capacity, percentFull, avgConsumption } = useMemo(() => {
    const freshWaterData: { date: Date; quantity: number }[] = [];
    let currentFreshWater = 0;
    let waterCapacity = 0;
    let totalConsumption = 0;
    let consumptionCount = 0;

    data.forEach((entry) => {
      const freshInventory = entry.waterInventory?.find((w) => w.waterType === 'FRESH');
      if (freshInventory) {
        freshWaterData.push({
          date: entry.date,
          quantity: freshInventory.quantityMt,
        });
        currentFreshWater = freshInventory.quantityMt;
        if (freshInventory.capacityMt) {
          waterCapacity = freshInventory.capacityMt;
        }
        if (freshInventory.consumedMt && freshInventory.consumedMt > 0) {
          totalConsumption += freshInventory.consumedMt;
          consumptionCount++;
        }
      }
    });

    const percent = waterCapacity > 0 ? (currentFreshWater / waterCapacity) * 100 : 0;
    const avgDaily = consumptionCount > 0 ? totalConsumption / consumptionCount : 0;

    return {
      waterHistory: freshWaterData.slice(-14), // Last 14 days
      latestWater: currentFreshWater,
      capacity: waterCapacity,
      percentFull: percent,
      avgConsumption: avgDaily,
    };
  }, [data]);

  if (!waterHistory.length) {
    return (
      <View style={[styles.container, { height, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
        <Text style={[styles.noData, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          No water inventory data available
        </Text>
      </View>
    );
  }

  // Determine status color based on percentage
  const getStatusColor = () => {
    if (percentFull >= 50) return '#22c55e';
    if (percentFull >= 25) return '#eab308';
    return '#ef4444';
  };

  // Calculate days remaining
  const daysRemaining = avgConsumption > 0 ? Math.floor(latestWater / avgConsumption) : 0;

  // Bar dimensions
  const barWidth = Math.min(20, (screenWidth - 80) / waterHistory.length - 4);
  const chartHeight = height - 140;
  const maxQuantity = capacity || Math.max(...waterHistory.map((w) => w.quantity), 100);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
            Fresh Water
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Water On Board
          </Text>
        </View>
        <View style={styles.stats}>
          <Text style={[styles.statValue, { color: getStatusColor() }]}>
            {latestWater.toFixed(1)} MT
          </Text>
          <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            {percentFull.toFixed(0)}% of {capacity.toFixed(0)} MT
          </Text>
        </View>
      </View>

      {/* Main progress bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBg, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(100, percentFull)}%`,
                backgroundColor: getStatusColor(),
              },
            ]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            0%
          </Text>
          <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            50%
          </Text>
          <Text style={[styles.progressLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            100%
          </Text>
        </View>
      </View>

      {/* Bar chart showing water level trend */}
      <View style={[styles.chartArea, { height: chartHeight }]}>
        <View style={styles.barsContainer}>
          {waterHistory.map((day, index) => {
            const barHeight = (day.quantity / maxQuantity) * chartHeight * 0.9;
            const isLast = index === waterHistory.length - 1;
            return (
              <View key={index} style={styles.barColumn}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(2, barHeight),
                      width: barWidth,
                      backgroundColor: isLast ? WATER_COLORS.FRESH : isDark ? '#4b5563' : '#d1d5db',
                      opacity: isLast ? 1 : 0.6,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <View style={[styles.footerDot, { backgroundColor: WATER_COLORS.FRESH }]} />
          <Text style={[styles.footerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
            Consumption: {avgConsumption.toFixed(1)} MT/day
          </Text>
        </View>
        {daysRemaining > 0 && (
          <View style={styles.footerItem}>
            <View style={[styles.footerDot, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.footerText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              ~{daysRemaining} days remaining
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
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBg: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
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

export default WaterChart;
