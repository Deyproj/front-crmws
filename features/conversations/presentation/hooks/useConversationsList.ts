'use client';

import { useCallback, useEffect, useState } from 'react';
import { listConversations, type Conversation, type ConversationFilters } from '@/features/conversations';
import { listContacts, type Contact } from '@/features/contacts';

const POLL_INTERVAL_MS = 8000;

export interface ConversationListItem {
  conversation: Conversation;
  contact: Contact | null;
}

export function useConversationsList(filters: ConversationFilters = {}) {
  const { mode, status, assignedTo } = filters;
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const [conversations, contacts] = await Promise.all([
          listConversations({ mode, status, assignedTo }),
          listContacts(),
        ]);
        const contactsById = new Map(contacts.map((c) => [c.id, c]));
        const merged = conversations
          .map((conversation) => ({ conversation, contact: contactsById.get(conversation.contactId) ?? null }))
          .sort((a, b) => {
            const at = a.conversation.lastMessageAt ? new Date(a.conversation.lastMessageAt).getTime() : 0;
            const bt = b.conversation.lastMessageAt ? new Date(b.conversation.lastMessageAt).getTime() : 0;
            return bt - at;
          });
        setItems(merged);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la bandeja');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [mode, status, assignedTo]
  );

  useEffect(() => {
    // Carga inicial + refresco periódico (sin WebSocket/SSE todavía — ver mvp-roadmap.md,
    // "Trabajo condicional"). setLoading(true) corre síncrono aquí a propósito: es la
    // recarga real al montar o cambiar de filtro, no un efecto derivable de otra forma.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return { items, loading, error, refetch: () => load({ silent: true }) };
}
