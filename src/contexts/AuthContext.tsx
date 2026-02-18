"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

interface AuthContextValue {
  isAdmin: boolean | null;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      const data = await res.json();
      if (mounted.current) setIsAdmin(!!data?.isAdmin);
    } catch {
      if (mounted.current) setIsAdmin(false);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    return () => {
      mounted.current = false;
    };
  }, [refetch]);

  const login = useCallback(
    async (password: string): Promise<boolean> => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) return false;
      await refetch();
      return true;
    },
    [refetch]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    await refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{ isAdmin, isLoading, login, logout, refetch }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
