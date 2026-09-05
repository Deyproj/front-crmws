'use client';

import { useUsageOverview } from '../hooks/useUsageOverview';
import { AiInteractionsTable } from './AiInteractionsTable';
import { PLAN_BILLING_CYCLE_LABELS, type CurrentUsage } from '@/features/usage';

/**
 * Panel de consumo de IA para la propia organización (punto 14 del pedido original: "el cliente
 * no necesita ver tokens como métrica comercial principal"). El costo en dólares nunca se muestra
 * acá — se deriva de precios de tokens que el admin de plataforma configura a mano (no se pueden
 * traer del proveedor), así que no es información que la organización cliente deba ver ni que
 * tenga sentido validar contra un precio de mercado; ver `AiUsageSection` en el panel de
 * plataforma para el detalle técnico completo (tokens, llamadas, costo real). Lo único monetario
 * que sí ve el dueño es el costo del excedente (interacciones adicionales × precio pactado), una
 * cifra comercial, no técnica.
 */
export function AiUsagePanel() {
  const { usage, interactions, page, totalPages, loading, error, goToPage, loadInteractionDetail } =
    useUsageOverview();

  if (loading && !usage) return <p className="text-sm text-secondary">Cargando...</p>;

  return (
    <div className="flex w-full flex-col gap-[var(--space-8)]">
      {error && (
        <p className="rounded-md border border-danger/30 bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
          {error}
        </p>
      )}

      {usage && <UsageProgressCard usage={usage} />}

      <div className="flex flex-col gap-[var(--space-5)]">
        <h2 className="text-sm font-semibold uppercase text-muted">Historial de interacciones</h2>
        <AiInteractionsTable
          interactions={interactions}
          page={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          onLoadDetail={loadInteractionDetail}
        />
      </div>
    </div>
  );
}

function UsageProgressCard({ usage }: { usage: CurrentUsage }) {
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
