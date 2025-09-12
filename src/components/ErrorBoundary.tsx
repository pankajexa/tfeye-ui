/**
 * COMPREHENSIVE ERROR BOUNDARY SYSTEM
 * 
 * This single file contains all error boundary functionality:
 * - Global and component-level error boundaries
 * - Error reporting and logging
 * - React hooks for error handling
 * - Context provider for error management
 * - Convenience components and utilities
 * 
 * Usage:
 * 1. Wrap your app: <ErrorBoundaryProvider><App /></ErrorBoundaryProvider>
 * 2. Protect components: <ComponentErrorBoundary><Component /></ComponentErrorBoundary>
 * 3. Use hooks: const { handleError } = useErrorHandler();
 * 
 * Examples:
 * - Global: <ErrorBoundaryProvider onError={handleError}><App /></ErrorBoundaryProvider>
 * - Component: <ComponentErrorBoundary componentName="MyComponent"><MyComponent /></ComponentErrorBoundary>
 * - Simple: <SafeComponent name="RiskyComponent"><RiskyComponent /></SafeComponent>
 * - Manual: const { handleError } = useErrorHandler(); handleError(error, { context: 'MyComponent' });
 */

import React, { Component, ErrorInfo, ReactNode, createContext, useContext, useCallback, useMemo, memo } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context?: string;
  timestamp: string;
  url: string;
  userAgent: string;
  componentStack?: string;
  retryCount?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ErrorContextType {
  reportError: (error: Error, context?: string) => void;
  clearErrors: () => void;
  getErrorHistory: () => ErrorReport[];
  getErrorStats: () => {
    total: number;
    bySeverity: Record<string, number>;
    recent: number;
  };
}

interface ErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  fallback?: () => void;
}

// ============================================================================
// ERROR LOGGER (Singleton)
// ============================================================================

class ErrorLogger {
  private static instance: ErrorLogger;
  private errorQueue: ErrorReport[] = [];
  private readonly maxQueueSize = 50;
  private isOnline = navigator.onLine;

  private constructor() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error, context?: string): ErrorReport['severity'] {
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      return 'medium';
    }
    
    if (error.name === 'TypeError' && error.message.includes('Cannot read property')) {
      return 'high';
    }
    
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return 'medium';
    }
    
    if (context?.includes('auth') || context?.includes('login')) {
      return 'critical';
    }
    
    if (context?.includes('upload') || context?.includes('challan')) {
      return 'high';
    }
    
    return 'medium';
  }

  logError(error: Error, errorInfo?: any, context?: string): string {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error, context);
    
    const errorReport: ErrorReport = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      componentStack: errorInfo?.componentStack,
      severity,
    };

    this.errorQueue.push(errorReport);
    
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue = this.errorQueue.slice(-this.maxQueueSize);
    }

    this.storeErrorLocally(errorReport);

    if (this.isOnline) {
      this.sendErrorToService(errorReport);
    }

    return errorId;
  }

  private storeErrorLocally(errorReport: ErrorReport): void {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      const recentErrors = existingErrors.slice(-20);
      localStorage.setItem('errorReports', JSON.stringify(recentErrors));
    } catch (e) {
      console.warn('Failed to store error locally:', e);
    }
  }

  private async sendErrorToService(errorReport: ErrorReport): Promise<void> {
    try {
      // In production, integrate with services like Sentry, LogRocket, etc.
      console.log('Error sent to service:', errorReport);
    } catch (e) {
      console.warn('Failed to send error to service:', e);
    }
  }

  private async flushErrorQueue(): Promise<void> {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];

    for (const errorReport of errorsToSend) {
      await this.sendErrorToService(errorReport);
    }
  }

  getErrorHistory(): ErrorReport[] {
    try {
      return JSON.parse(localStorage.getItem('errorReports') || '[]');
    } catch (e) {
      console.warn('Failed to get error history:', e);
      return [];
    }
  }

  clearErrorHistory(): void {
    try {
      localStorage.removeItem('errorReports');
      this.errorQueue = [];
    } catch (e) {
      console.warn('Failed to clear error history:', e);
    }
  }

  getErrorStats() {
    const errors = this.getErrorHistory();
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recent = errors.filter(error => 
      new Date(error.timestamp) > oneDayAgo
    ).length;

    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: errors.length,
      bySeverity,
      recent,
    };
  }
}

const errorLogger = ErrorLogger.getInstance();

// ============================================================================
// CONTEXT
// ============================================================================

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorReporting = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorReporting must be used within an ErrorBoundaryProvider');
  }
  return context;
};

// ============================================================================
// HOOKS
// ============================================================================

