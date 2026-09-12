'use client';

import { useState } from 'react';

/**
 * Rango de fecha por presets (hoy/ayer/esta semana/semana pasada/mes en curso/mes anterior/año/
 * personalizado) — calculado en hora local del navegador, en formato ISO compatible con
 * `GET /api/appointments?from=&to=` y los endpoints nuevos de historial de automatizaciones.
 * Semana calendario: lunes a domingo.
 */
export const DATE_RANGE_PRESETS = [
  'today',
  'yesterday',
  'thisWeek',
  'lastWeek',
  'thisMonth',
  'lastMonth',
  'thisYear',
  'custom',
] as const;
export type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number];

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  thisWeek: 'Esta semana',
  lastWeek: 'Semana pasada',
  thisMonth: 'Mes en curso',
  lastMonth: 'Mes anterior',
  thisYear: 'Año',
  custom: 'Personalizado',
};

export interface DateRange {
  from: string;
  to: string;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/** Lunes de la semana calendario de `date`. */
function startOfWeek(date: Date): Date {
  const result = startOfDay(date);
  const day = result.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  return result;
}

function rangeForPreset(preset: DateRangePreset, custom: { from: string; to: string }): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: startOfDay(yesterday).toISOString(), to: endOfDay(yesterday).toISOString() };
    }
    case 'thisWeek':
      return { from: startOfWeek(now).toISOString(), to: endOfDay(now).toISOString() };
    case 'lastWeek': {
      const startThisWeek = startOfWeek(now);
      const start = new Date(startThisWeek);
      start.setDate(start.getDate() - 7);
      const end = new Date(startThisWeek);
      end.setDate(end.getDate() - 1);
      return { from: startOfDay(start).toISOString(), to: endOfDay(end).toISOString() };
    }
    case 'thisMonth':
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: endOfDay(now).toISOString() };
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start.toISOString(), to: endOfDay(end).toISOString() };
    }
    case 'thisYear':
      return { from: new Date(now.getFullYear(), 0, 1).toISOString(), to: endOfDay(now).toISOString() };
    case 'custom': {
      if (!custom.from || !custom.to) {
        return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
      }
      return { from: startOfDay(new Date(custom.from)).toISOString(), to: endOfDay(new Date(custom.to)).toISOString() };
    }
  }
}

/** Estado + cálculo del rango — separado del componente visual para poder reusar el rango en varias tarjetas a la vez. */
export function useDateRangePreset(initial: DateRangePreset = 'thisMonth') {
  const [preset, setPreset] = useState<DateRangePreset>(initial);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const range = rangeForPreset(preset, { from: customFrom, to: customTo });

  return { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range };
}

export function DateRangePresetPicker({
  preset,
  onPresetChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
}: {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[var(--space-4)]">
      <select
        value={preset}
        onChange={(e) => onPresetChange(e.target.value as DateRangePreset)}
        aria-label="Rango de fechas"
        className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs font-semibold text-ink focus:outline-none"
      >
        {DATE_RANGE_PRESETS.map((p) => (
          <option key={p} value={p}>
            {PRESET_LABELS[p]}
          </option>
        ))}
      </select>
      {preset === 'custom' && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            aria-label="Desde"
            className="rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-3)] text-xs text-ink focus:outline-none"
          />
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            aria-label="Hasta"
            className="rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-3)] text-xs text-ink focus:outline-none"
          />
        </>
      )}
    </div>
  );
}
