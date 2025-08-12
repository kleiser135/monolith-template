import { describe, it, expect } from 'vitest';
import cypressConfig from './cypress.config';

describe('Cypress Configuration', () => {
  it('should have correct base configuration', () => {
    expect(cypressConfig).toBeDefined();
    expect(cypressConfig.e2e).toBeDefined();
  });

  it('should have correct base URL', () => {
    expect(cypressConfig.e2e?.baseUrl).toBe('http://localhost:3000');
  });

  it('should have setupNodeEvents function', () => {
    expect(cypressConfig.e2e?.setupNodeEvents).toBeInstanceOf(Function);
  });

  it('should return config in setupNodeEvents', () => {
    const mockConfig = { test: 'config' };
    const result = cypressConfig.e2e?.setupNodeEvents?.(
      {} as any, 
      mockConfig as any
    );
    expect(result).toEqual(mockConfig);
  });
});
