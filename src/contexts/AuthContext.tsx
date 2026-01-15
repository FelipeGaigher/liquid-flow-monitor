import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCurrentUser, hasStoredTokens, login as apiLogin, logout as apiLogout } from "@/services/api";
import { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      if (!hasStoredTokens()) {
        if (active) setLoading(false);
        return;
      }

      try {
        const currentUser = (await getCurrentUser()) as User;
        if (active) setUser(currentUser);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadUser();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      if (location.pathname !== "/login") {
        navigate("/login", { replace: true });
      }
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => {
      window.removeEventListener("auth:expired", handleExpired);
    };
  }, [location.pathname, navigate]);

  const login = async (email: string, password: string) => {
    const response = await apiLogin(email, password);
    const nextUser = (response?.user ?? (await getCurrentUser())) as User;
    setUser(nextUser);
    return nextUser;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    navigate("/login", { replace: true });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login,
      logout,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
