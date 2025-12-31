/**
 * Auth Service Unit Tests
 *
 * Tests authentication functionality including:
 * - Login with valid credentials
 * - Login with invalid credentials
 * - Error handling for auth failures
 */

import { AuthService } from '../../services/auth.service';
import { apiClient } from '../../services/api-client.service';

// Mock the API client
jest.mock('../../services/api-client.service', () => ({
  apiClient: {
    post: jest.fn(),
    get: jest.fn(),
  },
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // LOGIN FUNCTIONALITY
  // ============================================
  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'securePassword123',
    };

    const mockAuthResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-token',
      user: {
        id: '1',
        email: 'test@example.com',
      },
    };

    it('should successfully login with valid credentials', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const result = await AuthService.login(validCredentials);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        validCredentials
      );
      expect(result).toEqual(mockAuthResponse);
      expect(result.token).toBeDefined();
      expect(result.user.email).toBe(validCredentials.email);
    });

    it('should call the correct API endpoint', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      await AuthService.login(validCredentials);

      expect(apiClient.post).toHaveBeenCalledTimes(1);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.any(Object)
      );
    });

    it('should pass email and password to API', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      await AuthService.login(validCredentials);

      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'securePassword123',
      });
    });

    it('should throw error on invalid credentials (401)', async () => {
      const authError = new Error('Invalid email or password');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(authError);

      await expect(AuthService.login(validCredentials)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should throw error on server error (500)', async () => {
      const serverError = new Error('Internal server error');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(serverError);

      await expect(AuthService.login(validCredentials)).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should throw error on network failure', async () => {
      const networkError = new Error('Network request failed');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(networkError);

      await expect(AuthService.login(validCredentials)).rejects.toThrow(
        'Network request failed'
      );
    });

    it('should return token in response', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const result = await AuthService.login(validCredentials);

      expect(result.token).toBe(mockAuthResponse.token);
      expect(typeof result.token).toBe('string');
    });

    it('should return user object in response', async () => {
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockAuthResponse);

      const result = await AuthService.login(validCredentials);

      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('1');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  // ============================================
  // EDGE CASES
  // ============================================
  describe('Edge Cases', () => {
    it('should handle empty email', async () => {
      const invalidCredentials = { email: '', password: 'password123' };
      const validationError = new Error('Email is required');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(validationError);

      await expect(AuthService.login(invalidCredentials)).rejects.toThrow(
        'Email is required'
      );
    });

    it('should handle empty password', async () => {
      const invalidCredentials = { email: 'test@example.com', password: '' };
      const validationError = new Error('Password is required');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(validationError);

      await expect(AuthService.login(invalidCredentials)).rejects.toThrow(
        'Password is required'
      );
    });

    it('should handle special characters in email', async () => {
      const specialCredentials = {
        email: 'test+special@example.com',
        password: 'password123',
      };
      const mockResponse = {
        token: 'token',
        user: { id: '1', email: 'test+special@example.com' },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      const result = await AuthService.login(specialCredentials);

      expect(result.user.email).toBe('test+special@example.com');
    });

    it('should handle unicode characters in password', async () => {
      const unicodeCredentials = {
        email: 'test@example.com',
        password: 'p@sswrd123!',
      };
      const mockResponse = {
        token: 'token',
        user: { id: '1', email: 'test@example.com' },
      };
      (apiClient.post as jest.Mock).mockResolvedValueOnce(mockResponse);

      await expect(
        AuthService.login(unicodeCredentials)
      ).resolves.toBeDefined();
    });
  });

  // ============================================
  // TIMEOUT AND RETRY SCENARIOS
  // ============================================
  describe('Timeout and Connection Issues', () => {
    it('should throw on timeout', async () => {
      const timeoutError = new Error('Request timeout');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(timeoutError);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Request timeout');
    });

    it('should throw on connection refused', async () => {
      const connectionError = new Error('Connection refused');
      (apiClient.post as jest.Mock).mockRejectedValueOnce(connectionError);

      await expect(
        AuthService.login({
          email: 'test@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Connection refused');
    });
  });
});
