'use client';

import { useState } from 'react';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useConversationsList } from '../hooks/useConversationsList';
import { useConversationThread } from '../hooks/useConversationThread';
import { ConversationListPanel } from '../components/ConversationListPanel';
import { ChatPanel } from '../components/ChatPanel';
import { ContactPanel } from '../components/ContactPanel';

export function ConversationsView() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { items, loading, error, refetch } = useConversationsList();
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
            <ConversationListPanel items={items} selectedId={selectedId} onSelect={setSelectedId} />
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
            <ContactPanel contact={selectedContact} onContactChanged={() => refetch()} />
          </>
        )}
      </div>
    </div>
  );
}
