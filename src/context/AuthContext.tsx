import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasPermission as checkPermission, type Permission } from '../auth/permissions';
import {
  bootstrapFromEnv,
  getBootstrapConfigured,
  getStoredSession,
  hasAnyUsers,
  login as authLogin,
  logout as authLogout,
} from '../auth/service';
import type { AuthSession, UserRole } from '../auth/types';

interface AuthContextValue {
  session: AuthSession | null;
  isReady: boolean;
  bootstrapConfigured: boolean;
  hasUsers: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [bootstrapConfigured] = useState(getBootstrapConfigured);
  const [hasUsers, setHasUsers] = useState(hasAnyUsers);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await bootstrapFromEnv();
      if (cancelled) return;
      setHasUsers(hasAnyUsers());
      setSession(getStoredSession());
      setIsReady(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await authLogin(username, password);
    if (result.success === false) {
      return { success: false, error: result.error };
    }
    setSession(result.session);
    setHasUsers(true);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setSession(null);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!session) return false;
      return checkPermission(session.role, permission);
    },
    [session]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isReady,
      bootstrapConfigured,
      hasUsers,
      login,
      logout,
      hasPermission,
      role: session?.role ?? null,
    }),
    [session, isReady, bootstrapConfigured, hasUsers, login, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
