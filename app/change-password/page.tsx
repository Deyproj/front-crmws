'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { changePassword } from '@/features/auth/application/changePassword';

export default function ChangePasswordPage() {
  const { user, clearMustChangePassword } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      clearMustChangePassword();
      router.replace(user?.role === 'PLATFORM_ADMIN' ? '/platform' : '/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cambiar la contraseña';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    // dvh, no screen: 100vh no descuenta la barra de direcciones en móvil (ver LoginView.tsx)
    <div className="flex min-h-dvh flex-1 items-center justify-center bg-app px-[var(--space-7)]">
      <div className="w-full max-w-sm">
        <div className="mb-[var(--space-10)] flex flex-col items-center text-center">
          <div className="mb-[var(--space-6)] flex size-8 items-center justify-center rounded-md bg-brand text-on-brand font-bold">
            C
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">Cambia tu contraseña</h1>
          <p className="mt-1 text-sm text-secondary">
            Tu cuenta se creó con una contraseña temporal. Define una nueva antes de continuar.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-[var(--space-7)] rounded-lg border border-border bg-surface p-[var(--space-9)] shadow-sm"
        >
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
            >
              Contraseña temporal
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
            >
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
            >
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand"
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
            {loading ? 'Guardando...' : 'Guardar y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
}
