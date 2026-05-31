'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { hasPermission as checkPermission, type Permission } from '../auth/permissions';
import { api } from '../lib/api';
import type { AuthSession, UserRole } from '../auth/types';

interface AuthContextValue {
  session: AuthSession | null;
  isReady: boolean;
  bootstrapConfigured: boolean;
  hasUsers: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [bootstrapConfigured, setBootstrapConfigured] = useState(false);
  const [hasUsers, setHasUsers] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data = await api.auth.getSession();
        if (cancelled) return;
        setBootstrapConfigured(data.bootstrapConfigured);
        setHasUsers(data.hasUsers);
        setSession(data.session);
      } catch {
        if (!cancelled) {
          setBootstrapConfigured(false);
          setHasUsers(false);
          setSession(null);
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const data = await api.auth.login(username, password);
      setSession(data.session);
      setHasUsers(true);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed.',
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } finally {
      setSession(null);
    }
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
