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

type UnauthorizedCallback = ()=>void;
let unauthorizedCallback: UnauthorizedCallback | null = null;

export const setUnauthorizedCallback = (callback: ()=>void ) => {
    unauthorizedCallback = callback;
};

async function request<T>(endpoint: string, method: HttpMethod, options: RequestOptions = {}): Promise<T> {
    const token = await StorageService.getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Debug logging for auth issues
    console.log(`[API] ${method} ${endpoint} | Token: ${token ? `${token.slice(0, 20)}...` : 'NONE'}`);

    const config: RequestInit = {
        method,
        headers,
        ...options,
    };

    if (options.data) {
        config.body = JSON.stringify(options.data);
        // Log POST/PUT body for debugging
        if (method === 'POST' || method === 'PUT') {
            console.log(`[API] ${method} ${endpoint} | Body:`, JSON.stringify(options.data, null, 2));
        }
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    console.log(`[API] ${method} ${endpoint} | Status: ${response.status}`);

    // Check if this is an auth endpoint (login, register, etc.)
    const isAuthEndpoint = endpoint.includes('/auth/');

    if (response.status === 401) {
      // Only trigger session expired for non-auth endpoints
      // For auth endpoints, 401 means invalid credentials, not session expired
      if (!isAuthEndpoint) {
        // Don't auto-delete token - it may be valid for other endpoints
        // The backend may have endpoint-specific auth issues
        // Let the error propagate and be handled by the calling code
        let errorMessage = 'Unauthorized';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Use default message
        }
        console.warn(`[API] 401 on ${endpoint}: ${errorMessage}`);
        throw new ApiError(401, errorMessage);
      }

      // For auth endpoints, parse the error message from the response
      let errorMessage = 'Invalid credentials';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Use default message
      }
      throw new ApiError(401, errorMessage);
    }

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
