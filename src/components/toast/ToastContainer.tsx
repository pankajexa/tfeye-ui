import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ToastPlacement } from './types';
import { useToastContext } from './ToastProvider';
import { Toast } from './Toast';
import { cn } from '@/lib/utils';

interface ToastContainerProps {
  className?: string;
}

const placementStyles: Record<ToastPlacement, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

/**
 * Container component that renders all active toasts in a portal
 * Provides ARIA live regions and proper positioning
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ className }) => {
  const { state, config, removeToast } = useToastContext();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalRoot = document.getElementById('toast-root') || document.body;

  // Group toasts by placement (fall back to provider config placement)
  const groups = state.activeToasts.reduce<Record<ToastPlacement, typeof state.activeToasts>>((acc, t) => {
    const p = (t.placement ?? config.placement) as ToastPlacement;
    (acc[p] ||= [] as any).push(t);
    return acc;
  }, {
    'top-right': [],
    'top-left': [],
    'top-center': [],
    'bottom-right': [],
    'bottom-left': [],
    'bottom-center': [],
  });

  return createPortal(
    <>
      {/* ARIA Live Regions (shared) */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="sr-only"
        role="status"
      >
        {state.activeToasts.length > 0 && (
          <span>
            {state.activeToasts.length} notification{state.activeToasts.length !== 1 ? 's' : ''} available
          </span>
        )}
      </div>

      <div
        aria-live="assertive"
        aria-atomic="false" 
        className="sr-only"
        role="alert"
      >
        {state.activeToasts
          .filter(toast => toast.type === 'error')
          .map(toast => (
            <span key={toast.id}>
              {toast.heading || toast.title || toast.description || toast.message}
            </span>
          ))}
      </div>

      {/* Render a positioned stack for each placement that has items */}
      {((Object.keys(groups) as ToastPlacement[])).map((placement) => (
        groups[placement].length > 0 ? (
          <div
            key={placement}
            className={cn(
              'toast-container fixed z-50 pointer-events-none',
              'flex flex-col gap-3 max-h-screen overflow-hidden',
              placementStyles[placement],
              className
            )}
            aria-label={`Notifications ${placement}`}
          >
            {groups[placement].map((toast, index) => (
              <div
                key={toast.id}
                className="pointer-events-auto"
                style={{
                  // Stagger animation delays for smoother entrance
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <Toast
                  toast={toast}
                  placement={placement}
                  onRemove={removeToast}
                />
              </div>
            ))}
          </div>
        ) : null
      ))}
    </>,
    portalRoot
  );
};

/**
 * Hook to initialize toast portal root
 * Ensures the portal container exists in the DOM
 */
export const useToastPortal = () => {
  useEffect(() => {
    let toastRoot = document.getElementById('toast-root');
    
    if (!toastRoot) {
      toastRoot = document.createElement('div');
      toastRoot.id = 'toast-root';
      toastRoot.className = 'toast-portal-root';
      document.body.appendChild(toastRoot);
    }

    return () => {
      // Cleanup on unmount if no toasts exist
      const root = document.getElementById('toast-root');
      if (root && !root.hasChildNodes()) {
        root.remove();
      }
    };
  }, []);
};