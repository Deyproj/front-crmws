'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSession } from '@/lib/runtime/tokenStorage';
import { BASE_PATH } from '@/lib/runtime/basePath';
import { subscribeToPush } from './pushSubscriptionClient';

interface RealtimeSignals {
  /**
   * Se incrementa con cualquier aviso que mueva una conversación de una lista a otra
   * (`conversation.waiting`, `.taken`, `.released`, `.transferred`) — la señal que deben
   * escuchar la bandeja y los contadores de burbujas para reflejarlo de inmediato en vez
   * de esperar el próximo poll de seguridad.
   */
  conversationsSignal: number;
  /**
   * Se incrementa solo con `conversation.waiting`, el único aviso que puede traer un
   * contacto nuevo (mensaje entrante de un número no visto antes). Separado de
   * `conversationsSignal` para no releer el catálogo completo de contactos ante avisos
   * que no lo modifican (tomar/liberar/transferir no crean ni renombran contactos).
   */
  contactsSignal: number;
  /**
   * Red de seguridad: se incrementa cada POLL_INTERVAL_MS sin importar el SSE — cubre el
   * caso de stream caído, proxy sin soporte de streaming, o backend con más de una réplica
   * sin sticky sessions. Un único temporizador compartido para que la bandeja y los
   * contadores de burbujas se refresquen siempre juntos (antes cada hook tenía su propio
   * `setInterval` de 8s, arrancado en un instante distinto, así que podían quedar
   * desincronizados entre sí).
   */
  pollTick: number;
}

const ConversationRealtimeContext = createContext<RealtimeSignals>({
  conversationsSignal: 0,
  contactsSignal: 0,
  pollTick: 0,
});

const RECONNECT_DELAY_MS = 4000;
// Red de seguridad, no la vía primaria de actualización: los eventos SSE
// (conversation.waiting/.taken/.released/.transferred) ya cubren en tiempo real todos los
// cambios de estado que mueven un chat entre listas. Este intervalo, mucho más largo que
// el polling de 8s/5s de antes, solo protege contra un stream que no llegó a conectar.
const POLL_INTERVAL_MS = 45000;

