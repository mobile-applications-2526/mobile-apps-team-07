/**
 * Common Types
 * 
 * Shared type definitions used across the application.
 */

// Generic API response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Loading state
export interface LoadingState {
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}
