export interface LoginCredentials {
  email: string;
  password: string;
  organizationSlug?: string;
}

/** Refleja AuthResponse de AuthController (api-crmws) — ver POST /api/v1/auth/login. */
export interface AuthUser {
  userId: string;
  organizationId: string;
  membershipId: string;
  role: string;
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  user: AuthUser;
}
