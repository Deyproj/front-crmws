'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { listConversations, type Conversation, type ConversationFilters } from '@/features/conversations';
import { getContactsByIds, type Contact } from '@/features/contacts';
import { useConversationsPollTick, useConversationsSignal, useContactsSignal } from '../context/ConversationRealtimeContext';

export interface ConversationListItem {
  conversation: Conversation;
  contact: Contact | null;
}

function uniqueById(conversations: Conversation[]): Conversation[] {
  return Array.from(new Map(conversations.map((c) => [c.id, c])).values());
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
  const { mode, status, assignedTo, q } = filters;
  const conversationsSignal = useConversationsSignal();
  const contactsSignal = useContactsSignal();
  const pollTick = useConversationsPollTick();
  const [items, setItems] = useState<ConversationListItem[]>([]);
  // Caché acumulativa de contactos (no se vacía al cambiar de pestaña o búsqueda) — a diferencia
  // de `items`, no pierde el contacto de la conversación abierta cuando deja de estar en la lista.
  const [contactsById, setContactsById] = useState<Map<string, Contact>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tandas ya cargadas con "Cargar más conversaciones" — los refrescos automáticos vuelven a
  // pedir todas para no "descargar" lo que el asesor ya abrió. Vuelve a 1 al cambiar de filtro.
  const pageCountRef = useRef(1);
  const conversationsRef = useRef<Conversation[]>([]);
  // Se lee siempre de los refs (no del estado) para no depender de `contactsById`/`items` en las
  // dependencias de los callbacks y así no disparar recargas en cadena.
  const contactsRef = useRef<Map<string, Contact>>(new Map());
  // Contacto de la conversación abierta (ver ensureContact) — se refresca junto con los de la
  // lista aunque su conversación ya no esté en la pestaña o búsqueda activa.
  const pinnedContactIdRef = useRef<string | null>(null);
  // Descarta respuestas viejas cuando la búsqueda cambia más rápido de lo que responde el backend.
  const requestSeq = useRef(0);

  /**
   * Resuelve contactos por id (antes se leía solo la primera página de 100 contactos, así que
   * las conversaciones de contactos fuera de esa ventana quedaban "sin nombre" e imposibles de
   * buscar). `refresh` vuelve a pedir también los que ya están en caché (nombre editado).
   */
  const resolveContacts = useCallback(async (ids: string[], refresh: boolean) => {
    const toFetch = refresh ? ids : ids.filter((id) => !contactsRef.current.has(id));
    if (toFetch.length === 0) return;
    const contacts = await getContactsByIds(toFetch);
    const byId = new Map(contactsRef.current);
    contacts.forEach((c) => byId.set(c.id, c));
    contactsRef.current = byId;
    setContactsById(byId);
  }, []);

  const loadConversations = useCallback(
    async (opts?: { silent?: boolean; refreshContacts?: boolean }) => {
      const seq = ++requestSeq.current;
      if (!opts?.silent) setLoading(true);
      try {
        const pages = await Promise.all(
          Array.from({ length: pageCountRef.current }, (_, page) => listConversations({ mode, status, assignedTo, q }, page))
        );
        if (seq !== requestSeq.current) return;
        // Entre tanda y tanda pueden moverse conversaciones (llega un mensaje y sube a la primera):
        // se deduplica por id en vez de asumir páginas estables.
        const conversations = uniqueById(pages.flatMap((p) => p.content));
        const totalElements = pages[0]?.totalElements ?? 0;
        const ids = conversations.map((c) => c.contactId);
        if (pinnedContactIdRef.current) ids.push(pinnedContactIdRef.current);
        try {
          await resolveContacts(ids, opts?.refreshContacts ?? false);
        } catch {
          // los contactos son secundarios frente a la lista de conversaciones — un fallo aquí
          // no debe romper la bandeja, se reintenta en el próximo signal/poll
        }
        if (seq !== requestSeq.current) return;
        conversationsRef.current = conversations;
        setItems(mergeAndSort(conversations, contactsRef.current));
        setHasMore(totalElements > conversations.length);
        setError(null);
      } catch (err) {
        if (seq === requestSeq.current) setError(err instanceof Error ? err.message : 'No se pudo cargar la bandeja');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [mode, status, assignedTo, q, resolveContacts]
  );

  // Cambiar de pestaña muestra "Cargando bandeja..."; cambiar solo la búsqueda recarga en
  // silencio — si no, el panel se desmontaría y el campo de búsqueda perdería el foco.
  const filterKey = `${mode ?? ''}|${status ?? ''}|${assignedTo ?? ''}`;
  const lastFilterKey = useRef<string | null>(null);

  useEffect(() => {
    const silent = lastFilterKey.current === filterKey;
    lastFilterKey.current = filterKey;
    pageCountRef.current = 1;
    loadConversations({ silent });
  }, [loadConversations, filterKey]);

  useEffect(() => {
    // conversation.waiting/.taken/.released/.transferred: adelanta el refresco de la
    // bandeja en vez de esperar el próximo poll de seguridad. Un contacto nuevo se resuelve
    // solo, porque no está en caché.
    if (conversationsSignal === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations({ silent: true });
  }, [conversationsSignal, loadConversations]);

  useEffect(() => {
    // Solo conversation.waiting llega hasta aquí — posible contacto nuevo o renombrado.
    if (contactsSignal === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations({ silent: true, refreshContacts: true });
  }, [contactsSignal, loadConversations]);

  useEffect(() => {
    // Red de seguridad si el SSE no conectó.
    if (pollTick === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations({ silent: true, refreshContacts: true });
  }, [pollTick, loadConversations]);

  /**
   * Asegura el contacto de la conversación abierta aunque no esté en la lista actual
   * (deep-link desde Clientes, o una conversación fuera de la pestaña/búsqueda activa).
   */
  const ensureContact = useCallback(
    (contactId: string | null) => {
      pinnedContactIdRef.current = contactId;
      if (!contactId || contactsRef.current.has(contactId)) return;
      resolveContacts([contactId], false).catch(() => {});
    },
    [resolveContacts]
  );

  const loadMore = useCallback(async () => {
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const next = await listConversations({ mode, status, assignedTo, q }, pageCountRef.current);
      await resolveContacts(next.content.map((c) => c.contactId), false).catch(() => {});
      // Si mientras tanto cambió el filtro o llegó un refresco completo, se descarta la tanda.
      if (seq !== requestSeq.current) return;
      pageCountRef.current += 1;
      const conversations = uniqueById([...conversationsRef.current, ...next.content]);
      conversationsRef.current = conversations;
      setItems(mergeAndSort(conversations, contactsRef.current));
      setHasMore(next.totalElements > conversations.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar más conversaciones');
    } finally {
      setLoadingMore(false);
    }
  }, [mode, status, assignedTo, q, resolveContacts]);

  return {
    items,
    hasMore,
    loadingMore,
    loadMore,
    contactsById,
    loading,
    error,
    ensureContact,
    // A diferencia de los refrescos automáticos de arriba, un refetch explícito (tras una
    // acción del asesor: nuevo chat, transferencia en bloque, edición de contacto) sí puede
    // involucrar un contacto renombrado, así que vuelve a pedir los contactos visibles.
    refetch: () => loadConversations({ silent: true, refreshContacts: true }),
  };
}
