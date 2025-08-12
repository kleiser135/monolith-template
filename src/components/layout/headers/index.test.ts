import { describe, it, expect } from 'vitest';

describe('Headers Index', () => {
  it('should export all header components', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('LandingHeader');
    expect(exports).toHaveProperty('AppHeader');
    expect(exports).toHaveProperty('AuthHeader');
  });

  it('should export components as functions', async () => {
    const { LandingHeader, AppHeader, AuthHeader } = await import('./index');
    expect(typeof LandingHeader).toBe('function');
    expect(typeof AppHeader).toBe('function');
    expect(typeof AuthHeader).toBe('function');
  });

  it('should have correct component names', async () => {
    const { LandingHeader, AppHeader, AuthHeader } = await import('./index');
    expect(LandingHeader.name).toBe('LandingHeader');
    expect(AppHeader.name).toBe('AppHeader');
    expect(AuthHeader.name).toBe('AuthHeader');
  });

  it('should not have default export', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export exactly three components', async () => {
    const exports = await import('./index');
    const exportKeys = Object.keys(exports);
    expect(exportKeys).toHaveLength(3);
    expect(exportKeys).toContain('LandingHeader');
    expect(exportKeys).toContain('AppHeader');
    expect(exportKeys).toContain('AuthHeader');
  });
});