function notifyBrowser(title: string, body: string, tag: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  // La pestaña visible ya se entera por el badge/lista (useConversationsSignal) — evita
  // duplicar el aviso con una notificación del sistema encima.
  if (document.visibilityState === 'visible') return;

  // `tag` colapsa avisos repetidos en una sola notificación en vez de apilarlos si
  // escalan/transfieren varias conversaciones seguidas.
  const notification = new Notification(title, { body, tag });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Una única conexión SSE compartida por toda la sesión (montada en AppShell) hacia
 * `/api/conversations/events/stream`, que reenvía sin materializar el stream de
 * `ConversationRealtimeController` (api-crmws). Expone las señales que consumen
 * {@link useConversationsSignal}/{@link useContactsSignal}/{@link useConversationsPollTick} —
 * los hooks de la bandeja (`useConversationsList`, `useWaitingConversationsCount`,
 * `useMineConversationsCount`) las leen para refrescar de inmediato en vez de esperar el
 * próximo ciclo de polling de seguridad.
 *
 * También dispara una notificación del navegador (`Notification` API) por cada aviso de
 * `conversation.waiting`/`.transferred` recibido mientras la pestaña no está visible — si
 * el asesor ya está mirando la bandeja, el badge/lista que refresca `conversationsSignal`
 * ya es aviso suficiente. `conversation.taken`/`.released` no disparan notificación: no son
 * una alerta que requiera atención, solo el aviso de que otra bandeja ya abierta debe
 * reflejar el movimiento del chat.
 *
 * Con el permiso concedido, además suscribe el navegador a Web Push
 * (`pushSubscriptionClient.ts`) — a diferencia de la notificación de arriba, esa
 * sí llega con la pestaña o el navegador cerrados, mientras el backend tenga
 * `app.push.vapid.*` configurado.
 */
export function ConversationRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [conversationsSignal, setConversationsSignal] = useState(0);
  const [contactsSignal, setContactsSignal] = useState(0);
  const [pollTick, setPollTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPollTick((n) => n + 1), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      subscribeToPush();
      return;
    }
    // Pedirlo una sola vez al montar la sesión — si el asesor lo niega, no se
    // vuelve a insistir (Notification.permission queda en "denied", no "default").
    if (Notification.permission === 'default') {
      Notification.requestPermission()
        .then((permission) => {
          if (permission === 'granted') subscribeToPush();
        })
        .catch(() => {
          // el navegador rechazó la solicitud (p. ej. fuera de un gesto del usuario) — sin notificación, el polling sigue cubriendo esto
        });
    }
  }, []);

  useEffect(() => {
    if (!getSession()) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    function handleRawEvent(rawEvent: string) {
      let eventName = 'message';
      let data = '';
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
        if (line.startsWith('data:')) data += line.slice(5).trim();
      }

      if (eventName === 'conversation.waiting') {
        setConversationsSignal((n) => n + 1);
        setContactsSignal((n) => n + 1);
        notifyBrowser('Conversación en espera', 'Un contacto necesita la atención de un asesor.', 'conversation-waiting');
        return;
      }

      if (eventName === 'conversation.taken' || eventName === 'conversation.released') {
        setConversationsSignal((n) => n + 1);
        return;
      }

      if (eventName === 'conversation.transferred') {
        setConversationsSignal((n) => n + 1);
        try {
          const payload = JSON.parse(data) as { targetMembershipId?: string };
          const myMembershipId = getSession()?.user.membershipId;
          if (myMembershipId && payload.targetMembershipId === myMembershipId) {
            notifyBrowser('Conversación transferida', 'Te transfirieron una conversación.', 'conversation-transferred');
          }
        } catch {
          // payload inesperado — sin notificación puntual, el refresco de "Mías" ya cubrió el aviso
        }
      }
    }

    async function connect() {
      if (cancelled) return;
      // Relee la sesión en cada intento — AuthContext renueva el access token en segundo
      // plano (ver AuthContext.tsx) y esta conexión debe usar el token vigente en vez de
      // quedarse con el de cuando se montó el provider, o reintentaría para siempre con un
      // token ya expirado (WARN "Token de acceso rechazado" repetido cada RECONNECT_DELAY_MS).
      const session = getSession();
      if (!session) return; // sesión cerrada — nada que reconectar, ni programar otro intento
      controller = new AbortController();
      try {
        const response = await fetch(`${BASE_PATH}/api/conversations/events/stream`, {
          headers: { Authorization: `Bearer ${session.accessToken}` },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error(`stream ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!cancelled) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let separatorIndex;
          while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
            handleRawEvent(buffer.slice(0, separatorIndex));
            buffer = buffer.slice(separatorIndex + 2);
          }
        }
      } catch {
        // conexión caída o sin soporte de streaming — el polling de cada hook sigue cubriendo esto
      }
      if (!cancelled) {
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    }

    connect();

    return () => {
      cancelled = true;
      controller?.abort();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <ConversationRealtimeContext.Provider value={{ conversationsSignal, contactsSignal, pollTick }}>
      {children}
    </ConversationRealtimeContext.Provider>
  );
}

/**
 * Cambia con cualquier aviso que mueva una conversación de una lista a otra
 * (`conversation.waiting`/`.taken`/`.released`/`.transferred`) — ver {@link ConversationRealtimeProvider}.
 */
export function useConversationsSignal(): number {
  return useContext(ConversationRealtimeContext).conversationsSignal;
}

/** Cambia solo con `conversation.waiting` (posible contacto nuevo) — ver {@link ConversationRealtimeProvider}. */
export function useContactsSignal(): number {
  return useContext(ConversationRealtimeContext).contactsSignal;
}

/** Red de seguridad de polling, compartida por todos los hooks de la bandeja — ver {@link ConversationRealtimeProvider}. */
export function useConversationsPollTick(): number {
  return useContext(ConversationRealtimeContext).pollTick;
}
