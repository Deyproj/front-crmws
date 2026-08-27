import type { AuthSession } from '@/features/auth/domain/types';

const SESSION_KEY = 'crmws_session';

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  // Cookie para que un futuro middleware (server-side) pueda verificar la sesión sin localStorage.
  const maxAge = 60 * 60 * 24; // 24h
  document.cookie = `crmws_access_token=${session.accessToken}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  document.cookie = 'crmws_access_token=; path=/; max-age=0';
}
