/**
 * API Client Service Unit Tests
 *
 * Tests the core HTTP client functionality including:
 * - GET, POST, PUT, DELETE, PATCH methods
 * - Authentication header injection
 * - Error handling and ApiError class
 * - Response parsing
 */

import { apiClient, ApiError } from '../../services/api-client.service';
import { StorageService } from '../../services/storage.service';

// Mock dependencies
jest.mock('../../services/storage.service');
jest.mock('../../services/config.service', () => ({
  API_URL: 'https://api.test.com',
}));

describe('API Client Service', () => {
  const mockToken = 'test-jwt-token-12345';

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    (StorageService.getToken as jest.Mock).mockResolvedValue(mockToken);
  });

  // ============================================
  // GET REQUESTS
  // ============================================
  describe('GET requests', () => {
    it('should make GET request with correct URL', async () => {
      const mockResponse = { id: 1, name: 'Test Vessel' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await apiClient.get('/api/vessels/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make GET request without auth token when not available', async () => {
      (StorageService.getToken as jest.Mock).mockResolvedValueOnce(null);
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await apiClient.get('/api/public/endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            Authorization: expect.any(String),
          }),
        })
      );
    });

    it('should return array data for list endpoints', async () => {
      const mockVessels = [
        { id: 1, name: 'Vessel A' },
        { id: 2, name: 'Vessel B' },
      ];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockVessels),
      });

      const result = await apiClient.get('/api/vessels');

      expect(result).toEqual(mockVessels);
      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // POST REQUESTS
  // ============================================
  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      const requestData = { name: 'New Vessel', imoNumber: '1234567' };
      const mockResponse = { id: 1, ...requestData };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await apiClient.post('/api/vessels', requestData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without body when data is undefined', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await apiClient.post('/api/action');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({
          body: expect.any(String),
        })
      );
    });
  });

  // ============================================
  // PUT REQUESTS
  // ============================================
  describe('PUT requests', () => {
    it('should make PUT request with JSON body', async () => {
      const updateData = { id: 1, name: 'Updated Vessel' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(updateData),
      });

      const result = await apiClient.put('/api/vessels/1', updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
      expect(result).toEqual(updateData);
    });
  });

  // ============================================
  // DELETE REQUESTS
  // ============================================
  describe('DELETE requests', () => {
    it('should make DELETE request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: jest.fn().mockRejectedValueOnce(new Error('No content')),
      });

      const result = await apiClient.delete('/api/vessels/1');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
      expect(result).toEqual({});
    });
  });

  // ============================================
  // PATCH REQUESTS
  // ============================================
  describe('PATCH requests', () => {
    it('should make PATCH request with partial data', async () => {
      const patchData = { status: 'active' };
      const mockResponse = { id: 1, status: 'active' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const result = await apiClient.patch('/api/vessels/1', patchData);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/api/vessels/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  describe('Error Handling', () => {
    it('should throw ApiError on 400 Bad Request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: jest
          .fn()
          .mockResolvedValueOnce({ message: 'Invalid IMO number' }),
      });

      await expect(apiClient.post('/api/vessels', {})).rejects.toThrow(
        ApiError
      );

      try {
        await apiClient.post('/api/vessels', {});
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).message).toBe('Invalid IMO number');
      }
    });

    it('should throw ApiError on 401 Unauthorized', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValueOnce({ message: 'Token expired' }),
      });

      await expect(apiClient.get('/api/protected')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on 403 Forbidden', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: jest.fn().mockResolvedValueOnce({ message: 'Access denied' }),
      });

      await expect(apiClient.get('/api/admin')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on 404 Not Found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: jest.fn().mockResolvedValueOnce({ message: 'Vessel not found' }),
      });

      await expect(apiClient.get('/api/vessels/999')).rejects.toThrow(ApiError);
    });

    it('should throw ApiError on 500 Server Error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValueOnce(new Error('Parse error')),
      });

      await expect(apiClient.get('/api/vessels')).rejects.toThrow(ApiError);
    });

    it('should use statusText when JSON parsing fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: jest.fn().mockRejectedValueOnce(new Error('Not JSON')),
      });

      try {
        await apiClient.get('/api/vessels');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).message).toBe('Bad Gateway');
      }
    });
  });

  // ============================================
  // RESPONSE HANDLING
  // ============================================
  describe('Response Handling', () => {
    it('should handle 204 No Content response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient.delete('/api/vessels/1');

      expect(result).toEqual({});
    });

    it('should handle empty response body gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockRejectedValueOnce(new Error('Empty response')),
      });

      const result = await apiClient.get('/api/health');

      expect(result).toEqual({});
    });
  });

  // ============================================
  // ApiError CLASS
  // ============================================
  describe('ApiError class', () => {
    it('should create error with status and message', () => {
      const error = new ApiError(404, 'Not Found');

      expect(error.status).toBe(404);
      expect(error.message).toBe('Not Found');
      expect(error.name).toBe('ApiError');
    });

    it('should be instanceof Error', () => {
      const error = new ApiError(500, 'Server Error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });
});
