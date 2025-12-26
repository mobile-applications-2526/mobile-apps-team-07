import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/common';

export interface DataRowProps {
    label: string;
    value: string;
}

export function DataRow({ label, value }: DataRowProps) {
    return (
        <View className="flex-row justify-between py-2">
            <ThemedText className="text-sm text-gray-500 dark:text-gray-400">
                {label}:
            </ThemedText>
            <ThemedText className="text-sm font-medium text-right flex-1 ml-4">
                {value}
            </ThemedText>
        </View>
    );
}
