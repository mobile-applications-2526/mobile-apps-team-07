import { apiClient } from './api.client';

interface LoginCredentials {
    email: string;
    password: string;
}

interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        // Add other user fields if needed
    };
}

export const AuthService = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        return await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    },
};

export type { LoginCredentials, AuthResponse };
