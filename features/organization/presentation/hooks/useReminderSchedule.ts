'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getOrganization,
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
          dailyReminderHour: organization.dailyReminderHour,
          courtesyReminderTemplateId: organization.courtesyReminderTemplateId,
          ...partial,
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el recordatorio');
    } finally {
      setActionPending(false);
    }
  }

  return { organization, loading, actionPending, error, update };
}
