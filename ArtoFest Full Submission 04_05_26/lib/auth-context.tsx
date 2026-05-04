import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from "./auth-storage";

export type AuthSession = {
  token: string;
  email: string;
  username?: string | null;
  loggedInAt: string;
};

type LoginPayload = {
  token: string;
  email: string;
  username?: string | null;
};

type AuthContextValue = {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const raw = await getAuthSession();

        if (!raw) {
          if (isMounted) {
            setSession(null);
          }
          return;
        }

        const parsed = JSON.parse(raw) as AuthSession;

        if (
          !parsed ||
          typeof parsed.token !== "string" ||
          typeof parsed.email !== "string"
        ) {
          await clearAuthSession();
          if (isMounted) {
            setSession(null);
          }
          return;
        }

        if (isMounted) {
          setSession(parsed);
        }
      } catch {
        await clearAuthSession();
        if (isMounted) {
          setSession(null);
        }
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  async function login(payload: LoginPayload) {
    const nextSession: AuthSession = {
      token: payload.token,
      email: payload.email,
      username: payload.username ?? null,
      loggedInAt: new Date().toISOString(),
    };

    await saveAuthSession(JSON.stringify(nextSession));
    setSession(nextSession);
  }

  async function logout() {
    await clearAuthSession();
    setSession(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isHydrating,
      login,
      logout,
    }),
    [session, isHydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return value;
}