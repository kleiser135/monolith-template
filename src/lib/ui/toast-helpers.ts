import { toast } from 'sonner';

/**
 * Enhanced toast helpers that provide additional types and patterns
 * Built on top of sonner's core success/error functionality
 */

// Re-export the core sonner functions
export { toast };

/**
 * Info toast - for helpful, non-critical information
 */
export const showInfo = (message: string, options?: Parameters<typeof toast>[1]) => {
  return toast(message, { 
    icon: 'ℹ️',
    ...options 
  });
};

/**
 * Warning toast - for important but non-blocking warnings
 */
export const showWarning = (message: string, options?: Parameters<typeof toast>[1]) => {
  return toast(message, { 
    icon: '⚠️',
    style: { borderColor: '#f59e0b' },
    ...options 
  });
};

/**
 * Loading toast - for ongoing operations
 */
export const showLoading = (message: string = 'Loading...', options?: Parameters<typeof toast>[1]) => {
  return toast.loading(message, options);
};

/**
 * Promise toast - automatically handles loading, success, and error states
 */
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: Error) => string);
  }
) => {
  return toast.promise(promise, messages);
};

/**
 * Action toast - with a custom action button
 */
export const showAction = (
  message: string,
  action: { label: string; onClick: () => void },
  options?: Parameters<typeof toast>[1]
) => {
  return toast(message, {
    action,
    ...options
  });
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Success toast (alias for consistency)
 */
export const showSuccess = toast.success;

/**
 * Error toast (alias for consistency)
 */
export const showError = toast.error; 