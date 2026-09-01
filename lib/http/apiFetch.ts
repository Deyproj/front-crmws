import { clearSession, getSession } from '@/lib/runtime/tokenStorage';
import { BASE_PATH } from '@/lib/runtime/basePath';

function buildAuthHeaders(): Record<string, string> {
  const session = getSession();
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}

function handleUnauthorized(): never {
  clearSession();
  // Recarga completa a propósito: apiFetch es un módulo plano sin acceso a useRouter, y un 401
  // implica que el estado en memoria de toda la app (React Query-less, sin store global) ya no
  // es confiable — mismo patrón que front-guardian (lib/http/apiFetch.ts).
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  if (typeof window !== 'undefined') window.location.href = `${BASE_PATH}/login`;
  throw new Error('Sesión expirada');
}

/**
 * El backend devuelve ProblemDetail (application/problem+json) con el mensaje de negocio en
 * `detail` para errores 4xx (409 de conflicto, 400 de validación) — ver ConversationExceptionHandler.
 * Si el cuerpo no es ese formato, cae al texto crudo.
 */
function extractErrorMessage(text: string, status: number): string {
  try {
    const problem = JSON.parse(text) as { detail?: string; message?: string };
    return problem.detail ?? problem.message ?? text;
  } catch {
    return text || `Error ${status}`;
  }
}

/**
 * Fetch autorizado hacia las rutas proxy same-origin de app/api/** (nunca al backend directo).
 * Si el backend responde 401, limpia la sesión y redirige a /login — no reintenta con refresh
 * automáticamente; ver features/auth/presentation/context/AuthContext.tsx para la renovación
 * al cargar la página.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_PATH}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
      ...(init?.headers as Record<string, string>),
    },
  });
  if (res.status === 401) handleUnauthorized();
  const text = await res.text();
  if (!res.ok) {
    throw new Error(extractErrorMessage(text, res.status));
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}
