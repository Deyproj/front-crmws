'use client';

import { PLAN_BILLING_CYCLE_LABELS, type CurrentUsage } from '@/features/usage';

/**
 * Barra de progreso de consumo de IA — extraída de `AiUsagePanel` (Reportes → Consumo IA) para
 * reusarla también como tarjeta compacta en el Dashboard. El costo en dólares nunca se muestra
 * acá (ver javadoc de `AiUsagePanel`); lo único monetario es el costo del excedente ya pactado.
 */
export function UsageProgressCard({ usage }: { usage: CurrentUsage }) {
  const periodLabel = usage.billingCycle ? PLAN_BILLING_CYCLE_LABELS[usage.billingCycle] : 'mes calendario';
  const periodRange = `${formatDate(usage.periodStart)} – ${formatDate(usage.periodEnd)}`;

  if (!usage.planConfigured) {
    return (
      <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
        <p className="text-sm font-semibold text-ink">Consumo de IA — {periodRange}</p>
        <p className="mt-[var(--space-3)] text-xs text-secondary">
          Todavía no tienes un paquete de interacciones asignado — se muestra tu consumo real, sin límite.
        </p>
        <p className="mt-[var(--space-6)] text-3xl font-black text-ink">
          {usage.usedInteractions.toLocaleString('es-CO')} <span className="text-base font-medium text-secondary">interacciones</span>
        </p>
      </div>
    );
  }

  const percentage = Math.min(100, usage.usagePercentage);
  const overLimit = usage.usagePercentage > 100;

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
        <p className="text-sm font-semibold text-ink">Consumo de IA — {periodLabel}</p>
        <p className="text-xs text-secondary">{periodRange}</p>
      </div>

      <div className="mt-[var(--space-6)] h-3 w-full overflow-hidden rounded-full bg-app">
        <div
          className={`h-full rounded-full transition-all ${overLimit ? 'bg-danger' : percentage >= 90 ? 'bg-warning' : 'bg-brand'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-[var(--space-5)] flex flex-wrap items-baseline gap-x-[var(--space-4)] gap-y-[var(--space-2)]">
        <p className="text-2xl font-black text-ink">
          {usage.usedInteractions.toLocaleString('es-CO')} / {usage.includedInteractions.toLocaleString('es-CO')}
        </p>
        <p className="text-sm text-secondary">interacciones ({usage.usagePercentage.toFixed(0)}%)</p>
      </div>

      {overLimit ? (
        <p className="mt-[var(--space-4)] text-sm text-warning">
          {usage.overageInteractions.toLocaleString('es-CO')} interacciones adicionales
          {usage.overageAmount !== null && ` · costo adicional estimado $${usage.overageAmount.toFixed(2)}`}
        </p>
      ) : (
        <p className="mt-[var(--space-4)] text-sm text-secondary">
          {usage.remainingInteractions.toLocaleString('es-CO')} interacciones disponibles
        </p>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}
