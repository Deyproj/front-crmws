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
  // Por debajo de lg solo cabe una columna a la vez: la bandeja arranca mostrando la
  // lista y pasa a "chat" al elegir una conversación (con botón de volver en ChatPanel).
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [contactPanelOpen, setContactPanelOpen] = useState(false);

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileView('chat');
  }

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

  const { items, contactsById, loading, error, refetch } = useConversationsList(filters);
  const thread = useConversationThread(selectedId, refetch);

  // Se resuelve contra contactsById (sin filtrar por quickFilter) y no contra `items`:
  // si la conversación abierta deja de estar en la pestaña activa (p. ej. ya se tomó y
  // desaparece de "Esperando"), el chat sigue mostrando el contacto correcto en vez de
  // "Contacto sin nombre".
  const selectedContact = thread.conversation ? (contactsById.get(thread.conversation.contactId) ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[var(--topbar-height)] shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
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
              onSelect={handleSelect}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
              className={mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
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
              className={mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
              onBack={() => setMobileView('list')}
              onOpenContact={() => setContactPanelOpen(true)}
            />
            <ContactPanel
              contact={selectedContact}
              conversation={thread.conversation}
              onContactChanged={() => refetch()}
              mobileOpen={contactPanelOpen}
              onClose={() => setContactPanelOpen(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
