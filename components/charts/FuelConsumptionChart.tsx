/**
 * Fuel Consumption Chart
 *
 * Simple bar chart showing daily fuel consumption using native views.
 * Uses React Native views for compatibility.
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import { BunkerInventory, FuelType } from '@/types';

interface FuelConsumptionData {
  date: Date;
  bunkerInventory: BunkerInventory[];
}

interface FuelConsumptionChartProps {
  data: FuelConsumptionData[];
  fuelTypes?: FuelType[];
  height?: number;
  showLegend?: boolean;
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

export function FuelConsumptionChart({
  data,
  fuelTypes = ['LSFO', 'MGO'],
  height = 200,
  showLegend = true,
}: FuelConsumptionChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const screenWidth = Dimensions.get('window').width;

  // Process data for each fuel type
  const { chartData, maxConsumption, avgConsumption } = useMemo(() => {
    const consumptionByDay: { date: Date; consumption: Record<FuelType, number> }[] = [];
    let maxVal = 0;
    const totals: Record<FuelType, number> = { HFO: 0, LSFO: 0, MGO: 0, MDO: 0, ULSFO: 0 };
    let count = 0;

    data.forEach((entry) => {
      const dayConsumption: Record<FuelType, number> = { HFO: 0, LSFO: 0, MGO: 0, MDO: 0, ULSFO: 0 };

      entry.bunkerInventory?.forEach((bunker) => {
        if (bunker.consumedMt && bunker.consumedMt > 0) {
          dayConsumption[bunker.fuelType] = bunker.consumedMt;
          totals[bunker.fuelType] += bunker.consumedMt;
        }
      });

      const totalForDay = fuelTypes.reduce((sum, ft) => sum + dayConsumption[ft], 0);
      if (totalForDay > maxVal) maxVal = totalForDay;

      consumptionByDay.push({ date: entry.date, consumption: dayConsumption });
      if (totalForDay > 0) count++;
    });

    const avgByType: Record<FuelType, number> = { HFO: 0, LSFO: 0, MGO: 0, MDO: 0, ULSFO: 0 };
    if (count > 0) {
      fuelTypes.forEach((ft) => {
        avgByType[ft] = totals[ft] / count;
      });
    }

    return {
      chartData: consumptionByDay.slice(-7), // Last 7 days
      maxConsumption: maxVal || 50,
      avgConsumption: avgByType,
    };
  }, [data, fuelTypes]);

  if (!chartData.length) {
    return (
      <View style={[styles.container, { height, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
        <Text style={[styles.noData, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          No fuel consumption data available
        </Text>
      </View>
    );
  }

  const barWidth = Math.min(40, (screenWidth - 80) / chartData.length - 8);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#f9fafb' : '#111827' }]}>
          Daily Fuel Consumption
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
          Last 7 days (MT/day)
        </Text>
      </View>

      {/* Simple bar chart */}
      <View style={[styles.chartArea, { height: height - 100 }]}>
        <View style={styles.barsContainer}>
          {chartData.map((day, index) => (
            <View key={index} style={styles.barColumn}>
              <View style={styles.stackedBar}>
                {fuelTypes.map((ft) => {
                  const barHeight = (day.consumption[ft] / maxConsumption) * (height - 140);
                  return (
                    <View
                      key={ft}
                      style={[
                        styles.barSegment,
                        {
                          height: Math.max(0, barHeight),
                          backgroundColor: FUEL_COLORS[ft],
                          width: barWidth,
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <Text style={[styles.barLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {`${day.date.getDate()}/${day.date.getMonth() + 1}`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legend}>
          {fuelTypes.map((ft) => (
            <View key={ft} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: FUEL_COLORS[ft] }]} />
              <Text style={[styles.legendText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {ft}: {avgConsumption[ft].toFixed(1)} MT/day avg
              </Text>
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  chartArea: {
    justifyContent: 'flex-end',
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  barColumn: {
    alignItems: 'center',
  },
  stackedBar: {
    flexDirection: 'column-reverse',
  },
  barSegment: {
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
  },
  noData: {
    textAlign: 'center',
    fontSize: 14,
    paddingVertical: 40,
  },
});

export default FuelConsumptionChart;
