'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getOrganization,
  setAutomatedMessagingEnabled,
  updateReminderSchedule,
  type Organization,
  type ReminderScheduleInput,
} from '@/features/organization';

export function useReminderSchedule() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrganization(await getOrganization());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la organización');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function update(partial: Partial<ReminderScheduleInput>) {
    if (!organization) return;
    setActionPending(true);
    setError(null);
    try {
      setOrganization(
        await updateReminderSchedule({
          courtesyReminderEnabled: organization.courtesyReminderEnabled,
          followUpReminderEnabled: organization.followUpReminderEnabled,
          satisfactionSurveyEnabled: organization.satisfactionSurveyEnabled,
          satisfactionSurveyMessage: organization.satisfactionSurveyMessage,
          dailyReminderHour: organization.dailyReminderHour,
          courtesyReminderTemplateId: organization.courtesyReminderTemplateId,
          gymSoftReminderEnabled: organization.gymSoftReminderEnabled,
          ...partial,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el recordatorio');
    } finally {
      setActionPending(false);
    }
  }

  /** Pausa general (BR-036) — mismo estado que `update` para que las tarjetas vean el cambio al instante. */
  async function setAutomatedMessaging(enabled: boolean) {
    setActionPending(true);
    setError(null);
    try {
      setOrganization(await setAutomatedMessagingEnabled(enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la pausa de envíos automáticos');
    } finally {
      setActionPending(false);
    }
  }

  return { organization, loading, actionPending, error, update, setAutomatedMessaging };
}
