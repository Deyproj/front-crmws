import type { NextRequest } from 'next/server';

/**
 * Extrae el header Authorization del request entrante para reenviarlo al backend.
 * Usar en todos los route handlers de app/api/** que actúan como proxy server-side.
 */
export function forwardAuth(request: NextRequest): Record<string, string> {
  const auth = request.headers.get('authorization');
  return auth ? { Authorization: auth } : {};
}
