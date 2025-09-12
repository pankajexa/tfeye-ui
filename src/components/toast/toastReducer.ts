import type { Toast, ToastState, ToastAction_Reducer } from "./types";

export const initialToastState: ToastState = {
  toasts: [],
  activeToasts: [],
  queuedToasts: [],
};

/**
 * Sorts toasts by priority (higher first) then by creation time (newer first)
 */
const sortToastsByPriority = (toasts: Toast[]): Toast[] => {
  return [...toasts].sort((a, b) => {
    const priorityA = a.priority ?? 0;
    const priorityB = b.priority ?? 0;

    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }

    // If same priority, newer toasts first (assuming IDs contain timestamps)
    return b.id.localeCompare(a.id);
  });
};

/**
 * Manages active vs queued toasts based on maxToasts limit
 */
const manageToastQueue = (
  allToasts: Toast[],
  maxToasts: number
): Pick<ToastState, "activeToasts" | "queuedToasts"> => {
  const sortedToasts = sortToastsByPriority(allToasts);

  return {
    activeToasts: sortedToasts.slice(0, maxToasts),
    queuedToasts: sortedToasts.slice(maxToasts),
  };
};

export function toastReducer(
  state: ToastState,
  action: ToastAction_Reducer,
  maxToasts: number = 5
): ToastState {
  switch (action.type) {
    case "ADD_TOAST": {
      const newToasts = [...state.toasts, action.toast];
      const { activeToasts, queuedToasts } = manageToastQueue(
        newToasts,
        maxToasts
      );

      return {
        ...state,
        toasts: newToasts,
        activeToasts,
        queuedToasts,
      };
    }

    case "REMOVE_TOAST": {
      const filteredToasts = state.toasts.filter(
        (toast) => toast.id !== action.id
      );
      const { activeToasts, queuedToasts } = manageToastQueue(
        filteredToasts,
        maxToasts
      );

      return {
        ...state,
        toasts: filteredToasts,
        activeToasts,
        queuedToasts,
      };
    }

    case "CLEAR_ALL": {
      return initialToastState;
    }

    case "PAUSE_TOAST": {
      // This would be handled by the individual toast components
      // The reducer doesn't need to track pause state
      return state;
    }

    case "RESUME_TOAST": {
      // This would be handled by the individual toast components
      return state;
    }

    default:
      return state;
  }
}

/**
 * Generates a unique ID for new toasts
 * Uses timestamp + random string for uniqueness
 */
export const generateToastId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `toast-${timestamp}-${random}`;
};
