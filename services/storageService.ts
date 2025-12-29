import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const THEME_KEY = 'theme_preference';

export const StorageService = {
    // Token management
    saveToken: async (token: string) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
        } catch (error) {
            console.error('Error saving token:', error);
            throw error;
        }
    },

    getToken: async (): Promise<string | null> => {
        try {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error('Error getting token:', error);
            return null; // Fail gracefully
        }
    },

    deleteToken: async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
        } catch (error) {
            console.error('Error deleting token:', error);
            throw error;
        }
    },

    // User management
    saveUser: async (user: any) => {
        try {
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user:', error);
        }
    },

    getUser: async () => {
        try {
            const data = await SecureStore.getItemAsync(USER_KEY);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    deleteUser: async () => {
        try {
            await SecureStore.deleteItemAsync(USER_KEY);
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    },

    // Theme management
    saveTheme: async (theme: 'system' | 'light' | 'dark') => {
        try {
            await SecureStore.setItemAsync(THEME_KEY, theme);
        } catch (error) {
            console.error('Error saving theme:', error);
        }
    },

    getTheme: async (): Promise<'system' | 'light' | 'dark'> => {
        try {
            const data = await SecureStore.getItemAsync(THEME_KEY);
            return (data === 'light' || data === 'dark') ? data : 'system';
        } catch (error) {
            console.error('Error getting theme:', error);
            return 'system';
        }
    },
};
