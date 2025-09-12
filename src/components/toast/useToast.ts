import { useCallback } from "react";
import type { Toast, ToastType, ToastPlacement } from "./types";
import { useToastContext } from "./ToastProvider";

interface ToastOptions extends Omit<Toast, "id" | "type"> {}

type HeadingDescription = { heading?: string; description?: string };

type ContentConfigExtras = { placement?: ToastPlacement; variant?: ToastType };

type MessageOrContent = string | (HeadingDescription & ContentConfigExtras);

interface UseToastReturn {
  toast: (options: (ToastOptions & { type?: ToastType; variant?: ToastType }) | (HeadingDescription & ContentConfigExtras & { type?: ToastType })) => string;
  success: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => string;
  error: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => string;
  warning: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => string;
  info: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => string;
  neutral: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => string;
  remove: (id: string) => void;
  clearAll: () => void;
}

/**
 * Primary hook for toast management
 * Provides type-specific methods and general toast creation
 */
export const useToast = (): UseToastReturn => {
  const { addToast, removeToast, clearAll } = useToastContext();

  const toast = useCallback(
    (options: (ToastOptions & { type?: ToastType; variant?: ToastType }) | (HeadingDescription & ContentConfigExtras & { type?: ToastType })): string => {
      const { variant, type, ...rest } = options as any;
      const resolvedType = (variant ?? type ?? "neutral") as ToastType;
      return addToast({ ...(rest as ToastOptions), type: resolvedType });
    },
    [addToast]
  );

  const buildContent = (content: MessageOrContent) => {
    if (typeof content === "string") {
      return { message: content } as const;
    }
    const { heading, description, placement } = content;
    return { heading, description, placement } as const;
  };

  const resolveType = (explicit: ToastType, content: MessageOrContent, options?: { variant?: ToastType }) => {
    if (typeof content === "object" && content.variant) return content.variant;
    if (options?.variant) return options.variant;
    return explicit;
  };

  const success = useCallback(
    (content: MessageOrContent, options: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType } = {}): string => {
      const payload = buildContent(content);
      const finalType = resolveType("success", content, options);
      return addToast({
        type: finalType,
        ...payload,
        ...options,
      });
    },
    [addToast]
  );

  const error = useCallback(
    (content: MessageOrContent, options: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType } = {}): string => {
      const payload = buildContent(content);
      const finalType = resolveType("error", content, options);
      return addToast({
        type: finalType,
        duration: 0, // Error toasts are sticky by default
        ...payload,
        ...options,
      });
    },
    [addToast]
  );

  const warning = useCallback(
    (content: MessageOrContent, options: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType } = {}): string => {
      const payload = buildContent(content);
      const finalType = resolveType("warning", content, options);
      return addToast({
        type: finalType,
        ...payload,
        ...options,
      });
    },
    [addToast]
  );

  const info = useCallback(
    (content: MessageOrContent, options: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType } = {}): string => {
      const payload = buildContent(content);
      const finalType = resolveType("info", content, options);
      return addToast({
        type: finalType,
        ...payload,
        ...options,
      });
    },
    [addToast]
  );

  const neutral = useCallback(
    (content: MessageOrContent, options: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType } = {}): string => {
      const payload = buildContent(content);
      const finalType = resolveType("neutral", content, options);
      return addToast({
        type: finalType,
        ...payload,
        ...options,
      });
    },
    [addToast]
  );

  return {
    toast,
    success,
    error,
    warning,
    info,
    neutral,
    remove: removeToast,
    clearAll,
  };
};

/**
 * Standalone toast function for use outside React components
 * Must be used after ToastProvider is mounted
 */
let toastContext: ReturnType<typeof useToastContext> | null = null;

export const setToastContext = (
  context: ReturnType<typeof useToastContext>
) => {
    toastContext = context;
};

const buildGlobalContent = (content: MessageOrContent) => {
  if (typeof content === "string") {
    return { message: content } as const;
  }
  const { heading, description, placement } = content;
  return { heading, description, placement } as const;
};

const resolveGlobalType = (fallback: ToastType, content: MessageOrContent, options?: { variant?: ToastType }) => {
  if (typeof content === "object" && content.variant) return content.variant;
  if (options?.variant) return options.variant;
  return fallback;
};

export const toast = {
  success: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => {
    if (!toastContext) throw new Error("Toast context not initialized");
    const payload = buildGlobalContent(content);
    const finalType = resolveGlobalType("success", content, options);
    return toastContext.addToast({ type: finalType, ...payload, ...options });
  },
  error: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => {
    if (!toastContext) throw new Error("Toast context not initialized");
    const payload = buildGlobalContent(content);
    const finalType = resolveGlobalType("error", content, options);
    return toastContext.addToast({
      type: finalType,
      duration: 0,
      ...payload,
      ...options,
    });
  },
  warning: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => {
    if (!toastContext) throw new Error("Toast context not initialized");
    const payload = buildGlobalContent(content);
    const finalType = resolveGlobalType("warning", content, options);
    return toastContext.addToast({ type: finalType, ...payload, ...options });
  },
  info: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => {
    if (!toastContext) throw new Error("Toast context not initialized");
    const payload = buildGlobalContent(content);
    const finalType = resolveGlobalType("info", content, options);
    return toastContext.addToast({ type: finalType, ...payload, ...options });
  },
  neutral: (content: MessageOrContent, options?: Omit<ToastOptions, "message" | "title"> & { variant?: ToastType }) => {
    if (!toastContext) throw new Error("Toast context not initialized");
    const payload = buildGlobalContent(content);
    const finalType = resolveGlobalType("neutral", content, options);
    return toastContext.addToast({ type: finalType, ...payload, ...options });
  },
};
