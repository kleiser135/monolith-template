import { describe, it, expect } from 'vitest';

describe('Button Index', () => {
  it('should export Button component', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('Button');
    expect(exports.Button).toBeDefined();
  });

  it('should have correct component name', async () => {
    const { Button } = await import('./index');
    expect(Button.displayName).toBe('Button');
  });

  it('should not have default export', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export exactly one item', async () => {
    const exports = await import('./index');
    const exportKeys = Object.keys(exports);
    expect(exportKeys).toHaveLength(1);
    expect(exportKeys).toContain('Button');
  });

  it('should be a React component', async () => {
    const { Button } = await import('./index');
    expect(Button).toBeDefined();
    expect(Button.displayName).toBe('Button');
    // forwardRef components are objects with render function
    expect(typeof Button).toBe('object');
  });
});
