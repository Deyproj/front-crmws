'use client';

import { useCallback, useEffect, useState } from 'react';
import { listSatisfactionSurveys, type SatisfactionSurvey } from '@/features/feedback';
import { listContacts, type Contact } from '@/features/contacts';

export interface SatisfactionSurveyItem {
  survey: SatisfactionSurvey;
  contact: Contact | null;
}

export function useSatisfactionSurveys() {
  const [items, setItems] = useState<SatisfactionSurveyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [surveys, contacts] = await Promise.all([listSatisfactionSurveys(), listContacts()]);
      const contactsById = new Map(contacts.map((c) => [c.id, c]));
      setItems(surveys.map((survey) => ({ survey, contact: contactsById.get(survey.contactId) ?? null })));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las encuestas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
