export type { Appointment, AppointmentStatus, AppointmentStats } from './api';
export {
  listAppointments,
  listAppointmentsByRange,
  scheduleAppointment,
  cancelAppointment,
  rescheduleAppointment,
  recordAppointmentOutcome,
  getAppointmentStats,
  APPOINTMENT_STATUSES,
  STATUS_LABELS,
} from './api';
