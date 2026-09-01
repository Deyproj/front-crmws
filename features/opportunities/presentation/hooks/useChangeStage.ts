'use client';

import { useState } from 'react';
import { changeLifecycleStage, type Contact, type ContactLifecycleStage } from '@/features/contacts';

/** Próximas etapas válidas desde la etapa actual del contacto — mismas reglas que
 * Opportunity.ALLOWED_TRANSITIONS en el backend, más el reingreso confirmado con el negocio
 * (ver docs/02-requirements/opportunity-stages-draft-dinamo-fitness.md, pregunta 5). */
const NEXT_STAGES: Record<ContactLifecycleStage, Exclude<ContactLifecycleStage, 'LEAD'>[]> = {
  // 'QUALIFIED' exige plan y horario confirmados (ver ChangeOpportunityStageHandler en el
  // backend); 'LOST' es la salida directa para un lead que nunca da esos datos porque deja de
  // responder o dice explícitamente que no le interesa — no necesita "calificarse" primero.
  LEAD: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['OPPORTUNITY', 'CUSTOMER', 'LOST'],
  OPPORTUNITY: ['CUSTOMER', 'LOST'],
  CUSTOMER: ['QUALIFIED'],
  LOST: ['QUALIFIED'],
};

export function nextStages(current: ContactLifecycleStage): Exclude<ContactLifecycleStage, 'LEAD'>[] {
  return NEXT_STAGES[current];
}

export function useChangeStage(onChanged: (contact: Contact) => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStage(contactId: string, target: Exclude<ContactLifecycleStage, 'LEAD'>, lostReason?: string) {
    setPending(true);
    setError(null);
    try {
      const updated = await changeLifecycleStage(contactId, target, lostReason);
      onChanged(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la etapa');
    } finally {
      setPending(false);
    }
  }

  return { changeStage, pending, error };
}
