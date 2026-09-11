import type { ContactStats } from '@/features/contacts';

/**
 * Solo 3 de las 5 etapas reales (a pedido explícito del usuario, 2026-09-10) — Calificado y
 * Oportunidad quedan ocultas acá, aunque `ContactStats` las sigue trayendo. "Total" de abajo
 * suma solo estas 3, para que los porcentajes de cada barra cuadren con el número mostrado.
 *
 * Paleta categórica validada contra scripts/validate_palette.js del skill de dataviz (3 slots,
 * light mode, orden fijo abajo) — todas las pruebas en verde con este orden exacto. No reordenar
 * ni agregar una etapa más sin volver a correr el validador.
 */
const STAGES: { key: keyof ContactStats; label: string; color: string }[] = [
  { key: 'leads', label: 'Prospecto', color: 'var(--color-info)' },
  { key: 'customers', label: 'Ganado', color: 'var(--color-success)' },
  { key: 'followUp', label: 'En seguimiento', color: 'var(--color-danger)' },
];

export function LifecycleFunnelCard({ stats }: { stats: ContactStats | null }) {
  const values = STAGES.map((s) => stats?.[s.key] ?? 0);
  const max = Math.max(1, ...values);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className="text-sm font-bold text-ink">Distribución por etapa</h2>
        <p className="text-xs text-secondary">{total} contacto{total === 1 ? '' : 's'}</p>
      </div>
      <div className="mt-[var(--space-7)] flex flex-col gap-[var(--space-6)]">
        {STAGES.map((stage) => {
          const value = stats?.[stage.key] ?? 0;
          const widthPercent = stats ? Math.round((value / max) * 100) : 0;
          const sharePercent = stats && total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <div key={stage.key} title={`${stage.label}: ${value} (${sharePercent}%)`}>
              <div className="flex items-center justify-between gap-[var(--space-4)] text-xs">
                <span className="font-medium text-ink">{stage.label}</span>
                <span className="text-secondary">{stats ? value : '—'}</span>
              </div>
              <div className="mt-[var(--space-3)] h-[10px] w-full bg-app">
                {/* Cuadrado en la base (izquierda), redondeado 4px solo en la punta (derecha) — ver marks-and-anatomy.md */}
                <div
                  className="h-full rounded-r-[4px] transition-all"
                  style={{ width: `${widthPercent}%`, backgroundColor: stage.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
