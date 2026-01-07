/**
 * Error Utilities Unit Tests
 *
 * Tests the getFriendlyErrorMessage function for various error scenarios:
 * - Authentication errors (401, 403)
 * - Not found errors (404)
 * - Server errors (500)
 * - Network errors
 * - File upload errors
 * - Generic errors
 */

import { getFriendlyErrorMessage } from '../../lib/errorUtils';

describe('Error Utilities', () => {
  // ============================================
  // AUTHENTICATION ERRORS
  // ============================================
  describe('Authentication Errors', () => {
    it('should return permission message for 403 error', () => {
      const result = getFriendlyErrorMessage('Error 403: Forbidden');
      expect(result).toBe("You don't have permission to perform this action.");
    });

    it('should return permission message for "forbidden" keyword', () => {
      const result = getFriendlyErrorMessage('Access forbidden');
      expect(result).toBe("You don't have permission to perform this action.");
    });

    it('should return session expired message for 401 error', () => {
      const result = getFriendlyErrorMessage('Error 401: Unauthorized');
      expect(result).toBe('Your session has expired. Please sign in again.');
    });

    it('should return session expired message for "unauthorized" keyword', () => {
      const result = getFriendlyErrorMessage('Request unauthorized');
      expect(result).toBe('Your session has expired. Please sign in again.');
    });
  });

  // ============================================
  // FILE UPLOAD ERRORS
  // ============================================
  describe('File Upload Errors', () => {
    it('should return file too large message for 413 error', () => {
      const result = getFriendlyErrorMessage('Error 413: Payload Too Large');
      expect(result).toBe(
        'The file or data is too large. Please check constraints (e.g. max 10MB or 25MB).'
      );
    });

    it('should return file too large message for "too large" keyword', () => {
      const result = getFriendlyErrorMessage('File is too large to upload');
      expect(result).toBe(
        'The file or data is too large. Please check constraints (e.g. max 10MB or 25MB).'
      );
    });
  });

  // ============================================
  // NOT FOUND ERRORS
  // ============================================
  describe('Not Found Errors', () => {
    it('should return not found message for 404 error', () => {
      const result = getFriendlyErrorMessage('Error 404: Not Found');
      expect(result).toBe(
        'The requested resource was not found. Please try again later.'
      );
    });

    it('should return not found message for "not found" keyword', () => {
      const result = getFriendlyErrorMessage('Resource not found');
      expect(result).toBe(
        'The requested resource was not found. Please try again later.'
      );
    });
  });

  // ============================================
  // SERVER ERRORS
  // ============================================
  describe('Server Errors', () => {
    it('should return server error message for 500 error', () => {
      const result = getFriendlyErrorMessage('Error 500: Internal Server Error');
      expect(result).toBe(
        'The server encountered an error. Please try again in a few minutes.'
      );
    });

    it('should return server error message for "server error" keyword', () => {
      const result = getFriendlyErrorMessage('Internal server error occurred');
      expect(result).toBe(
        'The server encountered an error. Please try again in a few minutes.'
      );
    });
  });

  // ============================================
  // NETWORK ERRORS
  // ============================================
  describe('Network Errors', () => {
    it('should return connection message for "network" keyword', () => {
      const result = getFriendlyErrorMessage('Network request failed');
      expect(result).toBe(
        'Unable to connect to the server. Please check your internet connection.'
      );
    });

    it('should return connection message for "timeout" keyword', () => {
      const result = getFriendlyErrorMessage('Request timeout');
      expect(result).toBe(
        'Unable to connect to the server. Please check your internet connection.'
      );
    });

    it('should return connection message for "connection" keyword', () => {
      const result = getFriendlyErrorMessage('Connection refused');
      expect(result).toBe(
        'Unable to connect to the server. Please check your internet connection.'
      );
    });
  });

  // ============================================
  // FILE SYSTEM ERRORS
  // ============================================
  describe('File System Errors', () => {
    it('should return file not found message', () => {
      const result = getFriendlyErrorMessage('File does not exist at path');
      expect(result).toBe(
        'The selected file could not be found. Please try selecting it again.'
      );
    });

    it('should return file not found for various formats', () => {
      const result = getFriendlyErrorMessage(
        'The file you selected does not exist'
      );
      expect(result).toBe(
        'The selected file could not be found. Please try selecting it again.'
      );
    });
  });

  // ============================================
  // HTML ERROR PAGES
  // ============================================
  describe('HTML Error Pages', () => {
    it('should handle HTML error responses with 500 status', () => {
      // Note: The code checks for "500" before HTML, so this matches the 500 error handler
      const htmlError =
        '<!DOCTYPE html><html><body>500 Internal Server Error</body></html>';
      const result = getFriendlyErrorMessage(htmlError);
      expect(result).toBe(
        'The server encountered an error. Please try again in a few minutes.'
      );
    });

    it('should handle HTML error responses without status code', () => {
      const htmlError =
        '<!DOCTYPE html><html><body>Something went wrong</body></html>';
      const result = getFriendlyErrorMessage(htmlError);
      expect(result).toBe(
        'The server encountered an unexpected error. Our team has been notified.'
      );
    });

    it('should handle HTML starting with angle bracket', () => {
      const result = getFriendlyErrorMessage('<html>Error</html>');
      expect(result).toBe(
        'The server encountered an unexpected error. Our team has been notified.'
      );
    });

    it('should handle very long technical messages', () => {
      const longMessage = 'a'.repeat(250);
      const result = getFriendlyErrorMessage(longMessage);
      expect(result).toBe(
        'The server encountered an unexpected error. Our team has been notified.'
      );
    });
  });

  // ============================================
  // DEFAULT / GENERIC HANDLING
  // ============================================
  describe('Default / Generic Handling', () => {
    it('should return generic message for empty input', () => {
      const result = getFriendlyErrorMessage('');
      expect(result).toBe('Something went wrong. Please try again.');
    });

    it('should return generic message for undefined', () => {
      const result = getFriendlyErrorMessage(undefined);
      expect(result).toBe('Something went wrong. Please try again.');
    });

    it('should return original message if short and readable', () => {
      const shortMessage = 'Invalid IMO number';
      const result = getFriendlyErrorMessage(shortMessage);
      expect(result).toBe(shortMessage);
    });

    it('should return generic message for long unrecognized errors', () => {
      const longMessage = 'x'.repeat(150);
      const result = getFriendlyErrorMessage(longMessage);
      expect(result).toBe('An unexpected error occurred. Please try again.');
    });
  });

  // ============================================
  // CASE INSENSITIVITY
  // ============================================
  describe('Case Insensitivity', () => {
    it('should handle uppercase error codes', () => {
      expect(getFriendlyErrorMessage('UNAUTHORIZED')).toBe(
        'Your session has expired. Please sign in again.'
      );
    });

    it('should handle mixed case', () => {
      expect(getFriendlyErrorMessage('Network Error')).toBe(
        'Unable to connect to the server. Please check your internet connection.'
      );
    });

    it('should handle lowercase', () => {
      expect(getFriendlyErrorMessage('forbidden access')).toBe(
        "You don't have permission to perform this action."
      );
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle message with multiple error keywords', () => {
      // First matching condition wins
      const result = getFriendlyErrorMessage('401 Unauthorized: Network error');
      expect(result).toBe('Your session has expired. Please sign in again.');
    });

    it('should handle special characters in message', () => {
      const result = getFriendlyErrorMessage('Error! @#$% happened');
      expect(result).toBe('Error! @#$% happened');
    });

    it('should handle numeric only message', () => {
      const result = getFriendlyErrorMessage('404');
      expect(result).toBe(
        'The requested resource was not found. Please try again later.'
      );
    });

    it('should handle whitespace-only message', () => {
      const result = getFriendlyErrorMessage('   ');
      expect(result).toBe('   ');
    });
  });
});
