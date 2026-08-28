'use client';

import { useState } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import { STATUS_LABELS, type Appointment } from '@/features/appointments';

const STATUS_BADGE_CLASS: Record<Appointment['status'], string> = {
  CONFIRMED: 'bg-info-bg text-info',
  CANCELLED: 'bg-danger-bg text-danger',
  COMPLETED: 'bg-success-bg text-success',
  NO_SHOW: 'bg-warning-bg text-warning',
};

export function AppointmentsSection({ contactId, refreshKey }: { contactId: string; refreshKey: number }) {
  const { appointments, loading, actionPending, error, schedule, cancel, recordOutcome } = useAppointments(
    contactId,
    refreshKey
  );
  const [scheduling, setScheduling] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!datetime) return;
    const ok = await schedule(new Date(datetime).toISOString(), notes);
    if (ok) {
      setDatetime('');
      setNotes('');
      setScheduling(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      {loading ? (
        <p className="text-xs text-secondary">Cargando...</p>
      ) : (
        <>
          {appointments.length === 0 && <p className="text-xs text-secondary">Sin cortesías agendadas todavía.</p>}
          {appointments.map((appointment) => (
            <div key={appointment.id} className="flex flex-col gap-[var(--space-3)] rounded-md bg-app p-[var(--space-5)]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-ink">
                  {new Date(appointment.scheduledAt).toLocaleString('es-CO', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <span
                  className={`rounded-full px-[var(--space-4)] py-[2px] text-[10px] font-semibold uppercase ${STATUS_BADGE_CLASS[appointment.status]}`}
                >
                  {STATUS_LABELS[appointment.status]}
                </span>
              </div>
              {appointment.notes && <p className="text-xs text-secondary">{appointment.notes}</p>}
              {appointment.status === 'CONFIRMED' && (
                <div className="flex flex-wrap gap-[var(--space-3)]">
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => recordOutcome(appointment.id, 'COMPLETED')}
                    className="rounded-md border border-border px-[var(--space-4)] py-1 text-[11px] font-semibold text-ink hover:bg-surface disabled:opacity-50"
                  >
                    Asistió
                  </button>
                  <button
                    type="button"
                    disabled={actionPending}
                    onClick={() => recordOutcome(appointment.id, 'NO_SHOW')}
                    className="rounded-md border border-border px-[var(--space-4)] py-1 text-[11px] font-semibold text-ink hover:bg-surface disabled:opacity-50"
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
        </>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}

      {scheduling ? (
        <form onSubmit={handleSchedule} className="flex flex-col gap-[var(--space-4)] rounded-md border border-border p-[var(--space-5)]">
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-3)] text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas (opcional)"
            className="w-full rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-3)] text-xs text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <div className="flex gap-[var(--space-3)]">
            <button
              type="submit"
              disabled={actionPending || !datetime}
              className="rounded-md bg-brand px-[var(--space-5)] py-[var(--space-3)] text-[11px] font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setScheduling(false)}
              className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-[11px] font-semibold text-ink hover:bg-app"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setScheduling(true)}
          className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
        >
          Agendar cortesía
        </button>
      )}
    </div>
  );
}
