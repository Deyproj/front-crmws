export const WEEK_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
export type WeekDay = (typeof WEEK_DAYS)[number];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export interface DaySchedule {
  enabled: boolean;
  start: string;
  end: string;
}

export type WeeklySchedule = Record<WeekDay, DaySchedule>;

const DEFAULT_START = '06:00';
const DEFAULT_END = '21:00';

export function emptyWeeklySchedule(): WeeklySchedule {
  return WEEK_DAYS.reduce((schedule, day) => {
    schedule[day] = { enabled: false, start: DEFAULT_START, end: DEFAULT_END };
    return schedule;
  }, {} as WeeklySchedule);
}

/**
 * Refleja el formato de persistencia de `AgentConfig.humanHoursSchedule`
 * (api-crmws, `HumanHoursSchedule.parse`): pares `DIA=HH:mm-HH:mm` separados
 * por comas, un día por entrada. Entradas malformadas se ignoran — la
 * validación real ocurre en el backend al guardar.
 */
export function parseHumanHoursSchedule(raw: string | null | undefined): WeeklySchedule {
  const schedule = emptyWeeklySchedule();
  if (!raw) return schedule;
  for (const entry of raw.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const [day, range] = trimmed.split('=');
    const [start, end] = (range ?? '').split('-');
    if (isWeekDay(day) && start && end) {
      schedule[day] = { enabled: true, start: start.trim(), end: end.trim() };
    }
  }
  return schedule;
}

export function serializeHumanHoursSchedule(schedule: WeeklySchedule): string {
  return WEEK_DAYS.filter((day) => schedule[day].enabled)
    .map((day) => `${day}=${schedule[day].start}-${schedule[day].end}`)
    .join(',');
}

function isWeekDay(value: string | undefined): value is WeekDay {
  return WEEK_DAYS.includes(value as WeekDay);
}
