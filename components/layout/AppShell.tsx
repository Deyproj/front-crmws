'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { Sidebar } from './Sidebar';

/** Envuelve toda pantalla autenticada: redirige a /login sin sesión, monta el sidebar fijo. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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
    <div className="flex h-screen w-full">
      <Sidebar />
      <main className="flex min-w-0 flex-1 flex-col bg-app">{children}</main>
    </div>
  );
}
