/**
 * URL Utilities
 * 
 * Helper functions for URL manipulation.
 */

import { API_URL } from '@/services/serviceConfig';

/**
 * Constructs a full URL from a relative API path.
 * If the path is already a full URL, returns it unchanged.
 * 
 * @param relativePath - The relative path (e.g., '/api/documents/1/download')
 * @returns The full URL with API base prepended
 */
export const getFullUrl = (relativePath: string): string => {
    if (!relativePath) return '';

    // If already a full URL, return as-is
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        return relativePath;
    }

    // Construct full URL from API base
    const base = API_URL?.replace(/\/$/, '') || '';
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${base}${path}`;
};
