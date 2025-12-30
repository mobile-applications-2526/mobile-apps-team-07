/**
 * usePdfDownload Hook
 * 
 * Handles PDF download with caching, auth headers, and validation.
 */

import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { StorageService } from '@/services/storage.service';
import type { UsePdfDownloadResult } from '@/types';

/**
 * Downloads and caches a PDF file for viewing.
 * 
 * Features:
 * - Downloads with auth header
 * - Caches using document ID as key
 * - Validates cached files (deletes empty/corrupt files)
 * - Manages loading/error states
 * 
 * @param url - Full URL to the PDF
 * @param docId - Document ID for caching
 * @returns Download state and local file path
 */
export function usePdfDownload(url: string, docId: number): UsePdfDownloadResult {
    const [localPath, setLocalPath] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const downloadPdf = async () => {
            try {
                setLoading(true);
                setError(false);

                // Create a unique filename based on the document ID
                const filename = `doc_${docId}.pdf`;
                const localUri = `${FileSystem.cacheDirectory}${filename}`;

                // Check if file already exists in cache and is valid (non-empty)
                const fileInfo = await FileSystem.getInfoAsync(localUri);
                if (fileInfo.exists && fileInfo.size && fileInfo.size > 0) {
                    if (isMounted) {
                        setLocalPath(localUri);
                        setLoading(false);
                    }
                    return;
                } else if (fileInfo.exists) {
                    // Delete empty/corrupt cached file
                    await FileSystem.deleteAsync(localUri, { idempotent: true });
                }

                // Download the file with auth header
                const token = await StorageService.getToken();
                const downloadResult = await FileSystem.downloadAsync(url, localUri, {
                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                });

                if (isMounted) {
                    if (downloadResult.status === 200) {
                        setLocalPath(downloadResult.uri);
                        setLoading(false);
                    } else {
                        console.error('PDF download failed with status:', downloadResult.status);
                        setError(true);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('PDF download error:', err);
                if (isMounted) {
                    setError(true);
                    setLoading(false);
                }
            }
        };

        downloadPdf();

        return () => {
            isMounted = false;
        };
    }, [url, docId]);

    return { localPath, loading, error, setError };
}
