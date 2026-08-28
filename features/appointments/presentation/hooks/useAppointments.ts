'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listAppointments,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
  recordAppointmentOutcome,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments';

export function useAppointments(contactId: string, refreshKey: number) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await listAppointments(contactId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las cortesías');
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load, refreshKey]);

  async function runAction(action: () => Promise<Appointment>) {
    setActionPending(true);
    setError(null);
    try {
      await action();
      await load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La acción no se pudo completar');
      return false;
    } finally {
      setActionPending(false);
    }
  }

  return {
    appointments,
    loading,
    actionPending,
    error,
    schedule: (scheduledAt: string, notes: string) => runAction(() => scheduleAppointment(contactId, scheduledAt, notes)),
    cancel: (appointmentId: string) => runAction(() => cancelAppointment(appointmentId)),
    reschedule: (appointmentId: string, newScheduledAt: string) =>
      runAction(() => rescheduleAppointment(appointmentId, newScheduledAt)),
    recordOutcome: (appointmentId: string, outcome: Extract<AppointmentStatus, 'COMPLETED' | 'NO_SHOW'>) =>
      runAction(() => recordAppointmentOutcome(appointmentId, outcome)),
  };
}
