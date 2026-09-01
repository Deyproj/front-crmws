'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { EyeIcon, EyeOffIcon } from '@/components/ui/icons';
import { BASE_PATH } from '@/lib/runtime/basePath';

export function LoginView() {
  const { login } = useAuth();

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
      // No navegamos desde acá: AuthContext ya se encarga de redirigir (a /change-password
      // o al destino post-login) en un efecto disparado por el cambio de sesión. Hacerlo
      // también desde aquí dispara dos router.replace() concurrentes y provoca un crash de
      // React ("chunk.reason.enqueueModel is not a function") por dos fetches RSC
      // compitiendo en el App Router.
      await login({
        email: email.trim(),
        password,
        organizationSlug: organizationSlug.trim() || undefined,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(msg.includes('401') ? 'Correo o contraseña incorrectos' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    // dvh, no screen (100vh fijo): en móvil 100vh no descuenta la barra de
    // direcciones/navegación, dejando el formulario cortado o mal centrado.
    <div className="relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden bg-app px-[var(--space-7)]">
      {/* Forma orgánica decorativa — motivo de marca Dinamo Fitness, ver styles/utilities.css#shape-blob */}
      <div
        aria-hidden="true"
        className="shape-blob pointer-events-none absolute -right-24 -top-24 size-[420px] bg-blob opacity-60 sm:size-[520px]"
      />
      <div
        aria-hidden="true"
        className="shape-blob pointer-events-none absolute -bottom-32 -left-24 size-[360px] bg-blob opacity-40"
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-[var(--space-10)] flex flex-col items-center text-center">
          {/* Logo real de Dinamo Fitness es blanco — necesita el chip oscuro de fondo para verse
              sobre la tarjeta clara del login (mismo motivo por el que el sidebar sí es oscuro). */}
          <div className="mb-[var(--space-6)] flex items-center justify-center rounded-xl bg-sidebar px-[var(--space-7)] py-[var(--space-5)]">
            <Image src={`${BASE_PATH}/logo-dinamo-fitness.png`} alt="Dinamo Fitness" width={282} height={81} className="h-9 w-auto" priority />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-ink">Dinabot</h1>
          <p className="mt-1 text-sm text-secondary">Inicia sesión para continuar</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[var(--space-7)] rounded-xl border border-border bg-surface p-[var(--space-9)] shadow-sm"
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

          {/* <div>
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
          </div> */}

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
