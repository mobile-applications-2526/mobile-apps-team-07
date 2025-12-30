/**
 * ImageViewer Component
 * 
 * Displays image previews with loading and error states.
 */

import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { FileText } from 'lucide-react-native';
import { ThemedText } from '@/components/common';
import type { ImageViewerProps } from '@/types';

const DEFAULT_SIZE = { width: 80, height: 120 };

export const ImageViewer: React.FC<ImageViewerProps> = ({ url, style }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <View
            className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={[DEFAULT_SIZE, style]}
        >
            <Image
                source={{ uri: url }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
                onLoadStart={() => setLoading(true)}
                onLoad={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
            {loading && (
                <View className="absolute inset-0 items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <ActivityIndicator size="small" color="#3b82f6" />
                </View>
            )}
            {error && (
                <View className="absolute inset-0 items-center justify-center bg-gray-50 dark:bg-gray-900">
                    <FileText size={28} color="#ef4444" />
                    <ThemedText className="text-[10px] text-red-500 mt-1">Error</ThemedText>
                </View>
            )}
        </View>
    );
};
