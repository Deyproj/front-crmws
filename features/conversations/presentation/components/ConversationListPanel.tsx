'use client';

import { useMemo, useState } from 'react';
import type { ConversationListItem } from '../hooks/useConversationsList';
import { MODE_LABELS, STATUS_LABELS } from '@/features/conversations';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { initials } from '@/lib/utils/initials';
import { SearchIcon } from '@/components/ui/icons';

export function ConversationListPanel({
  items,
  selectedId,
  onSelect,
}: {
  items: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(({ contact }) => {
      const name = contact?.name?.toLowerCase() ?? '';
      const phone = contact?.phone?.toLowerCase() ?? '';
      return name.includes(q) || phone.includes(q);
    });
  }, [items, query]);

  return (
    <div className="flex h-full w-[320px] shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border p-[var(--space-7)]">
        <div className="flex items-center gap-[var(--space-4)] rounded-md bg-app p-[var(--space-4)]">
          <SearchIcon className="size-[14px] text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full bg-transparent text-xs text-ink placeholder-secondary focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-[var(--space-7)] text-sm text-secondary">Sin conversaciones.</p>
        )}
        {filtered.map(({ conversation, contact }) => {
          const active = conversation.id === selectedId;
          const label = contact?.name || contact?.phone || 'Contacto sin nombre';
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-center gap-[var(--space-6)] border-b border-border p-[var(--space-7)] text-left transition-colors ${
                active ? 'bg-success-bg' : 'bg-surface hover:bg-app'
              }`}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
                {initials(contact?.name, contact?.phone ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-[var(--space-4)]">
                  <p className="truncate text-sm font-semibold text-ink">{label}</p>
                  <p className="shrink-0 text-[11px] text-secondary">{formatRelativeTime(conversation.lastMessageAt)}</p>
                </div>
                <div className="mt-1 flex items-center justify-between gap-[var(--space-4)]">
                  <span className="truncate text-xs text-secondary">{contact?.phone}</span>
                  <span className="shrink-0 rounded-full bg-info-bg px-[var(--space-5)] py-[2px] text-[10px] font-semibold uppercase text-info">
                    {MODE_LABELS[conversation.mode]} · {STATUS_LABELS[conversation.status]}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
