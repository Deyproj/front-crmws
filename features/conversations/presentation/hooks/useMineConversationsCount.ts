'use client';

import { useCallback, useEffect, useState } from 'react';
import { countConversations } from '@/features/conversations';
import { useConversationsPollTick, useConversationsSignal } from '../context/ConversationRealtimeContext';

/**
 * Cuántas conversaciones tiene asignadas el asesor actual — sin importar la pestaña
 * activa en la bandeja. Es un indicador secundario: si falla, se ignora en silencio
 * en vez de romper la navegación o la bandeja.
 */
export function useMineConversationsCount(membershipId: string | null | undefined) {
  const [count, setCount] = useState(0);
  const conversationsSignal = useConversationsSignal();
  const pollTick = useConversationsPollTick();

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
    // Carga inicial.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  useEffect(() => {
    // conversation.waiting/.taken/.released/.transferred: adelanta el refresco en vez de
    // esperar el próximo poll de seguridad — cualquiera de los cuatro puede afectar "Mías",
    // tanto para quien gana como para quien pierde la conversación.
    if (conversationsSignal === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [conversationsSignal, load]);

  useEffect(() => {
    // Red de seguridad si el SSE no conectó, sincronizada con el resto de la bandeja.
    if (pollTick === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [pollTick, load]);

  return count;
}
