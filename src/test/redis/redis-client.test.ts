import { describe, it, expect, afterEach, vi } from 'vitest';
import { getRedisClient, isRedisAvailable, closeRedisConnection } from '@/lib/redis/client';

// Mock Redis for testing
vi.mock('ioredis', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      ping: vi.fn().mockResolvedValue('PONG'),
      quit: vi.fn().mockResolvedValue('OK'),
      on: vi.fn(),
      zadd: vi.fn().mockResolvedValue(1),
      zremrangebyscore: vi.fn().mockResolvedValue(1),
      zcard: vi.fn().mockResolvedValue(0),
      expire: vi.fn().mockResolvedValue(1),
      setex: vi.fn().mockResolvedValue('OK'),
      get: vi.fn().mockResolvedValue(null),
      hset: vi.fn().mockResolvedValue(1),
      hget: vi.fn().mockResolvedValue(null),
      zrangebyscore: vi.fn().mockResolvedValue([]),
      pipeline: vi.fn().mockReturnValue({
        hget: vi.fn().mockReturnThis(),
        exec: vi.fn().mockResolvedValue([]),
      }),
    })),
  };
});

describe('Redis Client', () => {
  afterEach(async () => {
    await closeRedisConnection();
  });

  describe('getRedisClient', () => {
    it('should create and return a Redis client', () => {
      const client = getRedisClient();
      expect(client).toBeDefined();
      expect(typeof client.ping).toBe('function');
    });

    it('should return the same instance on multiple calls', () => {
      const client1 = getRedisClient();
      const client2 = getRedisClient();
      expect(client1).toBe(client2);
    });
  });

  describe('isRedisAvailable', () => {
    it('should return true when Redis is available', async () => {
      const available = await isRedisAvailable();
      expect(available).toBe(true);
    });

    it('should return false when Redis ping fails', async () => {
      const client = getRedisClient();
      vi.mocked(client.ping).mockRejectedValueOnce(new Error('Connection failed'));
      
      const available = await isRedisAvailable();
      expect(available).toBe(false);
    });
  });

  describe('closeRedisConnection', () => {
    it('should close the Redis connection', async () => {
      const client = getRedisClient();
      await closeRedisConnection();
      expect(client.quit).toHaveBeenCalled();
    });
  });
});
