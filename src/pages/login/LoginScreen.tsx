import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Shield, Smartphone, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/toast";

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [operatorCD, setOperatorCD] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpPhase, setOtpPhase] = useState(false);
  const [otp, setOtp] = useState("");
  const { sendOtp, verifyOtp, isAuthenticated } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!otpPhase) {
        await sendOtp(operatorCD.trim(), password.trim());
        setOtpPhase(true);
        showSuccessToast({ heading: "OTP Sent", description: "Please enter the OTP sent to your registered mobile number.", placement: "top-right" });
      } else {
        const ok = await verifyOtp(operatorCD.trim(), otp.trim());
        if (ok) {
          showSuccessToast({ heading: "Welcome", description: "Login successful.", placement: "top-right" });
          navigate("/dashboard", { replace: true });
        }
      }
    } catch (e) {
      const msg = (e && (e as any).message) || (otpPhase ? "OTP verification failed" : "Failed to send OTP");
      setError(msg);
      showErrorToast({ heading: "Login error", description: msg, placement: "top-center" });
    }

    setIsLoading(false);
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 bg-gradient-to-br  flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-white">
            Traffic Challan AI
          </h1>
          <p className="mt-2 text-sm text-gray-200">
            Telangana Traffic Police - Officer Login
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="operatorCD"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Operator Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="operatorCD"
                  name="operatorCD"
                  type="text"
                  required
                  value={operatorCD}
                  onChange={(e) => setOperatorCD(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your operator code"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {otpPhase && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter the OTP"
                />
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              className="w-full"
              size={"lg"}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {otpPhase ? 'Verifying OTP...' : 'Sending OTP...'}
                </div>
              ) : (
                otpPhase ? 'Verify OTP' : 'Send OTP'
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Authorized personnel only. Enter your operator code and password to receive OTP.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-200">
          <p>Secure Login System v2.0</p>
          <p className="mt-1">© 2025 Telangana Traffic Police</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
