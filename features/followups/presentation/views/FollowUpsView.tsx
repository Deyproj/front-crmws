'use client';

import { useFollowUps } from '../hooks/useFollowUps';
import { REASON_LABELS } from '@/features/followups';
import { initials } from '@/lib/utils/initials';
import { InfoIcon, ClockIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';

function FollowUpCriteriaInfo() {
  return (
    <span className="group/info relative inline-flex">
      <button
        type="button"
        aria-label="Cómo se arma esta lista"
        aria-describedby="followups-criteria-tooltip"
        className="flex size-5 items-center justify-center rounded-full text-secondary hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
      >
        <InfoIcon className="size-4" />
      </button>
      <span
        id="followups-criteria-tooltip"
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-10 mt-[var(--space-3)] w-72 origin-top-left rounded-md border border-border bg-surface p-[var(--space-5)] text-xs text-secondary opacity-0 shadow-lg transition-opacity duration-150 group-hover/info:opacity-100 group-focus-within/info:opacity-100"
      >
        <p className="mb-[var(--space-3)] font-semibold text-ink">Cómo se arma esta lista</p>
        <p className="mb-[var(--space-2)]">
          Solo se llena al presionar &quot;Detectar seguimientos&quot; — no corre en segundo plano ni hay un
          horario automático.
        </p>
        <p className="mb-[var(--space-2)]">Hoy detecta tres señales:</p>
        <ul className="mb-[var(--space-2)] list-disc space-y-1 pl-4">
          <li>Citas de cortesía marcadas como inasistencia.</li>
          <li>Contactos con intención de visita detectada por el agente que aún no tienen cita agendada ni realizada.</li>
          <li>Contactos cuya oportunidad quedó &quot;En seguimiento&quot; en el panel del contacto.</li>
        </ul>
        <p className="mb-[var(--space-2)]">
          No incluye señales por tiempo (sin respuesta, oportunidad estancada) — faltan por validar con negocio.
        </p>
        <p className="mb-[var(--space-2)] font-semibold text-ink">¿Cómo sale un contacto de esta lista?</p>
        <p className="mb-[var(--space-2)]">
          Solo cuando lo marcas como &quot;Oportunidad&quot; o &quot;Ganado&quot; desde su panel — ya no hay un botón
          &quot;Resuelto&quot; manual. &quot;Descartar&quot; sigue disponible para falsos positivos.
        </p>
        <p>
          Según cuánto tiempo lleve un contacto aquí, el sistema puede enviarle mensajes automáticos por WhatsApp —
          configúralos en Configuración → Seguimientos.
        </p>
      </span>
    </span>
  );
}

export function FollowUpsView() {
  const { items, loading, detecting, actionPending, error, detect, dismiss } = useFollowUps();

  return (
    <div className="flex h-full flex-col">
      <header className="flex min-h-[var(--topbar-height)] shrink-0 flex-wrap items-center justify-between gap-y-[var(--space-4)] border-b border-border bg-surface px-[var(--space-7)] py-[var(--space-4)] sm:px-[var(--space-9)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <h1 className="text-2xl font-black tracking-tight text-ink">Seguimientos</h1>
          <FollowUpCriteriaInfo />
        </div>
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
          <EmptyState
            icon={<ClockIcon className="size-6" />}
            title="Sin seguimientos pendientes"
            description='Prueba "Detectar seguimientos" para buscar contactos que necesiten que un asesor los retome.'
          />
        ) : (
          <div className="flex flex-col gap-[var(--space-5)]">
            {items.map(({ task, contact }) => (
              <div
                key={task.id}
                className="flex flex-wrap items-center gap-[var(--space-6)] rounded-xl border border-border bg-surface p-[var(--space-7)]"
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
