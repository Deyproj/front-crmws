/* Service worker mínimo para Web Push (ConversationPushSubscriptionController,
 * api-crmws). No cachea nada ni intercepta fetch — solo recibe el push (llega
 * aunque la pestaña/navegador esté cerrado) y enfoca/abre la pestaña al hacer
 * click. Si en el futuro se necesita una PWA instalable de verdad, este
 * archivo es el punto de partida, no uno nuevo.
 */
self.addEventListener('push', (event) => {
  let data = {
    title: 'Conversación en espera',
    body: 'Un contacto necesita la atención de un asesor.',
    url: '/',
  };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    // Mismo tag que la notificación disparada desde la pestaña (ConversationRealtimeContext)
    // — si ambas llegan (pestaña abierta pero oculta + push), el navegador reemplaza una con
    // la otra en vez de apilarlas. `renotify: false` evita que la sustitución vuelva a alertar.
    tag: 'conversation-waiting',
    renotify: false,
    data: { url: data.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

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
