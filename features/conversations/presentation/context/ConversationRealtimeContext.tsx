'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSession } from '@/lib/runtime/tokenStorage';
import { subscribeToPush } from './pushSubscriptionClient';

const ConversationRealtimeContext = createContext<number>(0);

const RECONNECT_DELAY_MS = 4000;

function notifyBrowser() {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  // La pestaña visible ya se entera por el badge/lista (useConversationWaitingSignal) —
  // evita duplicar el aviso con una notificación del sistema encima.
  if (document.visibilityState === 'visible') return;

  // `tag` colapsa avisos repetidos en una sola notificación en vez de apilarlos si
  // escalan varias conversaciones seguidas.
  const notification = new Notification('Conversación en espera', {
    body: 'Un contacto necesita la atención de un asesor.',
    tag: 'conversation-waiting',
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Una única conexión SSE compartida por toda la sesión (montada en AppShell) hacia
 * `/api/conversations/events/stream`, que reenvía sin materializar el stream de
 * `ConversationRealtimeController` (api-crmws). Expone solo un contador que se
 * incrementa con cada aviso `conversation.waiting` recibido — los hooks que
 * necesitan reaccionar (`useWaitingConversationsCount`, `useConversationsList`) lo
 * leen con {@link useConversationWaitingSignal} y refrescan de inmediato en vez de
 * esperar el próximo ciclo de polling. El polling sigue activo como red de
 * seguridad si el stream no conecta (navegador viejo, proxy que no soporta
 * streaming, backend con más de una réplica sin sticky sessions).
 *
 * También dispara una notificación del navegador (`Notification` API) por cada
 * aviso recibido mientras la pestaña no está visible — si el asesor ya está
 * mirando la bandeja, el badge/lista que refresca `useConversationWaitingSignal`
 * ya es aviso suficiente, la notificación del sistema sería ruido redundante.
 *
 * Con el permiso concedido, además suscribe el navegador a Web Push
 * (`pushSubscriptionClient.ts`) — a diferencia de la notificación de arriba, esa
 * sí llega con la pestaña o el navegador cerrados, mientras el backend tenga
 * `app.push.vapid.*` configurado.
 */
export function ConversationRealtimeProvider({ children }: { children: React.ReactNode }) {
  const [signal, setSignal] = useState(0);

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
    const session = getSession();
    if (!session) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    function handleRawEvent(rawEvent: string) {
      let eventName = 'message';
      for (const line of rawEvent.split('\n')) {
        if (line.startsWith('event:')) eventName = line.slice(6).trim();
      }
      if (eventName === 'conversation.waiting') {
        setSignal((n) => n + 1);
        notifyBrowser();
      }
    }

    async function connect() {
      if (cancelled) return;
      controller = new AbortController();
      try {
        const response = await fetch('/api/conversations/events/stream', {
          headers: { Authorization: `Bearer ${session!.accessToken}` },
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

  return <ConversationRealtimeContext.Provider value={signal}>{children}</ConversationRealtimeContext.Provider>;
}

/** Cambia cada vez que llega un aviso `conversation.waiting` por SSE — ver {@link ConversationRealtimeProvider}. */
export function useConversationWaitingSignal(): number {
  return useContext(ConversationRealtimeContext);
}
