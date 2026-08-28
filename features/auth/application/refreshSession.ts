import type { AuthSession } from '../domain/types';
import { refreshRequest } from '../infrastructure/authApi';
import { clearSession, setSession } from '@/lib/runtime/tokenStorage';

/**
 * Renueva el access token manteniendo el mismo usuario. Limpia la sesión si el refresh falla.
 * Una sesión de admin de plataforma no tiene refreshToken (ver TokenIssuer.issuePlatform en el
 * backend) — en ese caso no hay nada que renovar, la sesión simplemente expira y exige re-login.
 */
export async function refreshSession(current: AuthSession): Promise<AuthSession | null> {
  if (!current.refreshToken) return current;
  try {
    const response = await refreshRequest(current.refreshToken);
    const session: AuthSession = {
      accessToken: response.accessToken,
      accessTokenExpiresAt: response.accessTokenExpiresAt,
      refreshToken: response.refreshToken,
      user: current.user,
    };
    setSession(session);
    return session;
  } catch {
    clearSession();
    return null;
  }
}
