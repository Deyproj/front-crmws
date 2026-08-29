'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { Sidebar } from './Sidebar';
import { MenuIcon } from '@/components/ui/icons';

/**
 * Envuelve toda pantalla autenticada: redirige a /login sin sesión, monta el sidebar
 * (fijo en lg+, drawer con topbar propia en pantallas más chicas — ver
 * docs/07-frontend/00-vision-and-scope.md#responsive). El drawer se cierra al tocar un
 * NavItem (ver Sidebar#onNavigate); no hace falta un efecto aparte sobre el pathname.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center bg-app">
        <p className="text-sm text-secondary">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-[var(--space-6)] border-b border-border bg-surface px-[var(--space-7)] lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-1 text-secondary hover:bg-app hover:text-ink"
          >
            <MenuIcon className="size-5" />
          </button>
          <p className="text-sm font-bold text-ink">CRMWS</p>
        </div>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-app">{children}</main>
      </div>
    </div>
  );
}
