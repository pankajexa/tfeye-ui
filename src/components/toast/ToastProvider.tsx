/**
 * ToastProvider - Context provider for toast system
 * Manages global toast state and provides configuration
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import type {
  Toast,
  ToastState,
  ToastContextType,
  ToastProviderConfig,
} from "./types";
import {
  toastReducer,
  initialToastState,
  generateToastId,
} from "./toastReducer";

const ToastContext = createContext<ToastContextType | null>(null);

interface ToastProviderProps extends ToastProviderConfig {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  placement = "top-right",
  defaultDuration = 5000,
  maxToasts = 5,
  pauseOnHover = true,
}) => {
  // Config state (supports dynamic updates)
  const [config, setConfigState] = useState<Required<ToastProviderConfig>>({
    placement,
    defaultDuration,
    maxToasts,
    pauseOnHover,
  });

  // Keep a ref for reducer access to latest maxToasts without re-creating reducer
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  // Sync external prop changes into config state
  useEffect(() => {
    setConfigState({ placement, defaultDuration, maxToasts, pauseOnHover });
  }, [placement, defaultDuration, maxToasts, pauseOnHover]);

  const [state, dispatch] = useReducer(
    (currentState: ToastState, action: Parameters<typeof toastReducer>[1]) =>
      toastReducer(currentState, action, configRef.current.maxToasts),
    initialToastState
  );

  const addToast = useCallback((toastData: Omit<Toast, "id">): string => {
    const id = generateToastId();
    const current = configRef.current;
    const toast: Toast = {
      id,
      duration: current.defaultDuration,
      pauseOnHover: current.pauseOnHover,
      priority: 0,
      ...toastData,
    };

    dispatch({ type: "ADD_TOAST", toast });
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    dispatch({ type: "REMOVE_TOAST", id });
  }, []);

  const clearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const setConfig = useCallback((partial: Partial<ToastProviderConfig>) => {
    setConfigState((prev) => ({ ...prev, ...partial }));
  }, []);

  const contextValue: ToastContextType = {
    state,
    addToast,
    removeToast,
    clearAll,
    config,
    setConfig,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToastContext = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
};
