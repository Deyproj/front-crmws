import { getSession } from '@/lib/runtime/tokenStorage';

const PUSH_SW_PATH = '/push-sw.js';
const PUBLIC_KEY_PATH = '/api/conversations/events/push/public-key';
const SUBSCRIPTIONS_PATH = '/api/conversations/events/push/subscriptions';

// Convierte la clave VAPID (base64url) al formato que espera pushManager.subscribe.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function authHeader(): string | null {
  const session = getSession();
  return session ? `Bearer ${session.accessToken}` : null;
}

/**
 * Suscribe este navegador a Web Push y registra la suscripción en el backend
 * (`ConversationPushSubscriptionController`). Requiere que el permiso de
 * `Notification` ya esté concedido — quien llama (`ConversationRealtimeProvider`)
 * es responsable de pedirlo antes. Falla en silencio: sin Web Push, la
 * notificación de la pestaña abierta y el polling siguen cubriendo el aviso.
 */
export async function subscribeToPush(): Promise<void> {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  const auth = authHeader();
  if (!auth) return;

  try {
    const registration = await navigator.serviceWorker.register(PUSH_SW_PATH);
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const response = await fetch(PUBLIC_KEY_PATH, { headers: { Authorization: auth } });
      if (!response.ok) return;
      const { publicKey } = (await response.json()) as { publicKey: string };
      if (!publicKey) return; // Web Push deshabilitado en el backend (sin VAPID configurado)

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    const json = subscription.toJSON();
    await fetch(SUBSCRIPTIONS_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      }),
    });
  } catch {
    // sin soporte real, permiso revocado a mitad de camino, clave VAPID inválida, etc.
  }
}

/** Da de baja la suscripción de este navegador — llamar antes de limpiar la sesión al cerrarla. */
export async function unsubscribeFromPush(): Promise<void> {
  if (!isPushSupported()) return;
  const auth = authHeader();

  try {
    const registration = await navigator.serviceWorker.getRegistration(PUSH_SW_PATH);
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await fetch(SUBSCRIPTIONS_PATH, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) },
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // best-effort — una suscripción caducada igual se limpia sola del lado del backend (404/410)
  }
}
