'use client';

import { useEffect, useState } from 'react';
import { subscribeToPush } from '../context/pushSubscriptionClient';

const DISMISSED_KEY = 'crmws.notificationBannerDismissed';

function readDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Aviso para activar las notificaciones del navegador con un clic real del asesor.
 *
 * Pedir el permiso automáticamente al abrir la sesión (sin gesto del usuario) hace que
 * Chrome lo muestre solo como un ícono discreto en la barra de direcciones y otros
 * navegadores lo ignoren por completo — el asesor terminaba sin notificaciones sin
 * enterarse. Y el permiso se guarda por dominio: un dominio nuevo (p. ej. tras una
 * migración) vuelve a empezar en "default". Solo se muestra en ese estado; si el asesor lo
 * bloqueó ("denied") no se insiste, el navegador ya no deja volver a preguntar desde código.
 */
export function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'default' || readDismissed()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
  }, []);

  if (!visible) return null;

  async function enable() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') await subscribeToPush();
    } catch {
      // el navegador rechazó la solicitud — el polling de la bandeja sigue cubriendo el aviso
    }
    setVisible(false);
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // sin sessionStorage el aviso vuelve a aparecer al recargar; no es grave
    }
    setVisible(false);
  }

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center gap-x-[var(--space-6)] gap-y-[var(--space-3)] border-b border-border bg-warning-bg px-[var(--space-7)] py-[var(--space-4)]"
    >
      <p className="min-w-0 flex-1 text-sm text-ink">
        Activa las notificaciones para enterarte cuando un contacto necesite un asesor, incluso con esta pestaña cerrada.
      </p>
      <div className="flex shrink-0 items-center gap-[var(--space-4)]">
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md px-3 py-1.5 text-sm text-secondary hover:bg-app hover:text-ink"
        >
          Ahora no
        </button>
        <button
          type="button"
          onClick={enable}
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-on-brand hover:bg-brand-hover"
        >
          Activar notificaciones
        </button>
      </div>
    </div>
  );
}
