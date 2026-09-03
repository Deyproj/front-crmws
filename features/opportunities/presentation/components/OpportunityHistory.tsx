'use client';

import { useOpportunityHistory } from '../hooks/useOpportunityHistory';
import { STAGE_LABELS } from '@/features/opportunities';

export function OpportunityHistory({ contactId, refreshKey }: { contactId: string; refreshKey?: number }) {
  const { opportunities, loading } = useOpportunityHistory(contactId, refreshKey);

  if (loading) return <p className="text-xs text-secondary">Cargando historial...</p>;
  if (opportunities.length === 0) return <p className="text-xs text-secondary">Sin oportunidades todavía.</p>;

  return (
    <ul className="flex flex-col gap-[var(--space-4)]">
      {opportunities.map((opportunity) => (
        <li key={opportunity.id} className="rounded-md bg-app p-[var(--space-5)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink">{STAGE_LABELS[opportunity.stage]}</span>
            <span className="text-[10px] text-secondary">
              {new Date(opportunity.openedAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          {opportunity.followUpReason && <p className="mt-1 text-[11px] text-secondary">Motivo: {opportunity.followUpReason}</p>}
        </li>
      ))}
    </ul>
  );
}
