import { create } from "zustand";

export interface Officer {
  id: string;
  name: string;
  cadre: string;
  psName: string;
}

type AuthState = {
  isAuthenticated: boolean;
  currentOfficer: Officer | null;
  isLoading: boolean;
  login: (officerId: string, password: string) => boolean;
  logout: () => void;
  hydrateFromStorage: () => void;
};

const STORAGE_KEY = "traffic_challan_auth";

const VALID_CREDENTIALS: Record<
  string,
  { password: string; officer: Officer }
> = {
  "2585272": {
    password: "test@tse",
    officer: {
      id: "2585272",
      name: "Unknown",
      cadre: "Police Constable",
      psName: "Jubilee Hills Traffic PS",
    },
  },
  "2603326": {
    password: "test@tse",
    officer: {
      id: "2603326",
      name: "Unknown",
      cadre: "Police Constable",
      psName: "Jubilee Hills Traffic PS",
    },
  },
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  currentOfficer: null,
  isLoading: true,
  hydrateFromStorage: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.isAuthenticated && parsed?.currentOfficer) {
          set({
            isAuthenticated: true,
            currentOfficer: parsed.currentOfficer as Officer,
          });
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      set({ isLoading: false });
    }
  },
  login: (officerId: string, password: string) => {
    const creds = VALID_CREDENTIALS[officerId];
    if (creds && creds.password === password) {
      set({ isAuthenticated: true, currentOfficer: creds.officer });
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ isAuthenticated: true, currentOfficer: creds.officer })
      );
      return true;
    }
    return false;
  },
  logout: () => {
    set({ isAuthenticated: false, currentOfficer: null });
    localStorage.removeItem(STORAGE_KEY);
  },
}));


