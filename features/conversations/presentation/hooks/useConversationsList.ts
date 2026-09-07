'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listConversations, type Conversation, type ConversationFilters } from '@/features/conversations';
import { listContacts, type Contact } from '@/features/contacts';
import { useConversationsPollTick, useConversationsSignal, useContactsSignal } from '../context/ConversationRealtimeContext';

export interface ConversationListItem {
  conversation: Conversation;
  contact: Contact | null;
}

function mergeAndSort(conversations: Conversation[], contactsById: Map<string, Contact>): ConversationListItem[] {
  return conversations
    .map((conversation) => ({ conversation, contact: contactsById.get(conversation.contactId) ?? null }))
    .sort((a, b) => {
      const at = a.conversation.lastMessageAt ? new Date(a.conversation.lastMessageAt).getTime() : 0;
      const bt = b.conversation.lastMessageAt ? new Date(b.conversation.lastMessageAt).getTime() : 0;
      return bt - at;
    });
}

export function useConversationsList(filters: ConversationFilters = {}) {
  const { mode, status, assignedTo } = filters;
  const conversationsSignal = useConversationsSignal();
  const contactsSignal = useContactsSignal();
  const pollTick = useConversationsPollTick();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  // Contactos completos (sin filtrar por quickFilter) — a diferencia de `items`, no
  // desaparece cuando la conversación abierta deja de estar en la pestaña activa.
  const [contactsById, setContactsById] = useState<Map<string, Contact>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Se lee siempre del ref (no del estado) al fusionar con conversaciones recién
  // cargadas, para no depender de `contactsById` en las dependencias de `loadConversations`
  // y evitar así releer el catálogo completo de contactos en cada refresco de conversaciones.
  const contactsRef = useRef<Map<string, Contact>>(new Map());

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!opts?.silent) setLoading(true);
      try {
        const conversations = await listConversations({ mode, status, assignedTo });
        setItems(mergeAndSort(conversations, contactsRef.current));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la bandeja');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [mode, status, assignedTo]
  );

  // Separado de `loadConversations` a propósito: los avisos de tomar/liberar/transferir no
  // crean ni renombran contactos, así que no hace falta releer el catálogo completo en cada
  // uno de ellos (antes `listContacts()` se repetía cada 8s sin importar el motivo del
  // refresco). Solo se dispara con la carga inicial, `conversation.waiting` (posible contacto
  // nuevo) y el poll de seguridad.
  const loadContacts = useCallback(async () => {
    try {
      const contacts = await listContacts();
      const byId = new Map(contacts.map((c) => [c.id, c]));
      contactsRef.current = byId;
      setContactsById(byId);
      // Reasocia los `items` ya cargados con los contactos frescos (nombre editado, o
      // contacto nuevo) sin esperar a que también llegue un `conversationsSignal`.
      setItems((prev) => mergeAndSort(prev.map((i) => i.conversation), byId));
    } catch {
      // los contactos son secundarios frente a la lista de conversaciones — un fallo aquí
      // no debe romper la bandeja, se reintenta en el próximo signal/poll
    }
  }, []);

  useEffect(() => {
    // Carga inicial (contactos primero, luego conversaciones ya resueltas contra ellos).
    // setLoading(true) corre síncrono aquí a propósito: es la recarga real al montar o
    // cambiar de filtro, no un efecto derivable de otra forma.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts().then(() => loadConversations());
  }, [loadConversations, loadContacts]);

  useEffect(() => {
    // conversation.waiting/.taken/.released/.transferred: adelanta el refresco de la
    // bandeja en vez de esperar el próximo poll de seguridad.
    if (conversationsSignal === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations({ silent: true });
  }, [conversationsSignal, loadConversations]);

  useEffect(() => {
    // Solo conversation.waiting llega hasta aquí — posible contacto nuevo.
    if (contactsSignal === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts();
  }, [contactsSignal, loadContacts]);

  useEffect(() => {
    // Red de seguridad si el SSE no conectó — mismo orden que la carga inicial.
    if (pollTick === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadContacts().then(() => loadConversations({ silent: true }));
  }, [pollTick, loadContacts, loadConversations]);

  return {
    items,
    contactsById,
    loading,
    error,
    // A diferencia de los refrescos automáticos de arriba, un refetch explícito (tras una
    // acción del asesor: nuevo chat, transferencia en bloque, edición de contacto) sí puede
    // involucrar un contacto nuevo o renombrado, así que recarga ambos.
    refetch: () => loadContacts().then(() => loadConversations({ silent: true })),
  };
}
