import { describe, it, expect } from 'vitest';
import tailwindConfig from './tailwind.config';

describe('Tailwind Configuration', () => {
  it('should export a configuration object', () => {
    expect(tailwindConfig).toBeDefined();
    expect(typeof tailwindConfig).toBe('object');
  });

  it('should have darkMode configured', () => {
    expect(tailwindConfig.darkMode).toBe('class');
  });

  it('should have content paths configured', () => {
    expect(tailwindConfig.content).toBeDefined();
    expect(Array.isArray(tailwindConfig.content)).toBe(true);
    expect(tailwindConfig.content.length).toBeGreaterThan(0);
  });

  it('should include src directory in content paths', () => {
    const hasSourcePaths = tailwindConfig.content.some((path: string) => 
      path.includes('./src/')
    );
    expect(hasSourcePaths).toBe(true);
  });

  it('should have theme configuration', () => {
    expect(tailwindConfig.theme).toBeDefined();
    expect(typeof tailwindConfig.theme).toBe('object');
  });

  it('should have container configuration', () => {
    expect(tailwindConfig.theme?.container).toBeDefined();
    expect(tailwindConfig.theme?.container?.center).toBe(true);
    expect(tailwindConfig.theme?.container?.padding).toBeDefined();
  });

  it('should have extended colors', () => {
    expect(tailwindConfig.theme?.extend?.colors).toBeDefined();
    expect(tailwindConfig.theme?.extend?.colors?.primary).toBeDefined();
    expect(tailwindConfig.theme?.extend?.colors?.secondary).toBeDefined();
  });

  it('should have custom animations', () => {
    expect(tailwindConfig.theme?.extend?.keyframes).toBeDefined();
    expect(tailwindConfig.theme?.extend?.animation).toBeDefined();
    expect(tailwindConfig.theme?.extend?.keyframes?.['accordion-down']).toBeDefined();
    expect(tailwindConfig.theme?.extend?.animation?.['accordion-down']).toBeDefined();
  });

  it('should have loader animation', () => {
    expect(tailwindConfig.theme?.extend?.keyframes?.['loader-spin']).toBeDefined();
    expect(tailwindConfig.theme?.extend?.animation?.['loader-spin']).toBeDefined();
  });

  it('should have plugins array', () => {
    expect(tailwindConfig.plugins).toBeDefined();
    expect(Array.isArray(tailwindConfig.plugins)).toBe(true);
  });
});
