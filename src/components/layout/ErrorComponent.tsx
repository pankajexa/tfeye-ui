import { AlertTriangle } from "lucide-react";

interface ErrorComponent {
  message?: string;
  onRetry?: () => void;
}

const ErrorComponent = ({ message, onRetry }: ErrorComponent) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Failed to Load Data
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorComponent;
