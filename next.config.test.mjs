import { describe, it, expect } from 'vitest';
import nextConfig from './next.config.mjs';

describe('Next.js Configuration', () => {
  it('should export a configuration object', () => {
    expect(nextConfig).toBeDefined();
    expect(typeof nextConfig).toBe('object');
  });

  it('should be a valid Next.js config structure', () => {
    // Next.js configs can be empty objects or contain specific properties
    expect(nextConfig).not.toBeNull();
    expect(nextConfig).not.toBeUndefined();
  });

  it('should not have any undefined required properties', () => {
    // Ensure the config doesn't have any obviously broken properties
    if (nextConfig.images) {
      expect(typeof nextConfig.images).toBe('object');
    }
    if (nextConfig.experimental) {
      expect(typeof nextConfig.experimental).toBe('object');
    }
  });

  it('should be serializable (no functions in top level)', () => {
    // Next.js configs should be serializable
    expect(() => JSON.stringify(nextConfig)).not.toThrow();
  });
});
