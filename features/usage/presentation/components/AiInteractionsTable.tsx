'use client';

import { Fragment, useState } from 'react';
import {
  AI_OPERATION_TYPE_LABELS,
  LLM_CALL_KIND_LABELS,
  type AiInteraction,
  type AiInteractionDetail,
} from '@/features/usage';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';

/**
 * Historial de interacciones IA — cada fila es una ejecución real (conversación, "Probar
 * agente" o resumen de traspaso, ver AiOperationType) que ya restó del paquete. Una fila se
 * expande para reconstruir exactamente por qué costó lo que costó (punto 6 del pedido original
 * de medición de consumo): las llamadas al modelo y las herramientas invocadas.
 */
export function AiInteractionsTable({
  interactions,
  page,
  totalPages,
  onPageChange,
  onLoadDetail,
}: {
  interactions: AiInteraction[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLoadDetail: (id: string) => Promise<AiInteractionDetail>;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AiInteractionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  async function toggle(interaction: AiInteraction) {
    if (expandedId === interaction.id) {
      setExpandedId(null);
      setDetail(null);
      return;
    }
    setExpandedId(interaction.id);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      setDetail(await onLoadDetail(interaction.id));
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'No se pudo cargar el detalle');
    } finally {
      setDetailLoading(false);
    }
  }

  if (interactions.length === 0) {
    return <p className="text-sm text-secondary">Todavía no hay interacciones de IA registradas.</p>;
  }

  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-app text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Fecha</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Tipo</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Llamadas</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Tokens</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {interactions.map((interaction) => (
              <Fragment key={interaction.id}>
                <tr
                  onClick={() => toggle(interaction)}
                  className="cursor-pointer hover:bg-app"
                >
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">
                    {formatRelativeTime(interaction.startedAt)}
                  </td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">
                    {AI_OPERATION_TYPE_LABELS[interaction.operationType]}
                  </td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                    {interaction.llmCallsCount} LLM · {interaction.toolCallsCount} herramientas
                  </td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                    {interaction.totalTokens.toLocaleString('es-CO')}
                  </td>
                  <td className="px-[var(--space-6)] py-[var(--space-4)]">
                    <StatusBadge interaction={interaction} />
                  </td>
                </tr>
                {expandedId === interaction.id && (
                  <tr>
                    <td colSpan={5} className="bg-app px-[var(--space-6)] py-[var(--space-6)]">
                      {detailLoading && <p className="text-sm text-secondary">Cargando detalle...</p>}
                      {detailError && <p className="text-sm text-danger">{detailError}</p>}
                      {detail && <InteractionDetailPanel detail={detail} />}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-[var(--space-4)] text-sm">
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ interaction }: { interaction: AiInteraction }) {
  if (!interaction.billable) {
    return (
      <span className="rounded-full bg-app px-[var(--space-4)] py-[2px] text-[11px] font-semibold text-muted">
        Sin costo
      </span>
    );
  }
  if (interaction.overage) {
    return (
      <span className="rounded-full bg-warning-bg px-[var(--space-4)] py-[2px] text-[11px] font-semibold text-warning">
        Excedente
      </span>
    );
  }
  return (
    <span className="rounded-full bg-success-bg px-[var(--space-4)] py-[2px] text-[11px] font-semibold text-success">
      Incluida
    </span>
  );
}

function InteractionDetailPanel({ detail }: { detail: AiInteractionDetail }) {
  return (
    <div className="flex flex-col gap-[var(--space-5)]">
      <div>
        <p className="mb-[var(--space-3)] text-xs font-semibold uppercase tracking-wide text-muted">Llamadas al modelo</p>
        <ul className="flex flex-col gap-[var(--space-3)]">
          {detail.events.map((event, index) => (
            <li
              key={index}
              className="flex flex-wrap items-center justify-between gap-[var(--space-4)] rounded-md border border-border bg-surface px-[var(--space-5)] py-[var(--space-4)] text-xs"
            >
              <span className="font-semibold text-ink">{LLM_CALL_KIND_LABELS[event.operationType] ?? event.operationType}</span>
              <span className="text-secondary">
                {event.provider}/{event.model}
              </span>
              <span className="text-secondary">
                {event.inputTokens.toLocaleString('es-CO')} entrada + {event.outputTokens.toLocaleString('es-CO')} salida
                {event.cachedTokens > 0 ? ` + ${event.cachedTokens.toLocaleString('es-CO')} caché` : ''}
              </span>
            </li>
          ))}
        </ul>
      </div>
      {detail.toolCalls.length > 0 && (
        <div>
          <p className="mb-[var(--space-3)] text-xs font-semibold uppercase tracking-wide text-muted">Herramientas invocadas</p>
          <ul className="flex flex-col gap-[var(--space-3)]">
            {detail.toolCalls.map((toolCall, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-[var(--space-4)] rounded-md border border-border bg-surface px-[var(--space-5)] py-[var(--space-4)] text-xs"
              >
                <span className="font-semibold text-ink">{toolCall.toolName}</span>
                <span className={toolCall.status === 'SUCCESS' ? 'text-success' : 'text-danger'}>{toolCall.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
