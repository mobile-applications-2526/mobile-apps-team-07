/**
 * DocumentPlaceholder Component
 * 
 * Displays placeholder states for documents (N/A, error, unavailable, fallback).
 */

import React from 'react';
import { View } from 'react-native';
import { FileText, Newspaper } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import type { DocumentPlaceholderProps } from '@/types';

const DEFAULT_SIZE = { width: 80, height: 120 };

const PLACEHOLDER_CONFIG = {
    na: {
        icon: FileText,
        iconColor: '#9ca3af',
        text: 'N/A',
        textColor: 'text-gray-400',
    },
    error: {
        icon: FileText,
        iconColor: '#ef4444',
        text: 'Error',
        textColor: 'text-red-400',
    },
    unavailable: {
        icon: FileText,
        iconColor: '#9ca3af',
        text: 'PDF Preview\nUnavailable',
        textColor: 'text-gray-400',
    },
    fallback: {
        icon: Newspaper,
        iconColor: '#3b82f6',
        text: 'File',
        textColor: 'text-gray-400',
    },
} as const;

export const DocumentPlaceholder: React.FC<DocumentPlaceholderProps> = ({ type, style }) => {
    const config = PLACEHOLDER_CONFIG[type];
    const Icon = config.icon;

    return (
        <View
            className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700"
            style={[DEFAULT_SIZE, style]}
        >
            <View className="items-center">
                <Icon size={28} color={config.iconColor} />
                <ThemedText className={`text-[10px] ${config.textColor} mt-1 text-center`}>
                    {config.text}
                </ThemedText>
            </View>
        </View>
    );
};
