import React from 'react';
import { View, useColorScheme } from 'react-native';
import { ThemedText } from '@/components/common';

export interface KPIGraphProps {
    title: string;
    actual: number | null;
    target: number | null;
    actualLabel: string;
    targetLabel: string;
    unit: string;
    status: 'green' | 'yellow' | 'red' | 'no_data' | 'no_cp' | 'no_voyage';
    isLowerBetter?: boolean;
}

export function KPIGraph({
    title,
    actual,
    target,
    actualLabel,
    targetLabel,
    unit,
    status,
    isLowerBetter = false,
}: KPIGraphProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const getStatusColor = () => {
        switch (status) {
            case 'green': return '#22c55e';
            case 'yellow': return '#eab308';
            case 'red': return '#ef4444';
            default: return '#9ca3af';
        }
    };

    const getStatusIcon = () => {
        switch (status) {
            case 'green': return '✓';
            case 'yellow': return '⚠';
            case 'red': return '✗';
            default: return '';
        }
    };

    const getProgress = () => {
        if (actual === null || target === null || target === 0) return 0;
        const ratio = actual / target;
        return Math.min(ratio, 1.5) / 1.5 * 100;
    };

    const getTargetPosition = () => {
        if (target === null || actual === null) return 66.67;
        const maxVal = Math.max(actual, target) * 1.5;
        return (target / maxVal) * 100;
    };

    if (status === 'no_data') {
        return (
            <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">{title}</ThemedText>
                <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 items-center">
                    <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
                        No data - awaiting noon report
                    </ThemedText>
                </View>
            </View>
        );
    }

    if (status === 'no_cp') {
        return (
            <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">{title}</ThemedText>
                <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 items-center">
                    <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
                        No CP linked
                    </ThemedText>
                </View>
            </View>
        );
    }

    if (status === 'no_voyage') {
        return (
            <View className="mb-4">
                <ThemedText className="text-sm font-medium mb-2">{title}</ThemedText>
                <View className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 items-center">
                    <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
                        No active voyage
                    </ThemedText>
                </View>
            </View>
        );
    }

    const statusColor = getStatusColor();
    const progress = getProgress();
    const targetPos = getTargetPosition();

    return (
        <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
                <ThemedText className="text-sm font-medium" style={{ flexShrink: 0 }}>{title}</ThemedText>
                <View className="flex-row items-center" style={{ flexShrink: 1, marginLeft: 8 }}>
                    <ThemedText className="text-sm font-bold" numberOfLines={1}>
                        {actual !== null ? `${actual.toFixed(1)}` : '-'}
                    </ThemedText>
                    <ThemedText className="text-xs text-gray-500 dark:text-gray-400 mx-1">vs</ThemedText>
                    <ThemedText className="text-sm text-gray-500 dark:text-gray-400" numberOfLines={1}>
                        {target !== null ? `${target}` : '-'}
                    </ThemedText>
                    <ThemedText className="text-xs text-gray-500 dark:text-gray-400 ml-1">{unit}</ThemedText>
                    <View
                        className="w-5 h-5 rounded-full items-center justify-center ml-2"
                        style={{ backgroundColor: statusColor, flexShrink: 0 }}
                    >
                        <ThemedText className="text-xs text-white font-bold">
                            {getStatusIcon()}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                <View
                    className="h-full rounded-full"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: statusColor,
                    }}
                />
                <View
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-600 dark:bg-gray-300"
                    style={{ left: `${targetPos}%` }}
                />
                <View
                    className="absolute w-3 h-3 rounded-full bg-gray-600 dark:bg-gray-300 border-2 border-white dark:border-gray-900"
                    style={{
                        left: `${targetPos}%`,
                        top: 0,
                        marginLeft: -6,
                    }}
                />
            </View>

            <View className="flex-row justify-between mt-1">
                <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                    {actualLabel}: {actual !== null ? `${actual} ${unit}` : '-'}
                </ThemedText>
                <ThemedText className="text-xs text-gray-500 dark:text-gray-400">
                    {targetLabel}: {target !== null ? `${target} ${unit}` : '-'}
                </ThemedText>
            </View>
        </View>
    );
}