export const useErrorHandler = () => {
  const { reportError } = useErrorReporting();

  const handleError = useCallback((
    error: Error | string,
    options: ErrorHandlerOptions = {}
  ) => {
    const { context, showToast = false, fallback } = options;
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    reportError(errorObj, context);
    
    if (showToast) {
      console.warn('Error toast:', errorObj.message);
    }
    
    if (fallback) {
      try {
        fallback();
      } catch (fallbackError) {
        console.error('Error in fallback function:', fallbackError);
      }
    }
  }, [reportError]);

  const handleAsyncError = useCallback(async (
    asyncFn: () => Promise<any>,
    options: ErrorHandlerOptions = {}
  ) => {
    try {
      return await asyncFn();
    } catch (error) {
      handleError(error as Error, options);
      throw error;
    }
  }, [handleError]);

  return {
    handleError,
    handleAsyncError,
  };
};

// ============================================================================
// MAIN ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  maxRetries?: number;
  componentName?: string;
  enableRetry?: boolean;
  isGlobal?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private readonly maxRetries: number;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.maxRetries = props.maxRetries ?? 3;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    errorLogger.logError(error, errorInfo, this.props.componentName);
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      this.setState({ retryCount: 0 });
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReportBug = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    };

    const subject = `Bug Report - Error ID: ${this.state.errorId}`;
    const body = `Error Details:\n\n${JSON.stringify(errorReport, null, 2)}`;
    const mailtoLink = `mailto:support@yourcompany.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    window.open(mailtoLink);
  };

  private renderGlobalErrorFallback = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-600 mb-6">
            We're sorry, but something unexpected happened. Our team has been notified and we're working to fix it.
          </p>

          {this.props.showDetails && this.state.error && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
              <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Error ID:</strong> {this.state.errorId}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Message:</strong> {this.state.error.message}
              </p>
              {this.state.error.stack && (
                <details className="text-xs text-gray-600">
                  <summary className="cursor-pointer font-medium">Stack Trace</summary>
                  <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {this.state.retryCount < this.maxRetries ? 'Try Again' : 'Reload Page'}
            </button>
            
            <button
              onClick={this.handleGoHome}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </button>
            
            <button
              onClick={this.handleReportBug}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Bug className="h-4 w-4 mr-2" />
              Report Bug
            </button>
          </div>

          {this.state.retryCount > 0 && (
            <p className="mt-4 text-sm text-gray-500">
              Retry attempt: {this.state.retryCount}/{this.maxRetries}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  private renderComponentErrorFallback = () => (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">
            {this.props.componentName ? `${this.props.componentName} Error` : 'Component Error'}
          </h3>
          <p className="text-sm text-red-700 mb-3">
            This component encountered an error and couldn't render properly.
          </p>
          {this.props.enableRetry !== false && (
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-800 bg-red-100 rounded hover:bg-red-200 transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return this.props.isGlobal !== false 
        ? this.renderGlobalErrorFallback()
        : this.renderComponentErrorFallback();
    }

    return this.props.children;
  }
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

export const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({
  children,
  onError,
}) => {
  const reportError = useCallback((error: Error, context?: string) => {
    console.error(`🚨 Error reported from ${context || 'unknown context'}:`, error);
    errorLogger.logError(error, undefined, context);

    if (onError) {
      onError(error, { context });
    }
  }, [onError]);

  const clearErrors = useCallback(() => {
    errorLogger.clearErrorHistory();
  }, []);

  const getErrorHistory = useCallback((): ErrorReport[] => {
    return errorLogger.getErrorHistory();
  }, []);

  const getErrorStats = useCallback(() => {
    return errorLogger.getErrorStats();
  }, []);

  const contextValue = useMemo(() => ({
    reportError,
    clearErrors,
    getErrorHistory,
    getErrorStats,
  }), [reportError, clearErrors, getErrorHistory, getErrorStats]);

  const handleError = useCallback((error: Error, errorInfo: any) => {
    console.error('🚨 ErrorBoundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    if (onError) {
      onError(error, errorInfo);
    }
  }, [onError]);

  return (
    <ErrorContext.Provider value={contextValue}>
      <ErrorBoundary onError={handleError} isGlobal={true}>
        {children}
      </ErrorBoundary>
    </ErrorContext.Provider>
  );
};

// ============================================================================
// CONVENIENCE COMPONENTS
// ============================================================================

// Component-level error boundary
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo, componentName?: string) => void;
  enableRetry?: boolean;
}> = memo(({ children, ...props }) => (
  <ErrorBoundary {...props} isGlobal={false}>
    {children}
  </ErrorBoundary>
));

// Safe wrapper component
export const SafeComponent: React.FC<{
  children: ReactNode;
  name: string;
  fallback?: ReactNode;
  enableRetry?: boolean;
}> = memo(({ children, name, fallback, enableRetry = true }) => (
  <ComponentErrorBoundary
    componentName={name}
    fallback={fallback}
    enableRetry={enableRetry}
  >
    {children}
  </ComponentErrorBoundary>
));

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
export { errorLogger };
export type { ErrorReport, ErrorHandlerOptions };