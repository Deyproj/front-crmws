import { apiFetch } from '@/lib/http/apiFetch';

export const APPOINTMENT_STATUSES = ['CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Asistió',
  NO_SHOW: 'No asistió',
};

/** Refleja AppointmentResponse (api-crmws, schedule/presentation/AppointmentResponse.java). */
export interface Appointment {
  id: string;
  contactId: string;
  opportunityId: string | null;
  type: 'COURTESY';
  status: AppointmentStatus;
  scheduledAt: string;
  notes: string | null;
}

export async function listAppointments(contactId: string): Promise<Appointment[]> {
  return apiFetch<Appointment[]>(`/api/contacts/${contactId}/appointments`);
}

export async function scheduleAppointment(contactId: string, scheduledAt: string, notes: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/contacts/${contactId}/appointments`, {
    method: 'POST',
    body: JSON.stringify({ scheduledAt, notes: notes || null }),
  });
}

export async function cancelAppointment(appointmentId: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${appointmentId}/cancel`, { method: 'POST' });
}

export async function rescheduleAppointment(appointmentId: string, newScheduledAt: string): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${appointmentId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ newScheduledAt }),
  });
}

export async function recordAppointmentOutcome(
  appointmentId: string,
  outcome: Extract<AppointmentStatus, 'COMPLETED' | 'NO_SHOW'>
): Promise<Appointment> {
  return apiFetch<Appointment>(`/api/appointments/${appointmentId}/outcome`, {
    method: 'POST',
    body: JSON.stringify({ outcome }),
  });
}
