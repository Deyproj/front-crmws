'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  listAppointmentsByRange,
  cancelAppointment,
  recordAppointmentOutcome,
  type Appointment,
  type AppointmentStatus,
} from '@/features/appointments';
import { listContacts, type Contact } from '@/features/contacts';

export interface AgendaItem {
  appointment: Appointment;
  contact: Contact | null;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);
}

/** Agenda del día seleccionado — un solo asesor a la vez consulta "¿qué cortesías hay hoy?". */
export function useAgenda() {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [items, setItems] = useState<AgendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => {
    const from = selectedDate;
    const to = addDays(selectedDate, 1);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [selectedDate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [appointments, contacts] = await Promise.all([
        listAppointmentsByRange(range.from, range.to),
        listContacts(),
      ]);
      const contactsById = new Map(contacts.map((c) => [c.id, c]));
      setItems(appointments.map((appointment) => ({ appointment, contact: contactsById.get(appointment.contactId) ?? null })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la agenda');
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

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
    selectedDate,
    goToday: () => setSelectedDate(startOfDay(new Date())),
    goPreviousDay: () => setSelectedDate((d) => addDays(d, -1)),
    goNextDay: () => setSelectedDate((d) => addDays(d, 1)),
    items,
    loading,
    actionPending,
    error,
    cancel: (appointmentId: string) => runAction(() => cancelAppointment(appointmentId)),
    recordOutcome: (appointmentId: string, outcome: Extract<AppointmentStatus, 'COMPLETED' | 'NO_SHOW'>) =>
      runAction(() => recordAppointmentOutcome(appointmentId, outcome)),
  };
}
