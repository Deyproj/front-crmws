'use client';

import { useCallback, useEffect, useState } from 'react';
import { listSatisfactionSurveys, type SatisfactionSurvey } from '@/features/feedback';
import { getContactsByIds, type Contact } from '@/features/contacts';

export interface SatisfactionSurveyItem {
  survey: SatisfactionSurvey;
  contact: Contact | null;
}

export function useSatisfactionSurveys() {
  const [items, setItems] = useState<SatisfactionSurveyItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await listSatisfactionSurveys(targetPage);
      // Solo los contactos de la página visible, por id (ver useAgenda).
      const contacts = await getContactsByIds(result.content.map((s) => s.contactId));
      const contactsById = new Map(contacts.map((c) => [c.id, c]));
      setItems(result.content.map((survey) => ({ survey, contact: contactsById.get(survey.contactId) ?? null })));
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las encuestas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
  }, [load, page]);

  return { items, page, totalPages, loading, error, goToPage: setPage, reload: () => load(page) };
}
