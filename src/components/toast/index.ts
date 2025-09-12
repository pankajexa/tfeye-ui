/**
 * Toast System - Main Export File
 * Comprehensive toast notification system for React applications
 */

// Core components and providers
export { ToastProvider } from './ToastProvider';
export { ToastContainer } from './ToastContainer';
export { Toast } from './Toast';

// Hooks and utilities
export { useToast, toast } from './useToast';
export { useToastContext } from './ToastProvider';
export { useToastPortal } from './ToastContainer';

// Types for TypeScript users
export type {
  Toast as ToastType,
  ToastAction,
  ToastPlacement,
  ToastProviderConfig,
  ToastState,
  ToastContextType,
  ToastTheme,
} from './types';

// Reducer for advanced usage/testing
export { toastReducer, generateToastId } from './toastReducer';