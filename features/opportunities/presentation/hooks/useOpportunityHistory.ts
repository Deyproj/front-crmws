'use client';

import { useEffect, useState } from 'react';
import { listOpportunities, type Opportunity } from '@/features/opportunities';

/**
 * `refreshKey` fuerza un refetch sin depender de `contactId` (que no cambia cuando la etapa
 * de un contacto se actualiza) — el llamador lo incrementa tras un cambio de etapa exitoso.
 */
export function useOpportunityHistory(contactId: string | null, refreshKey: number = 0) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!contactId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpportunities([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listOpportunities(contactId)
      .then((result) => {
        if (!cancelled) setOpportunities(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId, refreshKey]);

  return { opportunities, loading };
}
