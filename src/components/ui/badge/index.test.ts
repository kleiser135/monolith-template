import { describe, it, expect } from 'vitest';

describe('Badge Index', () => {
  it('should export Badge component', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('Badge');
    expect(typeof exports.Badge).toBe('function');
  });

  it('should export badgeVariants', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('badgeVariants');
    expect(typeof exports.badgeVariants).toBe('function');
  });

  it('should have correct component name', async () => {
    const { Badge } = await import('./index');
    expect(Badge.name).toBe('Badge');
  });

  it('should not have default export', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export exactly two items', async () => {
    const exports = await import('./index');
    const exportKeys = Object.keys(exports);
    expect(exportKeys).toHaveLength(2);
    expect(exportKeys).toContain('Badge');
    expect(exportKeys).toContain('badgeVariants');
  });

  it('should export badgeVariants as a function', async () => {
    const { badgeVariants } = await import('./index');
    expect(typeof badgeVariants).toBe('function');
  });
});
