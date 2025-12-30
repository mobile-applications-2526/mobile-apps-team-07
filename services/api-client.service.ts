import { API_URL } from './config.service';
import { StorageService } from './storage.service';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface RequestOptions extends RequestInit {
    data?: any;
}

export class ApiError extends Error {
    constructor(public status: number, message: string) {
        super(message);
        this.name = 'ApiError';
    }
}

async function request<T>(endpoint: string, method: HttpMethod, options: RequestOptions = {}): Promise<T> {
    const token = await StorageService.getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        method,
        headers,
        ...options,
    };

    if (options.data) {
        config.body = JSON.stringify(options.data);
    }

    console.log(`[API] Request: ${method} ${API_URL}${endpoint}`);


    const response = await fetch(`${API_URL}${endpoint}`, config);
    console.log(`[API] Response: ${response.status} ${method} ${endpoint}`);

    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch {
            // If JSON parse fails, use status text or default message
            errorMessage = response.statusText || errorMessage;
        }
        throw new ApiError(response.status, errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch (error) {
        // If response is not JSON (e.g. 200 OK but empty or text), return null or throw
        console.warn('Failed to parse JSON response', error);
        return {} as T;
    }
}

export const apiClient = {
    get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'GET', options),
    post: <T>(endpoint: string, data?: any, options?: RequestOptions) => request<T>(endpoint, 'POST', { ...options, data }),
    put: <T>(endpoint: string, data?: any, options?: RequestOptions) => request<T>(endpoint, 'PUT', { ...options, data }),
    delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, 'DELETE', options),
    patch: <T>(endpoint: string, data?: any, options?: RequestOptions) => request<T>(endpoint, 'PATCH', { ...options, data }),
};
