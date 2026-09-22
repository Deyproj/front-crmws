'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useConversationsList } from '../hooks/useConversationsList';
import { useConversationThread } from '../hooks/useConversationThread';
import { ConversationListPanel, type QuickFilter } from '../components/ConversationListPanel';
import { ChatPanel } from '../components/ChatPanel';
import { ContactPanel } from '../components/ContactPanel';
import type { ConversationFilters } from '@/features/conversations';
import { useDebouncedValue } from '@/lib/utils/useDebouncedValue';

export function ConversationsView() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('ALL');
  const [query, setQuery] = useState('');
  // Espera a que el asesor deje de escribir antes de consultar al backend.
  const debouncedQuery = useDebouncedValue(query.trim());
  // Por debajo de lg solo cabe una columna a la vez: la bandeja arranca mostrando la
  // lista y pasa a "chat" al elegir una conversación (con botón de volver en ChatPanel).
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [contactPanelOpen, setContactPanelOpen] = useState(false);

  function handleSelect(id: string) {
    setSelectedId(id);
    setMobileView('chat');
  }

  // Deep-link desde fuera de la bandeja (botón "Chat" en Clientes, clic en una notificación:
  // /?conversation=<id>) — se selecciona al montar y cada vez que cambia el parámetro (la
  // notificación de la pestaña ya abierta navega sin recargar), sin depender de que la
  // conversación ya esté en `items` (useConversationThread la trae directo por id, sin importar
  // el quickFilter activo).
  const searchParams = useSearchParams();
  const deepLinkedConversationId = searchParams.get('conversation');
  useEffect(() => {
    if (deepLinkedConversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSelect(deepLinkedConversationId);
    }
  }, [deepLinkedConversationId]);

  // La conversación puede ser nueva (aún no está en `items`) — se refresca la bandeja
  // antes de seleccionarla para que ChatPanel/ContactPanel encuentren el contacto real.
  async function handleConversationStarted(id: string) {
    await refetch();
    handleSelect(id);
  }

  const filters = useMemo<ConversationFilters>(() => {
    const q = debouncedQuery || undefined;
    switch (quickFilter) {
      case 'MINE':
        return user?.membershipId ? { assignedTo: user.membershipId, q } : { q };
      case 'WAITING':
        return { status: 'WAITING', q };
      case 'AI':
        return { mode: 'AI', q };
      default:
        return { q };
    }
  }, [quickFilter, user, debouncedQuery]);

  const { items, hasMore, loadingMore, loadMore, contactsById, loading, error, refetch, ensureContact } =
    useConversationsList(filters);
  const thread = useConversationThread(selectedId, refetch);
  const threadContactId = thread.conversation?.contactId ?? null;
  useEffect(() => {
    ensureContact(threadContactId);
  }, [threadContactId, ensureContact]);

  // Se resuelve contra contactsById (sin filtrar por quickFilter) y no contra `items`:
  // si la conversación abierta deja de estar en la pestaña activa (p. ej. ya se tomó y
  // desaparece de "Esperando"), el chat sigue mostrando el contacto correcto en vez de
  // "Contacto sin nombre".
  const selectedContact = thread.conversation ? (contactsById.get(thread.conversation.contactId) ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">Bandeja de conversaciones</h1>
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
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
              selectedId={selectedId}
              onSelect={handleSelect}
              quickFilter={quickFilter}
              onQuickFilterChange={setQuickFilter}
              query={query}
              onQueryChange={setQuery}
              myMembershipId={user?.membershipId}
              onBulkTransferred={refetch}
              onConversationStarted={handleConversationStarted}
              className={mobileView === 'chat' ? 'hidden lg:flex' : 'flex animate-panel-slide-in lg:animate-none'}
            />
            <ChatPanel
              conversation={thread.conversation}
              messages={thread.messages}
              hasOlderMessages={thread.hasOlderMessages}
              loadingOlder={thread.loadingOlder}
              onLoadOlder={thread.loadOlderMessages}
              contact={selectedContact}
              myMembershipId={user?.membershipId ?? ''}
              myRole={user?.role ?? ''}
              actionPending={thread.actionPending}
              actionError={thread.actionError}
              onTakeOver={thread.takeOver}
              onRelease={thread.release}
              onTransfer={thread.transfer}
              onSend={thread.send}
              onSendMedia={thread.sendMedia}
              outsideServiceWindow={thread.outsideServiceWindow}
              onSendTemplate={thread.sendTemplate}
              onDismissTemplateRequirement={thread.dismissOutsideServiceWindow}
              className={mobileView === 'list' ? 'hidden lg:flex' : 'flex animate-panel-slide-in lg:animate-none'}
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
