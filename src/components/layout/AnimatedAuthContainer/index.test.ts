import { describe, it, expect } from 'vitest';

describe('AnimatedAuthContainer Index', () => {
  it('should export AnimatedAuthContainer', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('AnimatedAuthContainer');
    expect(typeof exports.AnimatedAuthContainer).toBe('function');
  });

  it('should have named export only', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export the component correctly', async () => {
    const { AnimatedAuthContainer } = await import('./index');
    expect(AnimatedAuthContainer).toBeDefined();
    expect(AnimatedAuthContainer.name).toBe('AnimatedAuthContainer');
  });
});
