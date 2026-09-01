'use client';

import { useCallback, useEffect, useState } from 'react';
import { countConversations } from '@/features/conversations';
import { useConversationMineSignal } from '../context/ConversationRealtimeContext';

const POLL_INTERVAL_MS = 8000;

/**
 * Cuántas conversaciones tiene asignadas el asesor actual — sin importar la pestaña
 * activa en la bandeja. Es un indicador secundario: si falla, se ignora en silencio
 * en vez de romper la navegación o la bandeja.
 */
export function useMineConversationsCount(membershipId: string | null | undefined) {
  const [count, setCount] = useState(0);
  const mineSignal = useConversationMineSignal();

  const load = useCallback(async () => {
    if (!membershipId) {
      setCount(0);
      return;
    }
    try {
      setCount(await countConversations({ assignedTo: membershipId }));
    } catch {
      // indicador secundario — un fallo aquí no debe interrumpir al asesor
    }
  }, [membershipId]);

  useEffect(() => {
    // Carga inicial + refresco periódico, mismo patrón que useWaitingConversationsCount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    // Aviso en tiempo real (conversation.transferred): adelanta el refresco en vez de
    // esperar el próximo ciclo de polling, tanto para quien recibe como para quien
    // pierde la conversación transferida.
    if (mineSignal === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [mineSignal, load]);

  return count;
}
