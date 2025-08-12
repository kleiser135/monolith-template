import { describe, it, expect } from 'vitest';

describe('Textarea Index', () => {
  it('should export Textarea component', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('Textarea');
    expect(typeof exports.Textarea).toBe('function');
  });

  it('should have correct component name', async () => {
    const { Textarea } = await import('./index');
    expect(Textarea.name).toBe('Textarea');
  });

  it('should not have default export', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export exactly one item', async () => {
    const exports = await import('./index');
    const exportKeys = Object.keys(exports);
    expect(exportKeys).toHaveLength(1);
    expect(exportKeys).toContain('Textarea');
  });

  it('should be a React component', async () => {
    const { Textarea } = await import('./index');
    expect(Textarea).toBeDefined();
    expect(typeof Textarea).toBe('function');
  });
});
