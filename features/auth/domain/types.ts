export interface LoginCredentials {
  email: string;
  password: string;
  organizationSlug?: string;
}

/**
 * Refleja AuthResponse de AuthController (api-crmws) — ver POST /api/v1/auth/login.
 * Para una sesión de admin de plataforma (role === 'PLATFORM_ADMIN'), organizationId
 * y membershipId vienen null: ese actor no pertenece a ninguna organización.
 */
export interface AuthUser {
  userId: string;
  organizationId: string | null;
  membershipId: string | null;
  role: string;
  name: string;
  mustChangePassword: boolean;
}

export interface AuthSession {
  accessToken: string;
  accessTokenExpiresAt: string;
  /** Null para una sesión de admin de plataforma — sin refresh, ver TokenIssuer.issuePlatform en el backend. */
  refreshToken: string | null;
  user: AuthUser;
}
