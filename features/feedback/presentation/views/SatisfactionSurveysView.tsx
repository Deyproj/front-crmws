'use client';

import { useSatisfactionSurveys } from '../hooks/useSatisfactionSurveys';
import { SURVEY_STATUS_LABELS } from '@/features/feedback';
import { initials } from '@/lib/utils/initials';
import { MessageSquareIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';

export function SatisfactionSurveysView() {
  const { items, loading, error } = useSatisfactionSurveys();

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <p className="max-w-3xl text-sm text-secondary">
        Encuesta corta enviada automáticamente por WhatsApp cuando un caso se cierra como ganado o pasa a seguimiento
        (BR-028). La respuesta se guarda tal cual la escribe el contacto — no se interpreta ni se resume.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-secondary">Cargando...</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareIcon className="size-6" />}
          title="Sin encuestas todavía"
          description="Se envían solas cuando una oportunidad se marca como ganada o pasa a seguimiento."
        />
      ) : (
        <div className="flex flex-col gap-[var(--space-4)]">
          {items.map(({ survey, contact }) => (
            <div
              key={survey.id}
              className="flex flex-wrap items-start gap-[var(--space-6)] rounded-xl border border-border bg-surface p-[var(--space-7)]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
                {initials(contact?.name, contact?.phone ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-[var(--space-4)]">
                  <p className="truncate text-sm font-semibold text-ink">
                    {contact?.name || contact?.phone || 'Contacto sin nombre'}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-[var(--space-4)] py-[var(--space-1)] text-xs font-semibold ${
                      survey.status === 'ANSWERED' ? 'bg-success/15 text-success' : 'bg-app text-secondary'
                    }`}
                  >
                    {SURVEY_STATUS_LABELS[survey.status]}
                  </span>
                  <p className="shrink-0 text-xs text-muted">
                    {new Date(survey.sentAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                {survey.rawAnswer && <p className="mt-[var(--space-3)] text-sm text-secondary">&quot;{survey.rawAnswer}&quot;</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
