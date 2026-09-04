'use client';

import { useCallback, useEffect, useState } from 'react';
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

export function useConversationThread(conversationId: string | null, onConversationChanged?: () => void) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const [conv, msgs] = await Promise.all([getConversation(conversationId), listMessages(conversationId)]);
        setConversation(conv);
        setMessages(msgs);
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
      setOutsideServiceWindow(false);
      return;
    }
    setOutsideServiceWindow(false);
    load();
    const interval = setInterval(() => load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [conversationId, load]);

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
