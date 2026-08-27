'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthSession, AuthUser, LoginCredentials } from '../../domain/types';
import { loginUser } from '../../application/loginUser';
import { logoutUser } from '../../application/logoutUser';
import { refreshSession } from '../../application/refreshSession';
import { clearSession, getSession } from '@/lib/runtime/tokenStorage';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isExpired(session: AuthSession): boolean {
  return new Date(session.accessTokenExpiresAt).getTime() <= Date.now();
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setLocalSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restore() {
      const saved = getSession();
      if (!saved) {
        setIsLoading(false);
        return;
      }
      if (isExpired(saved)) {
        const renewed = await refreshSession(saved);
        setLocalSession(renewed);
      } else {
        setLocalSession(saved);
      }
      setIsLoading(false);
    }
    restore();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const newSession = await loginUser(credentials);
    setLocalSession(newSession);
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    clearSession();
    setLocalSession(null);
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
    }),
    [session, isLoading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
