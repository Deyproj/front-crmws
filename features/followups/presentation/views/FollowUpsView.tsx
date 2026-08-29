'use client';

import { useFollowUps } from '../hooks/useFollowUps';
import { REASON_LABELS } from '@/features/followups';
import { initials } from '@/lib/utils/initials';

export function FollowUpsView() {
  const { items, loading, detecting, actionPending, error, detect, resolve, dismiss } = useFollowUps();

  return (
    <div className="flex h-full flex-col">
      <header className="flex min-h-[var(--topbar-height)] shrink-0 flex-wrap items-center justify-between gap-y-[var(--space-4)] border-b border-border bg-surface px-[var(--space-7)] py-[var(--space-4)] sm:px-[var(--space-9)]">
        <h1 className="text-xl font-bold text-ink">Seguimientos</h1>
        <button
          type="button"
          onClick={detect}
          disabled={detecting}
          className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {detecting ? 'Detectando...' : 'Detectar seguimientos'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        <p className="mb-[var(--space-7)] text-sm text-secondary">
          Contactos que probablemente necesitan que un asesor los retome — no se les envía ningún mensaje automático.
        </p>

        {error && (
          <p className="mb-[var(--space-6)] rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-secondary">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-secondary">Sin seguimientos pendientes. Prueba &quot;Detectar seguimientos&quot;.</p>
        ) : (
          <div className="flex flex-col gap-[var(--space-5)]">
            {items.map(({ task, contact }) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-[var(--space-6)] rounded-lg border border-border bg-surface p-[var(--space-7)]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
                  {initials(contact?.name, contact?.phone ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {contact?.name || contact?.phone || 'Contacto sin nombre'}
                  </p>
                  <p className="text-xs text-secondary">{REASON_LABELS[task.reason]}</p>
                </div>
                <p className="shrink-0 text-xs text-secondary">
                  {new Date(task.detectedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </p>
                <div className="flex shrink-0 gap-[var(--space-4)]">
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => resolve(task.id)}
                    className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
                  >
                    Resuelto
                  </button>
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => dismiss(task.id)}
                    className="rounded-md px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-secondary hover:bg-app disabled:opacity-50"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
