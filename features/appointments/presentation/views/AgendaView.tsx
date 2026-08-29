'use client';

import { useAgenda } from '../hooks/useAgenda';
import { STATUS_LABELS, type Appointment } from '@/features/appointments';
import { initials } from '@/lib/utils/initials';

const STATUS_BADGE_CLASS: Record<Appointment['status'], string> = {
  CONFIRMED: 'bg-info-bg text-info',
  CANCELLED: 'bg-danger-bg text-danger',
  COMPLETED: 'bg-success-bg text-success',
  NO_SHOW: 'bg-warning-bg text-warning',
};

function formatDayLabel(date: Date): string {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const label = date.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'long' });
  return isToday ? `Hoy · ${label}` : label;
}

export function AgendaView() {
  const { selectedDate, goToday, goPreviousDay, goNextDay, items, loading, actionPending, error, cancel, recordOutcome } =
    useAgenda();

  return (
    <div className="flex h-full flex-col">
      <header className="flex min-h-[var(--topbar-height)] shrink-0 flex-wrap items-center justify-between gap-y-[var(--space-4)] border-b border-border bg-surface px-[var(--space-7)] py-[var(--space-4)] sm:px-[var(--space-9)]">
        <h1 className="text-xl font-bold text-ink">Agenda</h1>
        <div className="flex items-center gap-[var(--space-4)]">
          <button
            type="button"
            onClick={goPreviousDay}
            className="rounded-md border border-border px-[var(--space-4)] py-[var(--space-3)] text-sm font-semibold text-ink hover:bg-app"
          >
            ←
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-sm font-semibold text-ink hover:bg-app"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={goNextDay}
            className="rounded-md border border-border px-[var(--space-4)] py-[var(--space-3)] text-sm font-semibold text-ink hover:bg-app"
          >
            →
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        <p className="mb-[var(--space-7)] text-sm font-semibold capitalize text-secondary">{formatDayLabel(selectedDate)}</p>

        {error && (
          <p className="mb-[var(--space-6)] rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-secondary">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-secondary">Sin cortesías agendadas para este día.</p>
        ) : (
          <div className="flex flex-col gap-[var(--space-5)]">
            {items.map(({ appointment, contact }) => (
              <div
                key={appointment.id}
                className="flex flex-wrap items-center gap-[var(--space-6)] rounded-lg border border-border bg-surface p-[var(--space-7)]"
              >
                <p className="shrink-0 whitespace-nowrap text-sm font-semibold text-ink">
                  {new Date(appointment.scheduledAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
                  {initials(contact?.name, contact?.phone ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {contact?.name || contact?.phone || 'Contacto sin nombre'}
                  </p>
                  {appointment.notes && <p className="truncate text-xs text-secondary">{appointment.notes}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-full px-[var(--space-4)] py-[2px] text-[10px] font-semibold uppercase ${STATUS_BADGE_CLASS[appointment.status]}`}
                >
                  {STATUS_LABELS[appointment.status]}
                </span>
                {appointment.status === 'CONFIRMED' && (
                  <div className="flex shrink-0 gap-[var(--space-3)]">
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => recordOutcome(appointment.id, 'COMPLETED')}
                      className="rounded-md border border-border px-[var(--space-4)] py-1 text-[11px] font-semibold text-ink hover:bg-app disabled:opacity-50"
                    >
                      Asistió
                    </button>
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => recordOutcome(appointment.id, 'NO_SHOW')}
                      className="rounded-md border border-border px-[var(--space-4)] py-1 text-[11px] font-semibold text-ink hover:bg-app disabled:opacity-50"
                    >
                      No asistió
                    </button>
                    <button
                      type="button"
                      disabled={actionPending}
                      onClick={() => cancel(appointment.id)}
                      className="rounded-md px-[var(--space-4)] py-1 text-[11px] font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
