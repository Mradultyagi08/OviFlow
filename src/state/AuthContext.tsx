import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { UserProfile } from "../services/api";
import { apiGetMe } from "../services/api";

interface IAuthContext {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

const authInit: IAuthContext = {
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  setUser: () => {},
};

export const AuthContext = createContext<IAuthContext>(authInit);

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("OVIFLOW_token");
    if (stored) {
      setToken(stored);
      apiGetMe(stored)
        .then(({ user: u }) => {
          setUserState(u);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem("OVIFLOW_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: UserProfile) => {
    localStorage.setItem("OVIFLOW_token", newToken);
    setToken(newToken);
    setUserState(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("OVIFLOW_token");
    setToken(null);
    setUserState(null);
  }, []);

  const setUser = useCallback((u: UserProfile) => {
    setUserState(u);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
