'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useConversationsList } from '../hooks/useConversationsList';
import { useConversationThread } from '../hooks/useConversationThread';
import { ConversationListPanel, type QuickFilter } from '../components/ConversationListPanel';
import { ChatPanel } from '../components/ChatPanel';
import { ContactPanel } from '../components/ContactPanel';
import type { ConversationFilters } from '@/features/conversations';

export function ConversationsView() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');

  const filters = useMemo<ConversationFilters>(() => {
    switch (quickFilter) {
      case 'MINE':
        return user?.membershipId ? { assignedTo: user.membershipId } : {};
      case 'WAITING':
        return { status: 'WAITING' };
      case 'AI':
        return { mode: 'AI' };
      default:
        return {};
    }
  }, [quickFilter, user]);

  const { items, loading, error, refetch } = useConversationsList(filters);
  const thread = useConversationThread(selectedId, refetch);

  const selectedContact = items.find((i) => i.conversation.id === selectedId)?.contact ?? null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[var(--topbar-height)] shrink-0 items-center border-b border-border bg-surface px-[var(--space-9)]">
        <h1 className="text-xl font-bold text-ink">Bandeja de conversaciones</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {loading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-secondary">Cargando bandeja...</p>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-danger">{error}</p>
          </div>
        ) : (
          <>
            <ConversationListPanel
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
            />
            <ChatPanel
              conversation={thread.conversation}
              messages={thread.messages}
              contact={selectedContact}
              myMembershipId={user?.membershipId ?? ''}
              actionPending={thread.actionPending}
              actionError={thread.actionError}
              onTakeOver={thread.takeOver}
              onRelease={thread.release}
              onSend={thread.send}
            />
            <ContactPanel contact={selectedContact} conversation={thread.conversation} onContactChanged={() => refetch()} />
          </>
        )}
      </div>
    </div>
  );
}
