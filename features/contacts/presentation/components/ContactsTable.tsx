'use client';

import { useMemo, useState } from 'react';
import {
  type Contact,
  type ContactLifecycleStage,
  CONTACT_LIFECYCLE_STAGES,
  LIFECYCLE_STAGE_LABELS,
} from '@/features/contacts';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { initials } from '@/lib/utils/initials';
import { SearchIcon, MessageSquareIcon } from '@/components/ui/icons';

export function ContactsTable({
  contacts,
  onOpenChat,
}: {
  contacts: Contact[];
  /** Botón "Chat" por fila — abre (o reabre) la conversación de ese contacto. */
  onOpenChat: (contact: Contact) => void;
}) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<ContactLifecycleStage | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (stage !== 'ALL' && contact.lifecycleStage !== stage) return false;
      if (!q) return true;
      const name = contact.name?.toLowerCase() ?? '';
      const phone = contact.phone?.toLowerCase() ?? '';
      return name.includes(q) || phone.includes(q);
    });
  }, [contacts, query, stage]);

  return (
    <div className="flex flex-col gap-[var(--space-6)]">
      <div className="flex flex-wrap items-center gap-[var(--space-5)]">
        <div className="flex min-w-[220px] flex-1 items-center gap-[var(--space-4)] rounded-md border border-border bg-surface p-[var(--space-4)]">
          <SearchIcon className="size-[14px] text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o teléfono..."
            className="w-full bg-transparent text-sm text-ink placeholder-secondary focus:outline-none"
          />
        </div>
        <StageFilter stage={stage} onChange={setStage} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase text-secondary">
              <th className="px-[var(--space-7)] py-[var(--space-5)]">Contacto</th>
              <th className="px-[var(--space-7)] py-[var(--space-5)]">Teléfono</th>
              <th className="px-[var(--space-7)] py-[var(--space-5)]">Etapa</th>
              <th className="px-[var(--space-7)] py-[var(--space-5)]">Último contacto</th>
              <th className="px-[var(--space-7)] py-[var(--space-5)]" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-[var(--space-7)] py-[var(--space-8)] text-center text-secondary">
                  Sin clientes que coincidan.
                </td>
              </tr>
            )}
            {filtered.map((contact) => (
              <tr key={contact.id} className="border-b border-border last:border-0">
                <td className="px-[var(--space-7)] py-[var(--space-5)]">
                  <div className="flex items-center gap-[var(--space-5)]">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-on-brand">
                      {initials(contact.name, contact.phone)}
                    </div>
                    <span className="font-semibold text-ink">{contact.name || 'Contacto sin nombre'}</span>
                  </div>
                </td>
                <td className="px-[var(--space-7)] py-[var(--space-5)] text-secondary">{contact.phone}</td>
                <td className="px-[var(--space-7)] py-[var(--space-5)]">
                  <span className="rounded-full bg-info-bg px-[var(--space-5)] py-1 text-xs font-semibold uppercase text-info">
                    {LIFECYCLE_STAGE_LABELS[contact.lifecycleStage]}
                  </span>
                </td>
                <td className="px-[var(--space-7)] py-[var(--space-5)] text-secondary">
                  {formatRelativeTime(contact.lastInteractionAt)}
                </td>
                <td className="px-[var(--space-7)] py-[var(--space-5)] text-right">
                  {/* Un contacto identificado solo por LID de WhatsApp (sin teléfono, `Contact.createWithoutPhone`
                      en el backend) no se puede resolver por `startConversation(phone)` — el botón se
                      deshabilita en vez de fallar con "phone: must not be blank" al hacer clic. */}
                  <button
                    type="button"
                    disabled={!contact.phone}
                    onClick={() => onOpenChat(contact)}
                    title={
                      contact.phone
                        ? `Abrir chat con ${contact.name || contact.phone}`
                        : 'Este contacto no tiene teléfono registrado (solo identificado por WhatsApp)'
                    }
                    aria-label={`Abrir chat con ${contact.name || contact.phone || 'este contacto'}`}
                    className="inline-flex items-center gap-[var(--space-3)] rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    <MessageSquareIcon className="size-[14px]" />
                    Chat
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StageFilter({
  stage,
  onChange,
}: {
  stage: ContactLifecycleStage | 'ALL';
  onChange: (stage: ContactLifecycleStage | 'ALL') => void;
}) {
  return (
    <select
      value={stage}
      onChange={(e) => onChange(e.target.value as ContactLifecycleStage | 'ALL')}
      className="rounded-md border border-border bg-surface px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <option value="ALL">Todas las etapas</option>
      {CONTACT_LIFECYCLE_STAGES.map((s) => (
        <option key={s} value={s}>
          {LIFECYCLE_STAGE_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
