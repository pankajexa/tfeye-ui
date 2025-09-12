export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type ToastPlacement = 
  | 'top-right' 
  | 'top-left' 
  | 'bottom-right' 
  | 'bottom-left' 
  | 'top-center' 
  | 'bottom-center';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
  heading?: string;
  description?: string;
  placement?: ToastPlacement;
  duration?: number; // 0 means sticky (no auto-dismiss)
  pauseOnHover?: boolean;
  action?: ToastAction;
  onClose?: (id: string) => void;
  priority?: number; // Higher numbers = higher priority
}

export interface ToastProviderConfig {
  placement?: ToastPlacement;
  defaultDuration?: number;
  maxToasts?: number;
  pauseOnHover?: boolean;
}

export interface ToastState {
  toasts: Toast[];
  activeToasts: Toast[]; // Currently visible toasts
  queuedToasts: Toast[]; // Queued toasts waiting to be shown
}

export type ToastAction_Reducer = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'PAUSE_TOAST'; id: string }
  | { type: 'RESUME_TOAST'; id: string };

export interface ToastContextType {
  state: ToastState;
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  config: Required<ToastProviderConfig>;
  setConfig: (config: Partial<ToastProviderConfig>) => void;
}

/**
 * Theme customization mapping type to CSS classes
 */
export type ToastTheme = {
  [K in ToastType]: {
    container: string;
    icon: string;
    title: string;
    message: string;
    closeButton: string;
    actionButton: string;
  };
};