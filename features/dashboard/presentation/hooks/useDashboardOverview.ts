'use client';

import { useCallback, useEffect, useState } from 'react';
import { listContacts, getContactStats, type Contact, type ContactStats } from '@/features/contacts';
import { listConversations, getConversationStats, type Conversation, type ConversationStats } from '@/features/conversations';
import { getAppointmentStats, type AppointmentStats } from '@/features/appointments';
import { getCurrentUsage, type CurrentUsage } from '@/features/usage';

const POLL_INTERVAL_MS = 20000;
const RECENT_CONVERSATIONS_LIMIT = 5;

export interface RecentConversationItem {
  conversation: Conversation;
  contact: Contact | null;
}

/**
 * Snapshot liviano para el Dashboard — a diferencia de `useConversationsList` (bandeja en vivo,
 * SSE + catálogo completo de contactos), esto es un vistazo de solo lectura: un `poll` simple
 * alcanza, no hace falta enganchar el contexto de tiempo real de conversaciones.
 */
export function useDashboardOverview() {
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [conversationStats, setConversationStats] = useState<ConversationStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [recentConversations, setRecentConversations] = useState<RecentConversationItem[]>([]);
  const [aiUsage, setAiUsage] = useState<CurrentUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const [contacts, cStats, convStats, apptStats, conversations, usage] = await Promise.all([
        listContacts(),
        getContactStats(),
        getConversationStats(),
        getAppointmentStats(),
        listConversations(),
        getCurrentUsage(),
      ]);
      const contactsById = new Map(contacts.map((c) => [c.id, c]));
      // listConversations() ya llega ordenado por lastMessageAt desc (ver ConversationRepository.search).
      const recent = conversations
        .slice(0, RECENT_CONVERSATIONS_LIMIT)
        .map((conversation) => ({ conversation, contact: contactsById.get(conversation.contactId) ?? null }));
      setContactStats(cStats);
      setConversationStats(convStats);
      setAppointmentStats(apptStats);
      setRecentConversations(recent);
      setAiUsage(usage);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el dashboard');
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return {
    contactStats,
    conversationStats,
    appointmentStats,
    recentConversations,
    aiUsage,
    loading,
    error,
    refetch: () => load({ silent: true }),
  };
}
