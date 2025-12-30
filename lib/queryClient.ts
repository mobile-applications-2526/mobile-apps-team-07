import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // Data is fresh for 3 seconds (less than poll interval)
            staleTime: 3 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Poll every 5 seconds
            refetchInterval: 5 * 1000,
            // Continue polling when window is not focused (for mobile)
            refetchIntervalInBackground: true,
            // Retry failed requests up to 2 times
            retry: 2,
            // Don't refetch on window focus (polling handles it)
            refetchOnWindowFocus: false,
        },
    },
});
