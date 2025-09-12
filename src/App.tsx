import { ReactNode, useEffect } from "react";
import { ChallanProvider } from "./context/ChallanContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/toast/ToastProvider";
import { ToastContainer, useToastPortal } from "./components/toast/ToastContainer";
import { useToastContext } from "./components/toast/ToastProvider";
import { setToastContext } from "./components/toast/useToast";
import { ErrorBoundaryProvider } from "./components/ErrorBoundary";

interface AppProps {
  children: ReactNode;
}

function ToastBootstrap() {
  useToastPortal();
  const context = useToastContext();

  useEffect(() => {
    setToastContext(context);
  }, [context]);

  return <ToastContainer />;
}

function App({ children }: AppProps) {
  const handleError = (error: Error, errorInfo: any) => {
    // Custom error handling logic
    console.error('🚨 Application Error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    // You can integrate with external error reporting services here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  return (
    <ErrorBoundaryProvider onError={handleError}>
      <AuthProvider>
        <ChallanProvider>
          <ToastProvider>
            {children}
            <ToastBootstrap />
          </ToastProvider>
        </ChallanProvider>
      </AuthProvider>
    </ErrorBoundaryProvider>
  );
}

export default App;
