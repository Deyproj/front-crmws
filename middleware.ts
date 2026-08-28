import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MANAGER_ROLES = new Set(['OWNER']);

/**
 * Decodifica el claim "role" del JWT sin verificar la firma — la autorización real
 * ya la aplica api-crmws (RoleGuard) en cada request; esto solo evita que un ASESOR
 * llegue a montar la pantalla de Configuración antes de que el cliente la oculte.
 */
function decodeRole(token: string): string | null {
  try {
    const payloadB64Url = token.split('.')[1];
    const payloadB64 = payloadB64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = payloadB64.padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('crmws_access_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = decodeRole(token);
  const pathname = request.nextUrl.pathname;

  // El admin de plataforma no pertenece a ninguna organización — su único backoffice es
  // /platform (y /change-password, si tiene una contraseña temporal pendiente). El resto de
  // la app asume organizationId/membershipId presentes (bandeja, configuración, etc.).
  if (role === 'PLATFORM_ADMIN') {
    if (pathname !== '/change-password' && !pathname.startsWith('/platform')) {
      return NextResponse.redirect(new URL('/platform', request.url));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith('/platform')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/settings')) {
    if (!role || !MANAGER_ROLES.has(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico).*)'],
};
