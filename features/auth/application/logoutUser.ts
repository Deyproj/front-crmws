import { logoutRequest } from '../infrastructure/authApi';
import { clearSession, getSession } from '@/lib/runtime/tokenStorage';
import { unsubscribeFromPush } from '@/features/conversations/presentation/context/pushSubscriptionClient';

export async function logoutUser(): Promise<void> {
  const session = getSession();
  // Antes de limpiar la sesión: la baja de la suscripción Web Push necesita el
  // token todavía vigente para autorizar el DELETE contra el backend. Nunca
  // rechaza (best-effort internamente), así que no hace falta un catch aquí.
  await unsubscribeFromPush();
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
