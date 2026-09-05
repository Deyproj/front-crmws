'use client';

import { useState } from 'react';
import {
  PLAN_BILLING_CYCLES,
  PLAN_BILLING_CYCLE_LABELS,
  type OrganizationAiPlanPayload,
  type OrganizationAiUsage,
  type PlanBillingCycle,
} from '@/features/platform';

/**
 * Consumo de IA + edición del plan de una organización (BR-031, Paso 8) — exclusivo del admin
 * de plataforma, nunca el OWNER de la organización cliente. Vive dentro de `OrganizationRow`,
 * mismo patrón de sección expandible que "Ver equipo".
 */
export function AiUsageSection({
  usage,
  actionPending,
  onSavePlan,
}: {
  usage: OrganizationAiUsage | undefined;
  actionPending: boolean;
  onSavePlan: (payload: OrganizationAiPlanPayload) => Promise<unknown>;
}) {
  const [editing, setEditing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<PlanBillingCycle>(usage?.billingCycle ?? 'MONTHLY');
  const [includedInteractions, setIncludedInteractions] = useState(String(usage?.includedInteractions ?? 0));
  const [overageEnabled, setOverageEnabled] = useState(usage?.overageEnabled ?? true);
  const [overageUnitPrice, setOverageUnitPrice] = useState(
    usage?.overageUnitPrice !== null && usage?.overageUnitPrice !== undefined ? String(usage.overageUnitPrice) : ''
  );
  const [formError, setFormError] = useState<string | null>(null);

  function startEditing() {
    setBillingCycle(usage?.billingCycle ?? 'MONTHLY');
    setIncludedInteractions(String(usage?.includedInteractions ?? 0));
    setOverageEnabled(usage?.overageEnabled ?? true);
    setOverageUnitPrice(usage?.overageUnitPrice !== null && usage?.overageUnitPrice !== undefined ? String(usage.overageUnitPrice) : '');
    setFormError(null);
    setEditing(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsedIncluded = Number(includedInteractions);
    if (!Number.isFinite(parsedIncluded) || parsedIncluded < 0) {
      setFormError('Las interacciones incluidas deben ser un número mayor o igual a 0');
      return;
    }
    const parsedPrice = overageUnitPrice.trim() === '' ? null : Number(overageUnitPrice);
    if (parsedPrice !== null && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      setFormError('El precio del excedente debe ser un número mayor o igual a 0, o dejarse vacío');
      return;
    }
    try {
      await onSavePlan({
        billingCycle,
        includedInteractions: parsedIncluded,
        overageEnabled,
        overageUnitPrice: parsedPrice,
      });
      setEditing(false);
    } catch {
      // El error ya queda en el estado global del dashboard (usePlatformDashboard.error).
    }
  }

  if (editing) {
    return (
      <PlanForm
        billingCycle={billingCycle}
        includedInteractions={includedInteractions}
        overageEnabled={overageEnabled}
        overageUnitPrice={overageUnitPrice}
        actionPending={actionPending}
        formError={formError}
        onBillingCycleChange={setBillingCycle}
        onIncludedInteractionsChange={setIncludedInteractions}
        onOverageEnabledChange={setOverageEnabled}
        onOverageUnitPriceChange={setOverageUnitPrice}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(false)}
      />
    );
  }

  if (!usage || !usage.planConfigured) {
    return (
      <div className="flex flex-col gap-[var(--space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)] rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)]">
          <p className="text-xs text-secondary">Sin paquete de interacciones IA configurado — el consumo no está limitado.</p>
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-surface"
          >
            Configurar paquete
          </button>
        </div>
        {usage && <TechnicalDetailBlock usage={usage} />}
      </div>
    );
  }

  const overLimit = usage.usagePercentage > 100;

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <div className="flex flex-col gap-[var(--space-4)] rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
          <p className="text-xs font-semibold text-ink">
            {PLAN_BILLING_CYCLE_LABELS[usage.billingCycle as PlanBillingCycle]} · {usage.usedInteractions.toLocaleString('es-CO')} /{' '}
            {usage.includedInteractions.toLocaleString('es-CO')} interacciones ({usage.usagePercentage.toFixed(0)}%)
          </p>
          <button
            type="button"
            onClick={startEditing}
            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-surface"
          >
            Editar plan
          </button>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className={`h-full rounded-full ${overLimit ? 'bg-danger' : usage.usagePercentage >= 90 ? 'bg-warning' : 'bg-brand'}`}
            style={{ width: `${Math.min(100, usage.usagePercentage)}%` }}
          />
        </div>
        <p className="text-xs text-secondary">
          {usage.overageEnabled
            ? 'Excedente permitido — el agente sigue respondiendo automáticamente si se supera el paquete.'
            : 'Excedente desactivado — si se supera el paquete, las conversaciones nuevas se escalan directo a un asesor.'}
          {overLimit &&
            ` ${usage.overageInteractions.toLocaleString('es-CO')} interacciones adicionales${
              usage.overageAmount !== null ? ` · $${usage.overageAmount.toFixed(2)} estimado` : ''
            }.`}
        </p>
      </div>
      <TechnicalDetailBlock usage={usage} />
    </div>
  );
}

