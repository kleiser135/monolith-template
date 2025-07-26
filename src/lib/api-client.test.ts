import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import apiClient from './api-client';

// Mock the global fetch function
global.fetch = vi.fn();

const mockFetch = global.fetch as Mock;

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should fetch data successfully', async () => {
      const mockData = { message: 'Success' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const data = await apiClient.get('/test');
      expect(data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw an error with API message when response is not ok', async () => {
      const mockError = { message: 'API Error' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(apiClient.get('/test')).rejects.toThrow('API Error');
    });

    it('should throw a generic error when response is not ok and no API message is present', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiClient.get('/test')).rejects.toThrow('HTTP error! status: 500');
    });
  });

  describe('post', () => {
    const body = { key: 'value' };

    it('should post data successfully', async () => {
      const mockData = { message: 'Success' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const data = await apiClient.post('/test', body);
      expect(data).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    });

    it('should throw an error with API message when response is not ok', async () => {
      const mockError = { message: 'API Error' };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => mockError,
      });

      await expect(apiClient.post('/test', body)).rejects.toThrow('API Error');
    });

    it('should throw a generic error when response is not ok and no API message is present', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiClient.post('/test', body)).rejects.toThrow(
        'HTTP error! status: 500'
      );
    });
  });
}); 