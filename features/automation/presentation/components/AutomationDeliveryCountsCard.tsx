'use client';

import { useCallback, useEffect, useState } from 'react';
import { DateRangePresetPicker, useDateRangePreset } from '@/components/ui/DateRangePresetPicker';
import { AUTOMATION_KINDS, AUTOMATION_KIND_LABELS, getAutomationDeliveryCounts, type AutomationDeliveryCounts } from '@/features/automation';

/** Tarjeta del Dashboard: cantidad de mensajes automáticos entregados, desglosada por tipo, en el rango elegido. */
export function AutomationDeliveryCountsCard() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } = useDateRangePreset('thisMonth');
  const [counts, setCounts] = useState<AutomationDeliveryCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from: string, to: string) => {
    setLoading(true);
    try {
      setCounts(await getAutomationDeliveryCounts({ from, to }));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las automatizaciones entregadas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(range.from, range.to);
  }, [load, range.from, range.to]);

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
        <p className="text-sm font-semibold text-ink">Automatizaciones entregadas</p>
        <DateRangePresetPicker
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          onCustomFromChange={setCustomFrom}
          customTo={customTo}
          onCustomToChange={setCustomTo}
        />
      </div>

      {error && <p className="mt-[var(--space-4)] text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="mt-[var(--space-6)] text-sm text-secondary">Cargando...</p>
      ) : (
        <div className="mt-[var(--space-6)] grid grid-cols-2 gap-[var(--space-5)] sm:grid-cols-4">
          {AUTOMATION_KINDS.map((kind) => (
            <div key={kind} className="rounded-lg bg-app px-[var(--space-5)] py-[var(--space-5)]">
              <p className="text-2xl font-black text-ink">{(counts?.[kind] ?? 0).toLocaleString('es-CO')}</p>
              <p className="mt-[var(--space-2)] text-xs text-secondary">{AUTOMATION_KIND_LABELS[kind]}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
