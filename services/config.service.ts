/**
 * Service Configuration
 * 
 * Centralized configuration for services.
 * Separated to avoid circular dependencies.
 */

import { StorageService } from './storage.service';

export const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const getAuthHeaders = async () => {
    const token = await StorageService.getToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
};
