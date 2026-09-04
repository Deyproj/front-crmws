import type { AuthSession, LoginCredentials } from '../domain/types';
import { loginRequest } from '../infrastructure/authApi';
import { setSession } from '@/lib/runtime/tokenStorage';

export async function loginUser(credentials: LoginCredentials): Promise<AuthSession> {
  const response = await loginRequest(credentials);

  const session: AuthSession = {
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    refreshToken: response.refreshToken,
    user: {
      userId: response.userId,
      organizationId: response.organizationId,
      membershipId: response.membershipId,
      role: response.role,
      name: response.name,
      mustChangePassword: response.mustChangePassword,
    },
  };

  setSession(session);
  return session;
}
