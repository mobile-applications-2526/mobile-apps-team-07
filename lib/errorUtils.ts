/**
 * Error Utilities
 * 
 * Shared helper functions for handling errors and formatting error messages for the user.
 */

/**
 * Convert technical error messages to user-friendly ones.
 * Useful for handling API errors, network issues, and file operations.
 * 
 * @param message The raw error message from the exception or API response
 * @returns A user-friendly string suitable for display in Alerts or Toasts
 */
export const getFriendlyErrorMessage = (message?: string): string => {
    if (!message) return 'Something went wrong. Please try again.';

    const lowerMsg = message.toLowerCase();

    // Authentication & Authorization
    if (lowerMsg.includes('403') || lowerMsg.includes('forbidden')) {
        return 'You don\'t have permission to perform this action.';
    }
    if (lowerMsg.includes('401') || lowerMsg.includes('unauthorized')) {
        return 'Your session has expired. Please sign in again.';
    }

    // File Upload Specifics (Generic enough to keep here)
    if (lowerMsg.includes('413') || lowerMsg.includes('too large')) {
        return 'The file or data is too large. Please check constraints (e.g. max 10MB or 25MB).';
    }

    // Server & Network
    if (lowerMsg.includes('404') || lowerMsg.includes('not found')) {
        return 'The requested resource was not found. Please try again later.';
    }
    if (lowerMsg.includes('500') || lowerMsg.includes('server error')) {
        return 'The server encountered an error. Please try again in a few minutes.';
    }
    if (lowerMsg.includes('network') || lowerMsg.includes('timeout') || lowerMsg.includes('connection')) {
        return 'Unable to connect to the server. Please check your internet connection.';
    }

    // File System
    if (lowerMsg.includes('file') && lowerMsg.includes('not exist')) {
        return 'The selected file could not be found. Please try selecting it again.';
    }

    // Catch HTML or very long technical messages (often from Nginx/Tomcat default pages)
    if (lowerMsg.startsWith('<') || lowerMsg.includes('<!doctype html>') || lowerMsg.length > 200) {
        return 'The server encountered an unexpected error. Our team has been notified.';
    }

    // Default: return a cleaned up version or generic message
    // If we can't map it, we show the message if it's short/readable, otherwise generic.
    // The logic above catches long messages, so here we might just return the original if it's short enough.
    return message.length < 100 ? message : 'An unexpected error occurred. Please try again.';
};
