import { describe, it, expect } from 'vitest';
import postcssConfig from './postcss.config.mjs';

describe('PostCSS Configuration', () => {
  it('should export a configuration object', () => {
    expect(postcssConfig).toBeDefined();
    expect(typeof postcssConfig).toBe('object');
  });

  it('should have plugins property', () => {
    expect(postcssConfig).toHaveProperty('plugins');
    expect(Array.isArray(postcssConfig.plugins)).toBe(true);
  });

  it('should include Tailwind CSS plugin', () => {
    expect(postcssConfig.plugins).toContain('@tailwindcss/postcss');
  });

  it('should be a valid PostCSS config structure', () => {
    // PostCSS configs should have plugins array
    expect(postcssConfig.plugins).toBeDefined();
    expect(postcssConfig.plugins.length).toBeGreaterThan(0);
  });

  it('should be serializable', () => {
    expect(() => JSON.stringify(postcssConfig)).not.toThrow();
  });
});