/**
 * Costo real en dólares y tokens — exclusivo de esta vista de administrador (a pedido explícito
 * del usuario, 2026-09-04: el precio de tokens lo configura el admin a mano, no se puede traer
 * del proveedor, así que no tiene sentido exponerlo como si fuera un dato verificable por la
 * organización cliente — ver AiUsagePanel, la vista del dueño, que nunca muestra esta cifra).
 */
function TechnicalDetailBlock({ usage }: { usage: OrganizationAiUsage }) {
  const cards = [
    { label: 'Llamadas al modelo', value: usage.llmCalls.toLocaleString('es-CO') },
    { label: 'Herramientas invocadas', value: usage.toolCalls.toLocaleString('es-CO') },
    { label: 'Tokens totales', value: usage.totalTokens.toLocaleString('es-CO') },
    { label: 'Costo real estimado', value: usage.estimatedCost !== null ? `$${usage.estimatedCost.toFixed(4)}` : '—' },
  ];

  return (
    <div className="grid grid-cols-2 gap-[var(--space-4)] sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)]">
          <p className="text-sm font-black text-ink">{card.value}</p>
          <p className="mt-1 text-[11px] text-secondary">{card.label}</p>
        </div>
      ))}
    </div>
  );
}

function PlanForm({
  billingCycle,
  includedInteractions,
  overageEnabled,
  overageUnitPrice,
  actionPending,
  formError,
  onBillingCycleChange,
  onIncludedInteractionsChange,
  onOverageEnabledChange,
  onOverageUnitPriceChange,
  onSubmit,
  onCancel,
}: {
  billingCycle: PlanBillingCycle;
  includedInteractions: string;
  overageEnabled: boolean;
  overageUnitPrice: string;
  actionPending: boolean;
  formError: string | null;
  onBillingCycleChange: (value: PlanBillingCycle) => void;
  onIncludedInteractionsChange: (value: string) => void;
  onOverageEnabledChange: (value: boolean) => void;
  onOverageUnitPriceChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  const inputClass =
    'w-full rounded-md border border-border bg-surface px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';

  return (
    <form
      onSubmit={onSubmit}
      className="grid grid-cols-1 gap-[var(--space-5)] rounded-md border border-border bg-app p-[var(--space-6)] sm:grid-cols-2"
    >
      {formError && <p className="text-xs text-danger sm:col-span-2">{formError}</p>}
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Ciclo de facturación
        <select
          value={billingCycle}
          onChange={(e) => onBillingCycleChange(e.target.value as PlanBillingCycle)}
          className={inputClass}
        >
          {PLAN_BILLING_CYCLES.map((cycle) => (
            <option key={cycle} value={cycle}>
              {PLAN_BILLING_CYCLE_LABELS[cycle]}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Interacciones incluidas
        <input
          type="number"
          min={0}
          value={includedInteractions}
          onChange={(e) => onIncludedInteractionsChange(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-[var(--space-2)] text-xs font-medium uppercase tracking-wide text-secondary">
        Precio del excedente (por interacción, opcional)
        <input
          type="number"
          min={0}
          step="0.01"
          value={overageUnitPrice}
          onChange={(e) => onOverageUnitPriceChange(e.target.value)}
          placeholder="Sin definir"
          className={inputClass}
        />
      </label>
      <label className="flex items-center gap-[var(--space-3)] self-end text-xs font-medium text-ink">
        <input
          type="checkbox"
          checked={overageEnabled}
          onChange={(e) => onOverageEnabledChange(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Permitir excedente (recomendado — nunca bloquea automáticamente)
      </label>
      <div className="flex gap-[var(--space-4)] sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={actionPending}
          className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-surface disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={actionPending}
          className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar plan
        </button>
      </div>
    </form>
  );
}
