/**
 * Toast Component - Individual toast notification
 * Handles animation, accessibility, and user interactions
 */

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X, MessageCircle } from 'lucide-react';
import type { Toast as ToastType, ToastPlacement } from './types';
import { cn } from '@/lib/utils';

interface ToastProps {
  toast: ToastType;
  placement: ToastPlacement;
  onRemove: (id: string) => void;
  isExiting?: boolean;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  neutral: MessageCircle,
} as const;

const toastStyles = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-700',
    icon: 'text-toast-success',
    title: 'text-toast-success font-semibold',
    message: 'text-toast-success/80',
    closeButton: 'text-toast-success/60 hover:text-toast-success',
    actionButton: 'bg-toast-success text-white hover:bg-toast-success/90',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-500',
    icon: 'text-toast-error',
    title: 'text-toast-error font-semibold',
    message: 'text-toast-error/80',
    closeButton: 'text-toast-error/60 hover:text-toast-error',
    actionButton: 'bg-toast-error text-white hover:bg-toast-error/90',
  },
  warning: {
    container: 'bg-orange-50 border-orange-200 text-orange-500',
    icon: 'text-toast-warning',
    title: 'text-toast-warning font-semibold',
    message: 'text-toast-warning/80',
    closeButton: 'text-toast-warning/60 hover:text-toast-warning',
    actionButton: 'bg-toast-warning text-white hover:bg-toast-warning/90',
  },
  info: {
    container: 'bg-toast-info-light border-toast-info-border text-toast-info',
    icon: 'text-toast-info',
    title: 'text-toast-info font-semibold',
    message: 'text-toast-info/80',
    closeButton: 'text-toast-info/60 hover:text-toast-info',
    actionButton: 'bg-toast-info text-white hover:bg-toast-info/90',
  },
  neutral: {
    container: 'bg-toast-neutral-light border-toast-neutral-border text-toast-neutral',
    icon: 'text-toast-neutral',
    title: 'text-toast-neutral font-semibold',
    message: 'text-toast-neutral/80',
    closeButton: 'text-toast-neutral/60 hover:text-toast-neutral',
    actionButton: 'bg-toast-neutral text-white hover:bg-toast-neutral/90',
  },
} as const;

/**
 * Individual toast component with full accessibility support
 * Handles timers, animations, and keyboard interactions
 */
export const Toast: React.FC<ToastProps> = ({
  toast,
  placement,
  onRemove,
  isExiting = false,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const toastRef = useRef<HTMLDivElement>(null);

  const IconComponent = toastIcons[toast.type];
  const styles = toastStyles[toast.type];
  const isLeftPlacement = placement.includes('left');
  const isRightPlacement = placement.includes('right');

  // Handle auto-dismiss timer
  useEffect(() => {
    if (toast.duration === 0) return; // Sticky toast

    const startTimer = () => {
      if (!isPaused) {
        timerRef.current = setTimeout(() => {
          handleRemove();
        }, toast.duration);
      }
    };

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }
    };

    if (!isPaused) {
      startTimer();
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [toast.duration, isPaused, toast.id]);

  // Handle entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => {
      onRemove(toast.id);
      toast.onClose?.(toast.id);
    }, 200);
  };

  const handleMouseEnter = () => {
    if (toast.pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (toast.pauseOnHover) {
      setIsPaused(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleRemove();
    }
    if (event.key === 'Enter' && toast.action) {
      toast.action.onClick();
    }
  };

  // Determine animation classes
  const getAnimationClasses = () => {
    const isEntering = isVisible && !isExiting;
    const isExitingAnimation = isExiting || !isVisible;

    if (isLeftPlacement) {
      return isEntering 
        ? 'animate-toast-enter-left' 
        : isExitingAnimation 
          ? 'animate-toast-exit-left' 
          : '';
    } else {
      return isEntering 
        ? 'animate-toast-enter' 
        : isExitingAnimation 
          ? 'animate-toast-exit' 
          : '';
    }
  };

  // ARIA properties based on toast type
  const getAriaProps = () => {
    const isUrgent = toast.type === 'error';
    return {
      role: 'alert' as const,
      'aria-live': (isUrgent ? 'assertive' : 'polite') as 'assertive' | 'polite',
      'aria-atomic': true as const,
    };
  };

  const displayHeading = toast.heading ?? toast.title;
  const displayDescription = toast.description ?? toast.message;

  return (
    <div
      ref={toastRef}
      className={cn(
        // Base styles
        'toast-item relative flex items-start gap-3 p-4 rounded-lg border shadow-toast',
        'max-w-md w-full transition-all duration-200 focus-within:ring-2 focus-within:ring-primary',
        
        // Reduce motion support
        'motion-reduce:animate-none motion-reduce:transition-none',
        
        // Type-specific styling
        styles.container,
        
        // Animation classes
        getAnimationClasses()
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      {...getAriaProps()}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        <IconComponent 
          size={20} 
          className={cn(styles.icon, 'drop-shadow-sm')}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {displayHeading && (
          <h3 className={cn('text-sm leading-5 mb-1', styles.title)}>
            {displayHeading}
          </h3>
        )}
        
        {displayDescription && (
          <p className={cn('text-sm leading-5', styles.message)}>
            {displayDescription}
          </p>
        )}

        {/* Action Button */}
        {toast.action && (
          <button
            onClick={() => {
              toast.action!.onClick();
              handleRemove();
            }}
            className={cn(
              'mt-3 px-3 py-1.5 text-xs font-medium rounded-md',
              'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
              styles.actionButton
            )}
            type="button"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={handleRemove}
        className={cn(
          'flex-shrink-0 p-1 cursor-pointer rounded-md transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
          styles.closeButton
        )}
        type="button"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>

      {/* Progress Bar for timed toasts */}
      {toast.duration !== 0 && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-bl-lg"
          style={{
            width: '100%',
            animation: isPaused ? 'paused' : `toast-progress ${toast.duration}ms linear`,
          }}
        />
      )}
    </div>
  );
};

// Add CSS animation for progress bar
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes toast-progress {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
  document.head.appendChild(style);
}