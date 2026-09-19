/* Service worker mínimo para Web Push (ConversationPushSubscriptionController,
 * api-crmws). No cachea nada ni intercepta fetch — solo recibe el push (llega
 * aunque la pestaña/navegador esté cerrado) y enfoca/abre la pestaña al hacer
 * click. Si en el futuro se necesita una PWA instalable de verdad, este
 * archivo es el punto de partida, no uno nuevo.
 *
 * El diseño de la tarjeta lo dibuja el sistema operativo; aquí solo se controlan el
 * ícono, el badge (monocromo, barra de estado de Android), el texto, los botones y
 * el comportamiento (vibración, permanecer hasta que se atienda).
 */

// Las rutas se resuelven contra el scope del SW en vez de hardcodear "/crmws/" o "/" —
// así sirven igual con y sin NEXT_BASE_PATH.
const ICON_URL = new URL('push-icon.png', self.registration.scope).href;
const BADGE_URL = new URL('push-badge.png', self.registration.scope).href;

self.addEventListener('push', (event) => {
  let data = {
    title: 'Conversación en espera',
    body: 'Un contacto necesita la atención de un asesor.',
    url: '/',
    tag: 'conversation-waiting',
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: ICON_URL,
    badge: BADGE_URL,
    // El backend manda un tag por conversación (`conversation-<id>`), el mismo que usa la
    // notificación de la pestaña (ConversationRealtimeContext) — si ambas llegan (pestaña
    // abierta pero oculta + push) el navegador reemplaza una con la otra en vez de apilarlas,
    // y dos chats distintos no se pisan entre sí. `renotify: false` evita que la sustitución
    // vuelva a alertar.
    tag: data.tag,
    renotify: false,
    // No se cierra sola: el aviso debe seguir ahí hasta que alguien lo atienda.
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [{ action: 'open', title: 'Abrir chat' }],
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Tanto el clic en la tarjeta como el botón "Abrir chat" llevan a la misma conversación.
  const targetUrl = new URL(event.notification.data?.url || '/', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
