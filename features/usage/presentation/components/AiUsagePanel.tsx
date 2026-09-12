'use client';

import { useUsageOverview } from '../hooks/useUsageOverview';
import { AiInteractionsTable } from './AiInteractionsTable';
import { UsageProgressCard } from './UsageProgressCard';

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
