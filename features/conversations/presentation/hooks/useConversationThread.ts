'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getConversation,
  listMessages,
  releaseConversationToAi,
  sendMessage,
  takeOverConversation,
  type Conversation,
  type Message,
} from '@/features/conversations';

const POLL_INTERVAL_MS = 5000;

export function useConversationThread(conversationId: string | null, onConversationChanged?: () => void) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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
      return;
    }
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

  async function send(text: string) {
    if (!conversationId || !text.trim()) return;
    setActionPending(true);
    setActionError(null);
    try {
      const message = await sendMessage(conversationId, text.trim());
      setMessages((prev) => [...prev, message]);
      onConversationChanged?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setActionPending(false);
    }
  }

  return { conversation, messages, loading, error, actionPending, actionError, takeOver, release, send };
}
