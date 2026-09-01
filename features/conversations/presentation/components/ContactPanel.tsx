'use client';

import { useState } from 'react';
import type { Contact } from '@/features/contacts';
import { LIFECYCLE_STAGE_LABELS, updateContactProfile } from '@/features/contacts';
import type { Conversation } from '@/features/conversations';
import { initials } from '@/lib/utils/initials';
import { StageActions } from '@/features/opportunities/presentation/components/StageActions';
import { OpportunityHistory } from '@/features/opportunities/presentation/components/OpportunityHistory';
import { AppointmentsSection } from '@/features/appointments/presentation/components/AppointmentsSection';
import { useConversationSummary } from '../hooks/useConversationSummary';
import { XIcon } from '@/components/ui/icons';

const INTENT_LABELS: Record<string, string> = {
  INFO: 'Busca información',
  VISITA: 'Quiere agendar una visita',
  INSCRIPCION: 'Quiere inscribirse',
};

/**
 * En pantallas <lg es un drawer que se desliza desde la derecha (controlado por
 * `mobileOpen`/`onClose`, disparado por el botón de info de ChatPanel); en lg+ vuelve
 * a ser la columna fija de siempre. Ver docs/07-frontend/00-vision-and-scope.md#responsive.
 */
export function ContactPanel({
  contact,
  conversation,
  onContactChanged,
  mobileOpen = false,
  onClose,
}: {
  contact: Contact | null;
  conversation: Conversation | null;
  onContactChanged: (contact: Contact) => void;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const summaryState = useConversationSummary(conversation?.id ?? null);

  if (!contact) {
    return <aside className="hidden w-[280px] shrink-0 border-l border-border bg-surface lg:block" />;
  }

  function handleStageChanged(updated: Contact) {
    onContactChanged(updated);
    setHistoryRefreshKey((k) => k + 1);
  }

  const hasQualification =
    contact.qualificationGoal || contact.qualificationSchedule || contact.qualificationPlanOfInterest || contact.qualificationIntent;
  const canSummarize = !!conversation && conversation.mode !== 'AI';

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-[320px] flex-col gap-[var(--space-9)] overflow-y-auto border-l border-border bg-surface p-[var(--space-8)] transition-transform duration-[var(--duration-base)] ease-[var(--ease-expressive)] lg:static lg:z-auto lg:flex lg:w-[280px] lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar información del contacto"
          className="self-end rounded-md p-2 text-secondary hover:bg-app hover:text-ink lg:hidden"
        >
          <XIcon className="size-[18px]" />
        </button>
        <div className="flex flex-col items-center gap-[var(--space-6)] text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-on-brand">
            {initials(contact.name, contact.phone)}
          </div>
          <ContactName contact={contact} onContactChanged={onContactChanged} />
          <span className="rounded-full bg-info-bg px-[var(--space-5)] py-1 text-xs font-semibold uppercase text-info">
            {LIFECYCLE_STAGE_LABELS[contact.lifecycleStage]}
          </span>
        </div>

        <div className="flex flex-col gap-[var(--space-6)]">
          <p className="text-xs font-semibold uppercase text-muted">Detalle del contacto</p>
          <Field label="Teléfono" value={contact.phone} />
          {contact.email && <Field label="Correo" value={contact.email} />}
          <Field
            label="Último contacto"
            value={new Date(contact.lastInteractionAt).toLocaleString('es-CO', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>

        {hasQualification && (
          <div className="flex flex-col gap-[var(--space-6)]">
            <p className="text-xs font-semibold uppercase text-muted">Calificación</p>
            {contact.qualificationGoal && <Field label="Objetivo" value={contact.qualificationGoal} />}
            {contact.qualificationSchedule && <Field label="Horario" value={contact.qualificationSchedule} />}
            {contact.qualificationPlanOfInterest && <Field label="Plan de interés" value={contact.qualificationPlanOfInterest} />}
            {contact.qualificationIntent && (
              <Field label="Intención" value={INTENT_LABELS[contact.qualificationIntent] ?? contact.qualificationIntent} />
            )}
          </div>
        )}

        {canSummarize && (
          <div className="flex flex-col gap-[var(--space-5)]">
            <p className="text-xs font-semibold uppercase text-muted">Resumen para el asesor</p>
            {summaryState.summary ? (
              <p className="rounded-md bg-app p-[var(--space-6)] text-sm text-ink">{summaryState.summary}</p>
            ) : (
              <button
                type="button"
                onClick={summaryState.generate}
                disabled={summaryState.loading}
                className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
              >
                {summaryState.loading ? 'Generando...' : 'Generar resumen'}
              </button>
            )}
            {summaryState.error && <p className="text-xs text-danger">{summaryState.error}</p>}
          </div>
        )}

        <div className="flex flex-col gap-[var(--space-6)]">
          <p className="text-xs font-semibold uppercase text-muted">Etapa comercial</p>
          <StageActions contact={contact} onChanged={handleStageChanged} />
        </div>

        <div className="flex flex-col gap-[var(--space-6)]">
          <p className="text-xs font-semibold uppercase text-muted">Cortesías</p>
          <AppointmentsSection contactId={contact.id} refreshKey={historyRefreshKey} />
        </div>

        <div className="flex flex-col gap-[var(--space-6)]">
          <p className="text-xs font-semibold uppercase text-muted">Historial de oportunidades</p>
          <OpportunityHistory contactId={contact.id} refreshKey={historyRefreshKey} />
        </div>
      </aside>
    </>
  );
}

/**
 * Nombre del contacto con edición en línea para el asesor — el mismo dato
 * que el agente de IA puede confirmar y guardar automáticamente durante la
 * conversación (ver AgentMessagePersistenceService#recordReply en el
 * backend), pero aquí el asesor puede corregirlo o completarlo a mano.
 */
function ContactName({
  contact,
  onContactChanged,
}: {
  contact: Contact;
  onContactChanged: (contact: Contact) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(contact.name ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showPushNameHint = !!contact.pushName && contact.pushName !== contact.name;

  if (!editing) {
    return (
      <div className="flex flex-col items-center gap-[2px]">
        <button
          type="button"
          onClick={() => {
            setName(contact.name ?? '');
            setError(null);
            setEditing(true);
          }}
          className="text-base font-bold text-ink hover:underline"
          title="Editar nombre"
        >
          {contact.name || contact.phone}
        </button>
        {showPushNameHint && (
          <button
            type="button"
            onClick={() => {
              setName(contact.pushName ?? '');
              setError(null);
              setEditing(true);
            }}
            className="text-xs text-muted hover:underline"
            title="Usar este nombre"
          >
            En WhatsApp aparece como &ldquo;{contact.pushName}&rdquo;
          </button>
        )}
      </div>
    );
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('El nombre no puede estar vacío');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const updated = await updateContactProfile(contact.id, trimmed, contact.email);
      onContactChanged(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el nombre');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-[var(--space-4)]">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setEditing(false);
        }}
        disabled={pending}
        className="rounded-md border border-border bg-app px-3 py-2 text-center text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex justify-center gap-[var(--space-4)]">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
        >
          {pending ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setEditing(false)}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="text-[11px] text-secondary">{label}</p>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
