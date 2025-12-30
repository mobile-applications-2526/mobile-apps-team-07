/**
 * Services Configuration
 *
 * Centralized configuration for API services.
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8080';
console.log('API_URL:', API_URL);

// Default headers for all API requests (ngrok requires this to skip browser warning)
export const defaultHeaders: HeadersInit = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true',
};
