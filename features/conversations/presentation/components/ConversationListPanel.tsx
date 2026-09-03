'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ConversationListItem } from '../hooks/useConversationsList';
import { useWaitingConversationsCount } from '../hooks/useWaitingConversationsCount';
import { useMineConversationsCount } from '../hooks/useMineConversationsCount';
import { useTeamMembers } from '@/features/organization/presentation/hooks/useTeamMembers';
import { useAgentConfig } from '@/features/agent/presentation/hooks/useAgentConfig';
import type { Membership } from '@/features/organization';
import { MODE_LABELS, STATUS_LABELS, transferConversation, releaseConversationToAi } from '@/features/conversations';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { initials } from '@/lib/utils/initials';
import { SearchIcon, MessageSquareIcon, UsersIcon, BotIcon, PlusIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { NewConversationDialog } from './NewConversationDialog';

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
  myMembershipId,
  onBulkTransferred,
  onConversationStarted,
  className = 'flex',
}: {
  items: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  quickFilter: QuickFilter;
  onQuickFilterChange: (filter: QuickFilter) => void;
  myMembershipId?: string | null;
  /** Se llama luego de una transferencia masiva exitosa (al menos parcial) para refrescar la bandeja. */
  onBulkTransferred?: () => void;
  /** Se llama con el id de la conversación resuelta desde "Nuevo chat" (nueva o ya existente). */
  onConversationStarted?: (conversationId: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [newChatOpen, setNewChatOpen] = useState(false);
  // Independiente de quickFilter a propósito: debe verse aunque el asesor esté en otra
  // pestaña (Todas, Mías, IA) — es la señal de "hay gente esperando respuesta".
  const waitingCount = useWaitingConversationsCount();
  const mineCount = useMineConversationsCount(myMembershipId);
  const { members } = useTeamMembers();
  const { config: agentConfig } = useAgentConfig();
  const agentName = agentConfig?.agentName || 'IA';
  // Solo tiene sentido transferir en lote conversaciones propias (misma restricción que
  // TransferConversationHandler en el backend: solo el asesor asignado puede transferir).
  const transferCandidates = members.filter((m) => m.id !== myMembershipId && m.active);
  // La selección en bloque sirve tanto para transferir como para liberar a la IA, así que
  // se habilita en "Mías" aunque no haya a quién transferir (organización de un solo asesor).
  const selectionEnabled = quickFilter === 'MINE';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPending, setBulkPending] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(({ contact }) => {
      const name = contact?.name?.toLowerCase() ?? '';
      const phone = contact?.phone?.toLowerCase() ?? '';
      return name.includes(q) || phone.includes(q);
    });
  }, [items, query]);

  // La selección no sobrevive a un cambio de pestaña ni a que una conversación
  // seleccionada desaparezca del filtro actual (p. ej. otro asesor la tomó).
  useEffect(() => {
    // Poda la selección contra la lista real (llega por props, no derivable sin el efecto):
    // sale de MINE, o el polling de useConversationsList hace que una conversación
    // seleccionada deje de estar asignada a mí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      if (!selectionEnabled) return new Set();
      const validIds = new Set(filtered.map((i) => i.conversation.id));
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [selectionEnabled, filtered]);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length;
    }
  }, [selectedIds, filtered.length]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) =>
      prev.size === filtered.length && filtered.length > 0 ? new Set() : new Set(filtered.map((i) => i.conversation.id))
    );
  }

  async function handleBulkTransfer(targetMembershipId: string) {
    const ids = Array.from(selectedIds);
    setBulkPending(true);
    setBulkError(null);
    const results = await Promise.allSettled(ids.map((id) => transferConversation(id, targetMembershipId)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkPending(false);
    setSelectedIds(new Set());
    onBulkTransferred?.();
    if (failed > 0) {
      setBulkError(
        `${failed} de ${ids.length} conversación${ids.length === 1 ? '' : 'es'} no se pudo${failed === 1 ? '' : 'ieron'} transferir (puede que ya no esté${failed === 1 ? '' : 'n'} asignada${failed === 1 ? '' : 's'} a ti).`
      );
    }
  }

  async function handleBulkRelease() {
    const ids = Array.from(selectedIds);
    setBulkPending(true);
    setBulkError(null);
    const results = await Promise.allSettled(ids.map((id) => releaseConversationToAi(id)));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setBulkPending(false);
    setSelectedIds(new Set());
    onBulkTransferred?.();
    if (failed > 0) {
      setBulkError(
        `${failed} de ${ids.length} conversación${ids.length === 1 ? '' : 'es'} no se pudo${failed === 1 ? '' : 'ieron'} liberar a ${agentName} (puede que ya no esté${failed === 1 ? '' : 'n'} asignada${failed === 1 ? '' : 's'} a ti).`
      );
    }
  }

  return (
    <div className={`h-full w-full shrink-0 flex-col border-r border-border bg-surface lg:w-[320px] ${className}`}>
      <div className="flex flex-col gap-[var(--space-6)] border-b border-border p-[var(--space-7)]">
        <div className="flex items-center gap-[var(--space-4)]">
          <div className="flex flex-1 items-center gap-[var(--space-4)] rounded-md bg-app p-[var(--space-4)]">
            <SearchIcon className="size-[14px] text-secondary" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar conversación..."
              className="w-full bg-transparent text-xs text-ink placeholder-secondary focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setNewChatOpen(true)}
            aria-label="Nuevo chat"
            title="Nuevo chat"
            className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand text-on-brand hover:bg-brand-hover"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-[var(--space-3)]" role="tablist" aria-label="Filtrar conversaciones">
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f.value;
            const badgeCount = f.value === 'WAITING' ? waitingCount : f.value === 'MINE' ? mineCount : 0;
            // Sólido (alto contraste) solo para lo urgente — "Esperando"; tonal para "Mías",
            // un indicador informativo que no debe competir en atención con lo urgente.
            const badgeVariantClass = f.value === 'WAITING' ? 'bg-danger text-on-brand' : 'bg-info-bg text-info';
            const badgeTitle =
              f.value === 'WAITING'
                ? `${badgeCount} conversación${badgeCount === 1 ? '' : 'es'} esperando respuesta`
                : `${badgeCount} conversación${badgeCount === 1 ? '' : 'es'} asignada${badgeCount === 1 ? '' : 's'} a mí`;
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
                    className={`flex h-4 min-w-4 items-center justify-center rounded-full ${badgeVariantClass} p-[4px] text-[10px] font-bold leading-none`}
                    title={badgeTitle}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        {filtered.length === 0 && (
          <EmptyState
            icon={<MessageSquareIcon className="size-6" />}
            title="Sin conversaciones"
            description={query ? 'Nada coincide con tu búsqueda.' : 'No hay conversaciones en este filtro todavía.'}
          />
        )}
        {filtered.map(({ conversation, contact }) => {
          const active = conversation.id === selectedId;
          const label = contact?.name || contact?.phone || 'Contacto sin nombre';
          return (
            <div
              key={conversation.id}
              className={`flex w-full items-center gap-[var(--space-4)] border-b border-border pr-[var(--space-7)] transition-colors ${
                active ? 'bg-success-bg' : 'bg-surface hover:bg-app'
              }`}
            >
              {selectionEnabled && (
                <input
                  type="checkbox"
                  checked={selectedIds.has(conversation.id)}
                  onChange={() => toggleSelect(conversation.id)}
                  aria-label={`Seleccionar conversación con ${label}`}
                  className="ml-[var(--space-7)] size-4 shrink-0 accent-brand"
                />
              )}
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                className={`flex min-w-0 flex-1 items-center gap-[var(--space-6)] py-[var(--space-7)] text-left ${
                  selectionEnabled ? '' : 'pl-[var(--space-7)]'
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
            </div>
          );
        })}
      </div>

      {selectionEnabled && filtered.length > 0 && (
        <div className="flex flex-col gap-[var(--space-3)] border-t border-border bg-surface p-[var(--space-6)]">
          {bulkError && <p className="text-xs text-danger">{bulkError}</p>}
          <div className="flex items-center justify-between gap-[var(--space-4)]">
            <label className="flex items-center gap-[var(--space-3)] text-xs text-secondary">
              <input
                ref={selectAllRef}
                type="checkbox"
                checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                onChange={toggleSelectAll}
                aria-label="Seleccionar todas las conversaciones"
                className="size-4 accent-brand"
              />
              {selectedIds.size > 0 ? `${selectedIds.size} seleccionada${selectedIds.size === 1 ? '' : 's'}` : 'Seleccionar todas'}
            </label>
            <div className="flex items-center gap-[var(--space-3)]">
              <BulkReleaseButton
                agentName={agentName}
                selectedCount={selectedIds.size}
                pending={bulkPending}
                onConfirm={handleBulkRelease}
              />
              {transferCandidates.length > 0 && (
                <BulkTransferButton
                  members={transferCandidates}
                  selectedCount={selectedIds.size}
                  pending={bulkPending}
                  onConfirm={handleBulkTransfer}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <NewConversationDialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        onStarted={(conversationId) => {
          setNewChatOpen(false);
          onConversationStarted?.(conversationId);
        }}
      />
    </div>
  );
}

function BulkReleaseButton({
  agentName,
  selectedCount,
  pending,
  onConfirm,
}: {
  agentName: string;
  selectedCount: number;
  pending: boolean;
  onConfirm: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={selectedCount === 0 || pending}
        className="flex items-center gap-[var(--space-3)] rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
      >
        <BotIcon className="size-3" />
        Liberar a {agentName}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title={`Liberar a ${agentName}`}
        description={`¿Liberar ${selectedCount} conversación${selectedCount === 1 ? '' : 'es'} a ${agentName}? Dejarás de poder responderlas hasta que las vuelvas a tomar.`}
        confirmLabel="Liberar"
        pending={pending}
        onConfirm={() => {
          setConfirmOpen(false);
          onConfirm();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

function BulkTransferButton({
  members,
  selectedCount,
  pending,
  onConfirm,
}: {
  members: Membership[];
  selectedCount: number;
  pending: boolean;
  onConfirm: (targetMembershipId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<Membership | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={selectedCount === 0 || pending}
        className="flex items-center gap-[var(--space-3)] rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
      >
        <UsersIcon className="size-3" />
        Transferir
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-10 mb-[var(--space-3)] w-56 rounded-md border border-border bg-surface py-[var(--space-3)] shadow-sm">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                setOpen(false);
                setPendingTarget(member);
              }}
              className="block w-full truncate px-[var(--space-6)] py-[var(--space-4)] text-left text-xs text-ink hover:bg-app"
            >
              {member.name || member.email || 'Asesor'}
            </button>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={pendingTarget !== null}
        title="Transferir conversaciones"
        description={`¿Transferir ${selectedCount} conversación${selectedCount === 1 ? '' : 'es'} a ${pendingTarget?.name || pendingTarget?.email || 'este asesor'}? Dejarás de poder responderlas hasta que te las transfieran de vuelta.`}
        confirmLabel="Transferir"
        pending={pending}
        onConfirm={() => {
          if (!pendingTarget) return;
          const targetId = pendingTarget.id;
          setPendingTarget(null);
          onConfirm(targetId);
        }}
        onCancel={() => setPendingTarget(null)}
      />
    </div>
  );
}
