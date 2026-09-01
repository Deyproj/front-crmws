'use client';

import { useState } from 'react';
import { changeLifecycleStage, type Contact, type ContactLifecycleStage } from '@/features/contacts';

/** Próximas etapas válidas desde la etapa actual del contacto — mismas reglas que
 * Opportunity.ALLOWED_TRANSITIONS en el backend, más el reingreso confirmado con el negocio
 * (ver docs/02-requirements/opportunity-stages-draft-dinamo-fitness.md, pregunta 5).
 * 'QUALIFIED' no es una acción que el asesor elija aparte — es un paso de tránsito interno del
 * backend (decisión de producto 2026-08-31: un botón "Calificar" separado se consideró
 * sobreingeniería). Por eso ni LEAD ni un reingreso ofrecen 'QUALIFIED': el asesor califica
 * directo al elegir una de las 3 acciones reales. */
const NEXT_STAGES: Record<ContactLifecycleStage, Exclude<ContactLifecycleStage, 'LEAD'>[]> = {
  LEAD: ['OPPORTUNITY', 'CUSTOMER', 'LOST'],
  QUALIFIED: ['OPPORTUNITY', 'CUSTOMER', 'LOST'],
  OPPORTUNITY: ['CUSTOMER', 'LOST'],
  CUSTOMER: ['OPPORTUNITY', 'CUSTOMER', 'LOST'],
  LOST: ['OPPORTUNITY', 'CUSTOMER', 'LOST'],
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
