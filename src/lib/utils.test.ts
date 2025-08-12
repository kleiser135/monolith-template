/**
 * Tests for general utility functions
 * Testing CSS class merging and general utilities
 */

import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge basic class names', () => {
      const result = cn('bg-red-500', 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });

    it('should handle conflicting Tailwind classes', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('should handle false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('should handle array of classes', () => {
      const result = cn(['class1', 'class2']);
      expect(result).toBe('class1 class2');
    });

    it('should handle object notation', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'bg-blue-500': true
      });
      expect(result).toBe('active bg-blue-500');
    });

    it('should merge Tailwind spacing classes correctly', () => {
      const result = cn('px-2', 'px-4');
      expect(result).toBe('px-4');
    });

    it('should handle empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'other');
      expect(result).toBe('base other');
    });

    it('should handle complex Tailwind conflicts', () => {
      const result = cn(
        'bg-red-500 text-white p-4',
        'bg-blue-500 p-2',
        'text-black'
      );
      expect(result).toBe('bg-blue-500 p-2 text-black');
    });

    it('should preserve non-conflicting classes', () => {
      const result = cn(
        'flex items-center justify-center',
        'bg-blue-500',
        'hover:bg-blue-600'
      );
      expect(result).toBe('flex items-center justify-center bg-blue-500 hover:bg-blue-600');
    });
  });
});
