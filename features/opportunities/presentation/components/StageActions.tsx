'use client';

import { useState } from 'react';
import type { Contact, ContactLifecycleStage } from '@/features/contacts';
import { FOLLOW_UP_REASONS } from '@/features/contacts';
import { nextStages, useChangeStage } from '../hooks/useChangeStage';
import { STAGE_LABELS } from '@/features/opportunities';

const STAGE_ACTION_LABELS: Record<Exclude<ContactLifecycleStage, 'LEAD'>, string> = {
  QUALIFIED: 'Calificar',
  OPPORTUNITY: 'Marcar como oportunidad',
  CUSTOMER: 'Marcar como ganado',
  FOLLOW_UP: 'Pasar a seguimiento',
};

export function StageActions({ contact, onChanged }: { contact: Contact; onChanged: (contact: Contact) => void }) {
  const { changeStage, pending, error } = useChangeStage(onChanged);
  const [pickingFollowUpReason, setPickingFollowUpReason] = useState(false);
  const [followUpReason, setFollowUpReason] = useState('');

  const options = nextStages(contact.lifecycleStage);
  const isReingreso = contact.lifecycleStage === 'CUSTOMER' || contact.lifecycleStage === 'FOLLOW_UP';

  if (pickingFollowUpReason) {
    return (
      <div className="flex flex-col gap-[var(--space-5)]">
        <select
          value={followUpReason}
          onChange={(e) => setFollowUpReason(e.target.value)}
          className="rounded-md border border-border bg-app px-3 py-2 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-brand"
        >
          <option value="">Selecciona un motivo...</option>
          {FOLLOW_UP_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex gap-[var(--space-4)]">
          <button
            type="button"
            disabled={pending || !followUpReason}
            onClick={async () => {
              await changeStage(contact.id, 'FOLLOW_UP', followUpReason);
              setPickingFollowUpReason(false);
              setFollowUpReason('');
            }}
            className="flex-1 rounded-md bg-danger px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setPickingFollowUpReason(false)}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-ink hover:bg-app"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      {isReingreso && <p className="text-[11px] text-muted">Volver a calificar abre un nuevo ciclo comercial.</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex flex-wrap gap-[var(--space-4)]">
        {options.map((stage) => (
          <button
            key={stage}
            type="button"
            disabled={pending}
            onClick={() => (stage === 'FOLLOW_UP' ? setPickingFollowUpReason(true) : changeStage(contact.id, stage))}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
              stage === 'FOLLOW_UP'
                ? 'border border-danger/30 text-danger hover:bg-danger-bg'
                : stage === 'CUSTOMER'
                  ? 'bg-brand text-on-brand hover:bg-brand-hover'
                  : 'border border-border text-ink hover:bg-app'
            }`}
          >
            {isReingreso ? `Reingreso: ${STAGE_LABELS[stage].toLowerCase()}` : STAGE_ACTION_LABELS[stage]}
          </button>
        ))}
      </div>
    </div>
  );
}
