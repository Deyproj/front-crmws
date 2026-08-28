'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';

/** Solo rutas internas ("/algo") — nunca un host externo, evita un open redirect vía ?from=. */
function safeRedirectTarget(from: string | null): string {
  if (from && from.startsWith('/') && !from.startsWith('//')) return from;
  return '/';
}

export function LoginView() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [organizationSlug, setOrganizationSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({
        email: email.trim(),
        password,
        organizationSlug: organizationSlug.trim() || undefined,
      });
      router.replace(safeRedirectTarget(searchParams.get('from')));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(msg.includes('401') ? 'Correo o contraseña incorrectos' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-app px-[var(--space-7)]">
      <div className="w-full max-w-sm">
        <div className="mb-[var(--space-10)] flex flex-col items-center text-center">
          <div className="mb-[var(--space-6)] flex size-8 items-center justify-center rounded-md bg-brand text-on-brand font-bold">
            C
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">CRMWS</h1>
          <p className="mt-1 text-sm text-secondary">Inicia sesión para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[var(--space-7)] rounded-lg border border-border bg-surface p-[var(--space-9)] shadow-sm"
        >
          <div>
            <label htmlFor="email" className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary">
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="asesor@gimnasio.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] pr-10 text-sm text-ink placeholder-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-secondary hover:text-ink"
              >
                {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="organizationSlug"
              className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
            >
              Organización (opcional)
            </label>
            <input
              id="organizationSlug"
              type="text"
              autoComplete="organization"
              value={organizationSlug}
              onChange={(e) => setOrganizationSlug(e.target.value)}
              className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
              placeholder="Solo si perteneces a más de una"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-danger/30 bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-brand px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-on-brand transition-colors hover:bg-brand-hover active:bg-brand-pressed focus:outline-none focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
