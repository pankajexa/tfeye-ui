import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export interface Officer {
  id: string;
  name: string;
  cadre: string;
  psName: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  currentOfficer: Officer | null;
  isLoading: boolean;
  sendOtp: (operatorCD: string, password: string, idCode?: number) => Promise<void>;
  verifyOtp: (operatorCD: string, otp: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = "traffic_challan_auth";

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load authentication state from localStorage on app start
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    if (savedAuth) {
      try {
        const { isAuthenticated: savedIsAuth, currentOfficer: savedOfficer } =
          JSON.parse(savedAuth);
        if (savedIsAuth && savedOfficer) {
          setIsAuthenticated(true);
          setCurrentOfficer(savedOfficer);
        }
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const sendOtp = async (operatorCD: string, password: string, idCode: number = 1) => {
    const { apiService } = await import("../services/api");
    await apiService.sendOtpToMobile(operatorCD, password, idCode);
  };

  const verifyOtp = async (operatorCD: string, otp: string): Promise<boolean> => {
    const { apiService } = await import("../services/api");
    const result = await apiService.verifyOtpForMobile(operatorCD, otp);

    // Map operator profile to Officer UI type
    const officer: Officer = {
      id: result.operatorProfile?.operatorCD,
      name: result.operatorProfile?.operatorName || "Unknown",
      cadre: result.operatorProfile?.cadreName || "",
      psName: result.operatorProfile?.psName || "",
    };

    setIsAuthenticated(true);
    setCurrentOfficer(officer);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        isAuthenticated: true,
        currentOfficer: officer,
        appSessionToken: result.appSessionToken,
        operatorToken: result.operatorToken,
      })
    );

    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentOfficer(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Show loading spinner while checking saved session
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const value: AuthContextType = {
    isAuthenticated,
    currentOfficer,
    isLoading,
    sendOtp,
    verifyOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
