'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthSession, AuthUser, LoginCredentials } from '../../domain/types';
import { loginUser } from '../../application/loginUser';
import { logoutUser } from '../../application/logoutUser';
import { refreshSession } from '../../application/refreshSession';
import { clearSession, getSession, setSession } from '@/lib/runtime/tokenStorage';

/** Solo rutas internas ("/algo") — nunca un host externo, evita un open redirect vía ?from=. */
function safeRedirectTarget(from: string | null): string {
  if (from && from.startsWith('/') && !from.startsWith('//')) return from;
  return '/';
}

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  logout: () => Promise<void>;
  /** Actualiza la sesión en memoria tras un cambio de contraseña exitoso, sin volver a hacer login. */
  clearMustChangePassword: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isExpired(session: AuthSession): boolean {
  return new Date(session.accessTokenExpiresAt).getTime() <= Date.now();
}

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [session, setLocalSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

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

  useEffect(() => {
    // Una sesión de admin de plataforma no tiene refreshToken (actor esporádico, sin
    // organización) — al expirar el access token simplemente vuelve a iniciar sesión.
    if (!session || !session.refreshToken) return;
    // Renueva antes de que expire el access token (TTL 15m en api-crmws) para que un asesor
    // que deja la pestaña abierta todo el día nunca sufra un 401 duro a mitad de una acción
    // (apiFetch redirige con reload completo, perdiendo cualquier estado sin guardar).
    const REFRESH_BUFFER_MS = 60_000;
    const msUntilExpiry = new Date(session.accessTokenExpiresAt).getTime() - Date.now();
    const delay = Math.max(msUntilExpiry - REFRESH_BUFFER_MS, 5_000);
    const timer = setTimeout(async () => {
      const renewed = await refreshSession(session);
      setLocalSession(renewed);
    }, delay);
    return () => clearTimeout(timer);
  }, [session]);

  // Única fuente de navegación post-sesión: si el submit de LoginView disparara su propio
  // router.replace() además de este efecto, dos fetches RSC del App Router compiten y el
  // decodificador Flight de React revienta con "chunk.reason.enqueueModel is not a function"
  // (mismo síntoma, causa distinta, que el bug ya visto y documentado en LoginView.tsx). Este
  // efecto corre después de que React confirma el nuevo `session`, así que cuando AppShell monte
  // la ruta destino ya lo ve autenticado y no dispara su propio redirect a /login.
  useEffect(() => {
    if (!session) return;
    if (session.user.mustChangePassword) {
      if (pathname !== '/change-password') router.replace('/change-password');
      return;
    }
    if (pathname === '/login') {
      const from = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('from') : null;
      router.replace(safeRedirectTarget(from));
    }
  }, [session, pathname, router]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const newSession = await loginUser(credentials);
    setLocalSession(newSession);
    return newSession;
  }, []);

  const logout = useCallback(async () => {
    await logoutUser();
    clearSession();
    setLocalSession(null);
  }, []);

  const clearMustChangePassword = useCallback(() => {
    setLocalSession((current) => {
      if (!current) return current;
      const updated: AuthSession = { ...current, user: { ...current.user, mustChangePassword: false } };
      setSession(updated);
      return updated;
    });
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      isAuthenticated: !!session,
      isLoading,
      login,
      logout,
      clearMustChangePassword,
    }),
    [session, isLoading, login, logout, clearMustChangePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
