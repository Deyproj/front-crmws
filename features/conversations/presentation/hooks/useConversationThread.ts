'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getConversation,
  listMessages,
  releaseConversationToAi,
  sendMessage,
  sendTemplateMessage,
  takeOverConversation,
  transferConversation,
  type Conversation,
  type Message,
} from '@/features/conversations';
import { ApiError } from '@/lib/http/apiFetch';

const POLL_INTERVAL_MS = 5000;

/**
 * Une mensajes ya cargados con los recién traídos (poll o "cargar anteriores") sin perder
 * ninguno: el poll solo trae la última tanda, así que reemplazar la lista borraría los
 * anteriores que el asesor ya cargó. Orden por sequenceNumber, el orden real del hilo.
 */
function mergeMessages(current: Message[], incoming: Message[]): Message[] {
  const byId = new Map(current.map((m) => [m.id, m]));
  incoming.forEach((m) => byId.set(m.id, m));
  return Array.from(byId.values()).sort(
    (a, b) => (a.sequenceNumber ?? Number.MAX_SAFE_INTEGER) - (b.sequenceNumber ?? Number.MAX_SAFE_INTEGER)
  );
}

export function useConversationThread(conversationId: string | null, onConversationChanged?: () => void) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita mezclar mensajes de la conversación anterior si su respuesta llega después del cambio.
  const conversationIdRef = useRef(conversationId);
  useEffect(() => {
    // Declarado antes del efecto de carga para que ya esté actualizado cuando este corra.
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // 422 en el envío manual = OutsideServiceWindowException (BR-030, solo canales Meta Cloud
  // API) — el asesor debe usar una plantilla en vez de texto libre hasta que el contacto
  // vuelva a escribir. Se resetea al cambiar de conversación o tras un envío exitoso.
  const [outsideServiceWindow, setOutsideServiceWindow] = useState(false);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!conversationId) return;
      if (!opts?.silent) setLoading(true);
      try {
        const [conv, latest] = await Promise.all([getConversation(conversationId), listMessages(conversationId)]);
        if (conversationIdRef.current !== conversationId) return;
        setConversation(conv);
        if (opts?.silent) {
          setMessages((prev) => mergeMessages(prev, latest.content));
        } else {
          setMessages(latest.content);
          setHasOlderMessages(latest.totalElements > latest.content.length);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la conversación');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    [conversationId]
  );

  useEffect(() => {
    // Limpia el hilo anterior al deseleccionar o cambiar de conversación, y dispara la carga
    // (+ refresco periódico, sin WebSocket/SSE todavía) de la nueva. setState síncrono aquí es
    // intencional: es la transición real al cambiar `conversationId`, no derivable de otra forma.
    if (!conversationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConversation(null);
      setMessages([]);
      setHasOlderMessages(false);
      setOutsideServiceWindow(false);
      return;
    }
    setMessages([]);
    setHasOlderMessages(false);
    setOutsideServiceWindow(false);
    load();
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId, load]);

  /** Trae la tanda anterior al mensaje más antiguo cargado (cursor por sequenceNumber). */
  async function loadOlderMessages() {
    const oldest = messages[0]?.sequenceNumber;
    if (!conversationId || oldest == null || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const older = await listMessages(conversationId, oldest);
      if (conversationIdRef.current !== conversationId) return;
      setMessages((prev) => mergeMessages(prev, older.content));
      setHasOlderMessages(older.totalElements > older.content.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los mensajes anteriores');
    } finally {
      setLoadingOlder(false);
    }
  }

  async function runAction(action: () => Promise<Conversation>) {
    setActionPending(true);
    setActionError(null);
    try {
      const updated = await action();
      setConversation(updated);
      onConversationChanged?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'La acción no se pudo completar');
    } finally {
      setActionPending(false);
    }
  }

  async function takeOver() {
    if (!conversationId) return;
    await runAction(() => takeOverConversation(conversationId));
  }

  async function release() {
    if (!conversationId) return;
    await runAction(() => releaseConversationToAi(conversationId));
  }

  async function transfer(targetMembershipId: string) {
    if (!conversationId) return;
    await runAction(() => transferConversation(conversationId, targetMembershipId));
  }

  /** Devuelve si el envío tuvo éxito, para que el borrador no se limpie si falla. */
  async function send(text: string): Promise<boolean> {
    if (!conversationId || !text.trim()) return false;
    setActionPending(true);
    setActionError(null);
    try {
      const message = await sendMessage(conversationId, text.trim());
      setMessages((prev) => [...prev, message]);
      setOutsideServiceWindow(false);
      onConversationChanged?.();
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) setOutsideServiceWindow(true);
      setActionError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
      return false;
    } finally {
      setActionPending(false);
    }
  }

  /** Único envío posible fuera de la ventana de 24h de un canal Meta (ver `outsideServiceWindow`). */
  async function sendTemplate(templateId: string, parameters: string[]): Promise<boolean> {
    if (!conversationId) return false;
    setActionPending(true);
    setActionError(null);
    try {
      const message = await sendTemplateMessage(conversationId, templateId, parameters);
      setMessages((prev) => [...prev, message]);
      setOutsideServiceWindow(false);
      onConversationChanged?.();
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo enviar la plantilla');
      return false;
    } finally {
      setActionPending(false);
    }
  }

  return {
    conversation,
    messages,
    hasOlderMessages,
    loadingOlder,
    loadOlderMessages,
    loading,
    error,
    actionPending,
    actionError,
    outsideServiceWindow,
    dismissOutsideServiceWindow: () => setOutsideServiceWindow(false),
    takeOver,
    release,
    transfer,
    send,
    sendTemplate,
  };
}
