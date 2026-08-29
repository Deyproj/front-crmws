'use client';

import { useCallback, useEffect, useState } from 'react';
import { countConversations } from '@/features/conversations';

const POLL_INTERVAL_MS = 8000;

/**
 * Cuántas conversaciones están en status WAITING (esperando un asesor) — sin importar
 * la pestaña activa en la bandeja. Es un indicador secundario: si falla, se ignora en
 * silencio en vez de romper la navegación o la bandeja.
 */
export function useWaitingConversationsCount() {
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    try {
      setCount(await countConversations({ status: 'WAITING' }));
    } catch {
      // indicador secundario — un fallo aquí no debe interrumpir al asesor
    }
  }, []);

  useEffect(() => {
    // Carga inicial + refresco periódico, mismo patrón que useConversationsList.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  return count;
}
