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
  // request.url ya incluye el basePath configurado (p. ej. "/crmws"), pero new URL()
  // con una ruta absoluta lo descarta por completo — hay que volver a anteponerlo,
  // o el redirect termina en el dominio raíz en vez de bajo la subruta desplegada.
  const withBasePath = (path: string) => new URL(`${request.nextUrl.basePath}${path}`, request.url);

  const token = request.cookies.get('crmws_access_token')?.value;

  if (!token) {
    const loginUrl = withBasePath('/login');
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
      return NextResponse.redirect(withBasePath('/platform'));
    }
    return NextResponse.next();
  }
  if (pathname.startsWith('/platform')) {
    return NextResponse.redirect(withBasePath('/'));
  }

  if (pathname.startsWith('/settings')) {
    if (!role || !MANAGER_ROLES.has(role)) {
      return NextResponse.redirect(withBasePath('/'));
    }
  }

  return NextResponse.next();
}

export const config = {
  // El logo real (public/logo-dinamo-fitness.png) reveló que la exclusión previa solo
  // cubría favicon.ico entre los archivos estáticos — cualquier otro asset de public/
  // (imágenes, íconos futuros) caía en el middleware y, sin cookie de sesión, se
  // redirigía a /login. La optimización de next/image hace un fetch interno a la ruta
  // del asset sin la cookie del navegador, así que también le pegaba a esta regla.
  matcher: ['/((?!api|login|_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico)$).*)'],
};
