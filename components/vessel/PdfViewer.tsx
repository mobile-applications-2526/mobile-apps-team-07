/**
 * PdfViewer Component
 * 
 * Displays PDF previews by downloading and caching files locally.
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/common';
import { DocumentPlaceholder } from './DocumentPlaceholder';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { IS_EXPO_GO } from '@/constants/env';
import type { PdfViewerProps } from '@/types';
import type { ComponentType } from 'react';

const DEFAULT_SIZE = { width: 80, height: 120 };

// Conditionally import Pdf only if not in Expo Go
let Pdf: ComponentType<any> | null = null;
if (!IS_EXPO_GO) {
    try {
        const pdfModule = require('react-native-pdf');
        Pdf = pdfModule.default || pdfModule;
    } catch (e) {
        console.warn('react-native-pdf could not be loaded:', e);
        Pdf = null;
    }
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, docId, style }) => {
    const { localPath, loading, error, setError } = usePdfDownload(url, docId);

    // Show unavailable if Pdf module not loaded
    if (IS_EXPO_GO || !Pdf) {
        return <DocumentPlaceholder type="unavailable" style={style} />;
    }

    // Loading state
    if (loading) {
        return (
            <View
                className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700 overflow-hidden"
                style={[DEFAULT_SIZE, style]}
            >
                <ActivityIndicator size="small" color="#3b82f6" />
                <ThemedText className="text-[9px] text-gray-400 mt-1">Loading...</ThemedText>
            </View>
        );
    }

    // Error state or no path
    if (error || !localPath) {
        return <DocumentPlaceholder type="error" style={style} />;
    }

    // Render PDF
    return (
        <View
            className="bg-gray-50 dark:bg-gray-900 rounded-lg items-center justify-center mr-4 border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={[DEFAULT_SIZE, style]}
        >
            <Pdf
                source={{ uri: localPath }}
                onError={(err: any) => {
                    console.error('PDF render error:', err);
                    setError(true);
                }}
                style={{ width: '100%', height: '100%' }}
                singlePage={true}
                fitPolicy={1}
            />
        </View>
    );
};
