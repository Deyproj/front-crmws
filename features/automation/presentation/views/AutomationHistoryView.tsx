'use client';

import { DateRangePresetPicker, useDateRangePreset } from '@/components/ui/DateRangePresetPicker';
import { AUTOMATION_KINDS, AUTOMATION_KIND_LABELS, type AutomationKind } from '@/features/automation';
import { useAutomationHistory } from '../hooks/useAutomationHistory';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

/**
 * Historial paginado de las 4 automatizaciones de mensajería (recordatorio de cortesía, mensaje
 * de seguimiento, encuesta de satisfacción y vencimiento de plan de GymSoft) — cada fila es un
 * envío realmente entregado (ver AutomationDelivery en api-crmws), no un intento omitido.
 */
export function AutomationHistoryView({ initialKind = null }: { initialKind?: AutomationKind | null }) {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } = useDateRangePreset('thisMonth');
  const { deliveries, page, totalPages, loading, error, kind, setKind, goToPage } = useAutomationHistory(range, initialKind);

  return (
    <div className="flex w-full flex-col gap-[var(--space-5)] rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
        <p className="text-sm font-semibold text-ink">Envíos automáticos entregados</p>
        <div className="flex flex-wrap items-center gap-[var(--space-4)]">
          <select
            value={kind ?? ''}
            onChange={(e) => setKind((e.target.value || null) as AutomationKind | null)}
            aria-label="Tipo de automatización"
            className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs font-semibold text-ink focus:outline-none"
          >
            <option value="">Todas</option>
            {AUTOMATION_KINDS.map((k) => (
              <option key={k} value={k}>
                {AUTOMATION_KIND_LABELS[k]}
              </option>
            ))}
          </select>
          <DateRangePresetPicker
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            onCustomFromChange={setCustomFrom}
            customTo={customTo}
            onCustomToChange={setCustomTo}
          />
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-secondary">Cargando...</p>
      ) : deliveries.length === 0 ? (
        <p className="text-sm text-secondary">No hay envíos automáticos en este rango.</p>
      ) : (
        <div className="flex flex-col gap-[var(--space-5)]">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-app text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-[var(--space-6)] py-[var(--space-4)]">Fecha</th>
                  <th className="px-[var(--space-6)] py-[var(--space-4)]">Automatización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">{formatRelativeTime(delivery.sentAt)}</td>
                    <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">{AUTOMATION_KIND_LABELS[delivery.kind]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-[var(--space-4)] text-sm">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => goToPage(page - 1)}
                className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-secondary">
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => goToPage(page + 1)}
                className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
