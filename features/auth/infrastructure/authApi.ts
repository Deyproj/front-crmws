import type { LoginCredentials } from '../domain/types';
import { BASE_PATH } from '@/lib/runtime/basePath';

/** Forma cruda de AuthResponse (api-crmws, identity/presentation/AuthResponse.java). */
export interface AuthResponsePayload {
  accessToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshToken: string | null;
  userId: string;
  organizationId: string | null;
  membershipId: string | null;
  role: string;
  mustChangePassword: boolean;
}

/** Forma cruda de RefreshResponse (api-crmws, identity/presentation/RefreshResponse.java). */
export interface RefreshResponsePayload {
  accessToken: string;
  tokenType: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `Error ${res.status}`);
  }
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export async function loginRequest(credentials: LoginCredentials): Promise<AuthResponsePayload> {
  const res = await fetch(`${BASE_PATH}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return parseOrThrow<AuthResponsePayload>(res);
}

export async function refreshRequest(refreshToken: string): Promise<RefreshResponsePayload> {
  const res = await fetch(`${BASE_PATH}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return parseOrThrow<RefreshResponsePayload>(res);
}

export async function logoutRequest(refreshToken: string): Promise<void> {
  await fetch(`${BASE_PATH}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
}

