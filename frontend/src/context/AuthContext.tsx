import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import * as meetingsApi from "../api/meetings";
import { ApiClientError } from "../api/client";
import type { TokenResponse } from "../types";

const ACCESS_TOKEN_KEY = "mia_access_token";
const REFRESH_TOKEN_KEY = "mia_refresh_token";

interface AuthContextValue {
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  authFetch: <T>(fn: (token: string) => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function storeTokens(tokens: TokenResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAccessToken(localStorage.getItem(ACCESS_TOKEN_KEY));
    setRefreshToken(localStorage.getItem(REFRESH_TOKEN_KEY));
    setIsLoading(false);
  }, []);

  const applyTokens = useCallback((tokens: TokenResponse) => {
    storeTokens(tokens);
    setAccessToken(tokens.access_token);
    setRefreshToken(tokens.refresh_token);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const tokens = await meetingsApi.login(email, password);
      applyTokens(tokens);
    },
    [applyTokens],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const tokens = await meetingsApi.signup(email, password);
      applyTokens(tokens);
    },
    [applyTokens],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setRefreshToken(null);
  }, []);

  const refreshSession = useCallback(async () => {
    if (!refreshToken) throw new ApiClientError(401, "Not authenticated");
    const tokens = await meetingsApi.refresh(refreshToken);
    applyTokens(tokens);
    return tokens.access_token;
  }, [applyTokens, refreshToken]);

  const authFetch = useCallback(
    async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
      if (!accessToken) throw new ApiClientError(401, "Not authenticated");
      try {
        return await fn(accessToken);
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 401 && refreshToken) {
          const newToken = await refreshSession();
          return fn(newToken);
        }
        throw error;
      }
    },
    [accessToken, refreshSession, refreshToken],
  );

  const value = useMemo(
    () => ({
      accessToken,
      isAuthenticated: Boolean(accessToken),
      isLoading,
      login,
      signup,
      logout,
      authFetch,
    }),
    [accessToken, authFetch, isLoading, login, logout, signup],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
