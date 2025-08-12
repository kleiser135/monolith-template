import { describe, it, expect } from 'vitest';

describe('Input Index', () => {
  it('should export Input component', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('Input');
    expect(exports.Input).toBeDefined();
  });

  it('should have correct component name', async () => {
    const { Input } = await import('./index');
    expect(Input.displayName).toBe('Input');
  });

  it('should not have default export', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export exactly one item', async () => {
    const exports = await import('./index');
    const exportKeys = Object.keys(exports);
    expect(exportKeys).toHaveLength(1);
    expect(exportKeys).toContain('Input');
  });

  it('should be a React component', async () => {
    const { Input } = await import('./index');
    expect(Input).toBeDefined();
    expect(Input.displayName).toBe('Input');
    // forwardRef components are objects with render function
    expect(typeof Input).toBe('object');
  });
});
