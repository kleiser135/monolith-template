import { describe, it, expect } from 'vitest';

describe('Card Index', () => {
  it('should export all card components', async () => {
    const exports = await import('./index');
    expect(exports).toHaveProperty('Card');
    expect(exports).toHaveProperty('CardHeader');
    expect(exports).toHaveProperty('CardFooter');
    expect(exports).toHaveProperty('CardTitle');
    expect(exports).toHaveProperty('CardDescription');
    expect(exports).toHaveProperty('CardContent');
  });

  it('should export components as React components', async () => {
    const { 
      Card, 
      CardHeader, 
      CardFooter, 
      CardTitle, 
      CardDescription, 
      CardContent 
    } = await import('./index');
    
    // forwardRef components are objects with render function
    expect(typeof Card).toBe('object');
    expect(typeof CardHeader).toBe('object');
    expect(typeof CardFooter).toBe('object');
    expect(typeof CardTitle).toBe('object');
    expect(typeof CardDescription).toBe('object');
    expect(typeof CardContent).toBe('object');
  });

  it('should have correct component names', async () => {
    const { 
      Card, 
      CardHeader, 
      CardFooter, 
      CardTitle, 
      CardDescription, 
      CardContent 
    } = await import('./index');
    
    expect(Card.displayName).toBe('Card');
    expect(CardHeader.displayName).toBe('CardHeader');
    expect(CardFooter.displayName).toBe('CardFooter');
    expect(CardTitle.displayName).toBe('CardTitle');
    expect(CardDescription.displayName).toBe('CardDescription');
    expect(CardContent.displayName).toBe('CardContent');
  });

  it('should not have default export', async () => {
    const exports = await import('./index');
    expect(exports.default).toBeUndefined();
  });

  it('should export exactly six components', async () => {
    const exports = await import('./index');
    const exportKeys = Object.keys(exports);
    expect(exportKeys).toHaveLength(6);
    expect(exportKeys).toContain('Card');
    expect(exportKeys).toContain('CardHeader');
    expect(exportKeys).toContain('CardFooter');
    expect(exportKeys).toContain('CardTitle');
    expect(exportKeys).toContain('CardDescription');
    expect(exportKeys).toContain('CardContent');
  });
});
