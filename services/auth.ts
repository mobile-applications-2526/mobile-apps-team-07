import { apiClient } from './api.client';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        // Add other user fields if needed
    };
}

export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    return await apiClient.post<AuthResponse>('/api/auth/login', credentials);
};
