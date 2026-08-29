'use client';

import { useMemo, useState } from 'react';
import type { ConversationListItem } from '../hooks/useConversationsList';
import { useWaitingConversationsCount } from '../hooks/useWaitingConversationsCount';
import { MODE_LABELS, STATUS_LABELS } from '@/features/conversations';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { initials } from '@/lib/utils/initials';
import { SearchIcon } from '@/components/ui/icons';

export type QuickFilter = 'ALL' | 'MINE' | 'WAITING' | 'AI';

const QUICK_FILTERS: { value: QuickFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'MINE', label: 'Mías' },
  { value: 'WAITING', label: 'Esperando' },
  { value: 'AI', label: 'IA' },
];

export function ConversationListPanel({
  items,
  selectedId,
  onSelect,
  quickFilter,
  onQuickFilterChange,
}: {
  items: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
}) {
  const [query, setQuery] = useState('');
  // Independiente de quickFilter a propósito: debe verse aunque el asesor esté en otra
  // pestaña (Todas, Mías, IA) — es la señal de "hay gente esperando respuesta".
  const waitingCount = useWaitingConversationsCount();

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
      <div className="flex flex-col gap-[var(--space-6)] border-b border-border p-[var(--space-7)]">
        <div className="flex items-center gap-[var(--space-4)] rounded-md bg-app p-[var(--space-4)]">
          <SearchIcon className="size-[14px] text-secondary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversación..."
            className="w-full bg-transparent text-xs text-ink placeholder-secondary focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-[var(--space-3)]" role="tablist" aria-label="Filtrar conversaciones">
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f.value;
            const badgeCount = f.value === 'WAITING' ? waitingCount : 0;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onQuickFilterChange(f.value)}
                className={`flex items-center gap-[var(--space-3)] rounded-full px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold transition-colors ${
                  active ? 'bg-brand text-on-brand' : 'bg-app text-secondary hover:text-ink'
                }`}
              >
                {f.label}
                {badgeCount > 0 && (
                  <span
                    className="flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-[3px] text-[10px] font-bold leading-none text-on-brand"
                    title={`${badgeCount} conversación${badgeCount === 1 ? '' : 'es'} esperando respuesta`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
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
