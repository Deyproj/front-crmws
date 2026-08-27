'use client';

import { useState } from 'react';
import type { Contact } from '@/features/contacts';
import { LIFECYCLE_STAGE_LABELS } from '@/features/contacts';
import { initials } from '@/lib/utils/initials';
import { StageActions } from '@/features/opportunities/presentation/components/StageActions';
import { OpportunityHistory } from '@/features/opportunities/presentation/components/OpportunityHistory';

export function ContactPanel({
  contact,
  onContactChanged,
}: {
  contact: Contact | null;
  onContactChanged: (contact: Contact) => void;
}) {
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  if (!contact) {
    return <aside className="hidden w-[280px] shrink-0 border-l border-border bg-surface lg:block" />;
  }

  function handleStageChanged(updated: Contact) {
    onContactChanged(updated);
    setHistoryRefreshKey((k) => k + 1);
  }

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-[var(--space-9)] overflow-y-auto border-l border-border bg-surface p-[var(--space-8)] lg:flex">
      <div className="flex flex-col items-center gap-[var(--space-6)] text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-on-brand">
          {initials(contact.name, contact.phone)}
        </div>
        <p className="text-base font-bold text-ink">{contact.name || contact.phone}</p>
        <span className="rounded-full bg-info-bg px-[var(--space-5)] py-1 text-xs font-semibold uppercase text-info">
          {LIFECYCLE_STAGE_LABELS[contact.lifecycleStage]}
        </span>
      </div>

      <div className="flex flex-col gap-[var(--space-6)]">
        <p className="text-xs font-semibold uppercase text-muted">Detalle del contacto</p>
        <Field label="Teléfono" value={contact.phone} />
        {contact.email && <Field label="Correo" value={contact.email} />}
        <Field
          label="Último contacto"
          value={new Date(contact.lastInteractionAt).toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        />
      </div>

      <div className="flex flex-col gap-[var(--space-6)]">
        <p className="text-xs font-semibold uppercase text-muted">Etapa comercial</p>
        <StageActions contact={contact} onChanged={handleStageChanged} />
      </div>

      <div className="flex flex-col gap-[var(--space-6)]">
        <p className="text-xs font-semibold uppercase text-muted">Historial de oportunidades</p>
        <OpportunityHistory contactId={contact.id} refreshKey={historyRefreshKey} />
      </div>
    </aside>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="text-[11px] text-secondary">{label}</p>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
