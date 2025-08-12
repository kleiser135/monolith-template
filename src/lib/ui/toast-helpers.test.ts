import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sonner before importing anything
vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    promise: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

import { 
  showInfo, 
  showWarning, 
  showLoading, 
  showPromise, 
  showAction, 
  showSuccess, 
  showError, 
  dismissAll 
} from './toast-helpers';
import { toast } from 'sonner';

const mockToast = vi.mocked(toast);

describe('Toast Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('showInfo', () => {
    it('should call toast with info icon', () => {
      showInfo('Test info message');
      
      expect(mockToast).toHaveBeenCalledWith('Test info message', {
        icon: 'ℹ️'
      });
    });

    it('should merge custom options', () => {
      showInfo('Test info', { duration: 5000 });
      
      expect(mockToast).toHaveBeenCalledWith('Test info', {
        icon: 'ℹ️',
        duration: 5000
      });
    });
  });

  describe('showWarning', () => {
    it('should call toast with warning icon and border color', () => {
      showWarning('Test warning message');
      
      expect(mockToast).toHaveBeenCalledWith('Test warning message', {
        icon: '⚠️',
        style: { borderColor: '#f59e0b' }
      });
    });

    it('should merge custom options', () => {
      showWarning('Test warning', { duration: 3000 });
      
      expect(mockToast).toHaveBeenCalledWith('Test warning', {
        icon: '⚠️',
        style: { borderColor: '#f59e0b' },
        duration: 3000
      });
    });
  });

  describe('showLoading', () => {
    it('should call toast.loading with default message', () => {
      showLoading();
      
      expect(mockToast.loading).toHaveBeenCalledWith('Loading...', undefined);
    });

    it('should call toast.loading with custom message', () => {
      showLoading('Saving data...');
      
      expect(mockToast.loading).toHaveBeenCalledWith('Saving data...', undefined);
    });

    it('should pass through options', () => {
      const options = { duration: 1000 };
      showLoading('Processing...', options);
      
      expect(mockToast.loading).toHaveBeenCalledWith('Processing...', options);
    });
  });

  describe('showPromise', () => {
    it('should call toast.promise with correct parameters', () => {
      const testPromise = Promise.resolve('success');
      const messages = {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!'
      };

      showPromise(testPromise, messages);
      
      expect(mockToast.promise).toHaveBeenCalledWith(testPromise, messages);
    });
  });

  describe('showAction', () => {
    it('should call toast with action object', () => {
      const action = { label: 'Undo', onClick: vi.fn() };
      
      showAction('Action message', action);
      
      expect(mockToast).toHaveBeenCalledWith('Action message', {
        action
      });
    });

    it('should merge custom options with action', () => {
      const action = { label: 'Retry', onClick: vi.fn() };
      const options = { duration: 5000 };
      
      showAction('Failed to save', action, options);
      
      expect(mockToast).toHaveBeenCalledWith('Failed to save', {
        action,
        duration: 5000
      });
    });
  });

  describe('dismissAll', () => {
    it('should call toast.dismiss with no arguments', () => {
      dismissAll();
      
      expect(mockToast.dismiss).toHaveBeenCalledWith();
    });
  });

  describe('aliases', () => {
    it('showSuccess should be an alias for toast.success', () => {
      expect(showSuccess).toBe(mockToast.success);
    });

    it('showError should be an alias for toast.error', () => {
      expect(showError).toBe(mockToast.error);
    });
  });
}); 