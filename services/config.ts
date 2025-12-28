/**
 * Service Configuration
 * 
 * Centralized configuration for services.
 * Separated to avoid circular dependencies.
 */

import { getToken } from '@/services/storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getAuthHeaders = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};
