import { logoutRequest } from '../infrastructure/authApi';
import { clearSession, getSession } from '@/lib/runtime/tokenStorage';

export async function logoutUser(): Promise<void> {
  const session = getSession();
  clearSession();
  // Una sesión de admin de plataforma no tiene refreshToken que revocar (ver AuthSession).
  if (!session || !session.refreshToken) return;

  // Revocar en el backend es best-effort: la sesión local ya quedó limpia aunque falle la red.
  try {
    await logoutRequest(session.refreshToken);
  } catch {
    // Sin acción: el refresh token igual expira solo del lado del servidor.
  }
}
