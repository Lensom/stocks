"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type User = { id: number; email: string };

type AuthStore = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = "olivia.jarvis.auth.token.v1";

const AuthContext = createContext<AuthStore | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });
  const [user, setUser] = useState<User | null>(null);
  const isLoading = Boolean(token) && user === null;

  useEffect(() => {
    if (!token) return;
    apiFetch<User>("/auth/me", { token })
      .then((u) => setUser(u))
      .catch(() => {
        window.localStorage.removeItem(STORAGE_KEY);
        setToken(null);
      })
  }, [token]);

  const login: AuthStore["login"] = async (email, password) => {
    const res = await apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    window.localStorage.setItem(STORAGE_KEY, res.access_token);
    setToken(res.access_token);
  };

  const register: AuthStore["register"] = async (email, password) => {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await login(email, password);
  };

  const logout: AuthStore["logout"] = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

