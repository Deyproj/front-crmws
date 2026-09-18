'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listOrganizationTemplates, type MessageTemplate, type TemplateCategory } from '@/features/channel';
import type { AutomationKind } from '@/features/automation';
import type { Organization, ReminderScheduleInput } from '@/features/organization';
import { useReminderSchedule } from '../hooks/useReminderSchedule';
import { FollowUpMessageRulesView } from '@/features/followups/presentation/views/FollowUpMessageRulesView';
import { GymSoftClientsDialog } from '@/features/gymsoft/presentation/components/GymSoftClientsDialog';
import { GymSoftReminderRulesView } from '@/features/gymsoft/presentation/components/GymSoftReminderRulesView';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

/** Mismo texto que `SatisfactionSurveyDirectoryServiceImpl.DEFAULT_QUESTIONS_TEXT` en api-crmws — se muestra como placeholder cuando la organización no lo personalizó. */
const DEFAULT_SATISFACTION_SURVEY_MESSAGE =
  'Antes de terminar, nos gustaría conocer tu opinión:\n' +
  '1. ¿Tu consulta fue resuelta?\n' +
  '2. ¿Cómo calificarías la atención recibida, de 1 a 5?\n' +
  '3. ¿Deseas que te contacte un asesor?\n\n' +
  'Puedes responder este mismo mensaje con lo que gustes, ¡gracias por tu tiempo!';

const labelClass = 'mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary';
const selectClass =
  'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50';

type Update = (partial: Partial<ReminderScheduleInput>) => void;

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Configuración → Automatizaciones (`/settings/automations`). Hasta el 2026-09-16 todo esto era una
 * sola tarjeta (`ReminderScheduleSettings`, dentro de Agente → Automatización) que además incluía el
 * historial de envíos; ahora es una tarjeta por automatización y el historial vive en Reportes
 * (cada tarjeta enlaza a su propio filtro). Horario configurable desde BR-027 — ver
 * UpdateReminderScheduleHandler en api-crmws.
 *
 * Una sola instancia de `useReminderSchedule` para todas las tarjetas, a propósito: el PATCH del
 * backend exige todos los campos juntos y el hook los completa con su copia de `organization` —
 * con una instancia por tarjeta, cada una reenviaría valores viejos y pisaría los cambios de las demás.
 */
export function AutomationSettingsView() {
  const { organization, loading, actionPending, error, update, setAutomatedMessaging, setAutoReleaseConversations } =
    useReminderSchedule();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    listOrganizationTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;
  if (!organization) return error ? <p className="text-sm text-danger">{error}</p> : null;

  const paused = !organization.automatedMessagingEnabled;

  return (
    <>
      <p className="max-w-3xl text-sm text-secondary">
        Mensajes que el sistema envía solo por WhatsApp. Son independientes de las respuestas del agente de IA, que se
        pausan en <Link href="/settings/agent" className="font-semibold text-brand hover:underline">Agente IA → General</Link>.
      </p>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <AutomatedMessagingPauseCard paused={paused} actionPending={actionPending} onChange={setAutomatedMessaging} />

      <AutoReleaseConversationsCard
        organization={organization}
        actionPending={actionPending}
        onChange={setAutoReleaseConversations}
      />

      {/* Atenuadas, no deshabilitadas: durante la pausa se pueden seguir ajustando para cuando se reanude. */}
      <div className={`flex flex-col gap-[var(--space-7)] transition-opacity ${paused ? 'opacity-60' : ''}`}>
        <AutomationCard
          title="Hora de envío"
          description={`Recordatorio de cortesía, mensajes de seguimiento y vencimiento de plan corren una vez al día, a esta hora local (${organization.timezone}).`}
        >
          <select
            id="dailyReminderHour"
            aria-label="Hora del día"
            value={organization.dailyReminderHour}
            onChange={(e) => update({ dailyReminderHour: Number(e.target.value) })}
            disabled={actionPending}
            className={`${selectClass} max-w-[160px]`}
          >
            {HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {formatHour(hour)}
              </option>
            ))}
          </select>
        </AutomationCard>

        <AutomationCard
          title="Recordatorio de cortesía"
          description="Avisa a quien tiene cita agendada para el día siguiente."
          historyKind="COURTESY_REMINDER"
          toggle={{
            checked: organization.courtesyReminderEnabled,
            disabled: actionPending,
            onChange: (checked) => update({ courtesyReminderEnabled: checked }),
          }}
        >
          <TemplateSelect
            id="courtesyReminderTemplateId"
            label="Plantilla de Meta (fuera de la ventana de 24h)"
            emptyLabel="Ninguna — se omite el envío fuera de la ventana de 24h"
            templates={templates}
            category="COURTESY_REMINDER"
            value={organization.courtesyReminderTemplateId}
            disabled={actionPending}
            onChange={(templateId) => update({ courtesyReminderTemplateId: templateId })}
          />
        </AutomationCard>

        <AutomationCard
          title="Mensajes de seguimiento"
          description="Reglas por umbral de días."
          historyKind="FOLLOW_UP"
          toggle={{
            checked: organization.followUpReminderEnabled,
            disabled: actionPending,
            onChange: (checked) => update({ followUpReminderEnabled: checked }),
          }}
        >
          <FollowUpMessageRulesView />
        </AutomationCard>

        <SatisfactionSurveyCard organization={organization} actionPending={actionPending} update={update} />

        <GymSoftReminderCard organization={organization} actionPending={actionPending} update={update} />
      </div>
    </>
  );
}

/**
 * Pausa general de envíos automáticos (BR-036, 2026-09-16). Existe porque "Respuestas automáticas"
 * (Agente IA → General) solo detiene al agente: con él pausado igual salió un recordatorio de
 * vencimiento de plan, y detener todo exigía apagar cada interruptor. Los interruptores de cada
 * tarjeta conservan su valor — al reanudar, cada automatización vuelve a como estaba.
 */
function AutomatedMessagingPauseCard({
  paused,
  actionPending,
  onChange,
}: {
  paused: boolean;
  actionPending: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <section
      className={`w-full rounded-xl border p-[var(--space-8)] ${paused ? 'border-warning/40 bg-warning-bg' : 'border-border bg-surface'}`}
    >
      <div className="mb-[var(--space-6)] flex items-start justify-between gap-[var(--space-5)]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">
            {paused ? 'Envíos automáticos en pausa' : 'Envíos automáticos activos'}
          </h2>
          <p className="text-xs text-secondary">
            {paused
              ? 'No sale ningún recordatorio, seguimiento, encuesta ni aviso de vencimiento de plan. Las difusiones masivas no se pausan acá: siguen su envío o su programación y se detienen cancelando la campaña en Difusión.'
              : 'Cada automatización respeta su propio interruptor. Pausar detiene todas a la vez sin perder esa configuración.'}
          </p>
        </div>
        <span className={`mt-1 size-3 shrink-0 rounded-full ${paused ? 'bg-warning' : 'bg-success'}`} />
      </div>

      {paused ? (
        <button
          type="button"
          onClick={() => onChange(true)}
          disabled={actionPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
        >
          Reanudar envíos automáticos
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onChange(false)}
          disabled={actionPending}
          className="rounded-md border border-danger/30 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
        >
          Pausar todos los envíos automáticos
        </button>
      )}

      {paused && (
        <p className="mt-[var(--space-5)] text-xs text-secondary">
          Mientras dure la pausa no se recuperan después los recordatorios de cortesía, vencimientos de plan ni encuestas
          de ese período; los mensajes de seguimiento pendientes sí salen al reanudar.
        </p>
      )}
    </section>
  );
}

/**
 * Liberación automática diaria de toda conversación en manos de un asesor de vuelta a la IA
 * (2026-09-17, a pedido explícito del usuario). No envía ningún mensaje al contacto — es una
 * reasignación interna — por eso vive fuera de la tarjeta de pausa de envíos automáticos de
 * arriba y con su propia hora, independiente de la hora de recordatorios.
 */
function AutoReleaseConversationsCard({
  organization,
  actionPending,
  onChange,
}: {
  organization: Organization;
  actionPending: boolean;
  onChange: (enabled: boolean, hour: number) => void;
}) {
  return (
    <AutomationCard
      title="Liberación automática de conversaciones"
      description={`No envía ningún mensaje al contacto — solo libera internamente a la IA toda conversación que un asesor tenga asignada, a esta hora local (${organization.timezone}). No se ve afectada por la pausa de envíos automáticos de arriba.`}
      toggle={{
        checked: organization.autoReleaseConversationsEnabled,
        disabled: actionPending,
        onChange: (checked) => onChange(checked, organization.autoReleaseConversationsHour),
      }}
    >
      <select
        id="autoReleaseConversationsHour"
        aria-label="Hora del día"
        value={organization.autoReleaseConversationsHour}
        onChange={(e) => onChange(organization.autoReleaseConversationsEnabled, Number(e.target.value))}
        disabled={actionPending}
        className={`${selectClass} max-w-[160px]`}
      >
        {HOURS.map((hour) => (
          <option key={hour} value={hour}>
            {formatHour(hour)}
          </option>
        ))}
      </select>
    </AutomationCard>
  );
}

function AutomationCard({
  title,
  description,
  historyKind,
  toggle,
  children,
}: {
  title: string;
  description: React.ReactNode;
  historyKind?: AutomationKind;
  toggle?: { checked: boolean; disabled: boolean; onChange: (checked: boolean) => void };
  children?: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex items-start justify-between gap-[var(--space-5)]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <div className="text-xs text-secondary">{description}</div>
          {historyKind && (
            <Link
              href={`/reports/automations?kind=${historyKind}`}
              className="mt-[var(--space-3)] inline-block text-xs font-semibold text-brand hover:underline"
            >
              Ver envíos en Reportes →
            </Link>
          )}
        </div>
        {toggle && <ToggleSwitch label={title} {...toggle} />}
      </div>
      {children && <div className="mt-[var(--space-7)] flex flex-col gap-[var(--space-6)]">{children}</div>}
    </section>
  );
}

function TemplateSelect({
  id,
  label,
  emptyLabel,
  templates,
  category,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  emptyLabel: string;
  templates: MessageTemplate[];
  category: TemplateCategory;
  value: string | null;
  disabled: boolean;
  onChange: (templateId: string | null) => void;
}) {
  // Filtra por categoría (2026-09-12), no por variableCount — evita confundir una plantilla de
  // otro propósito que por coincidencia tenga la misma cantidad de variables.
  const options = templates.filter((t) => t.category === category);
  const selected = options.find((t) => t.id === value) ?? null;

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled}
        className={selectClass}
      >
        <option value="">{emptyLabel}</option>
        {options.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name} ({template.languageCode})
          </option>
        ))}
      </select>
      {selected && (
        <p className="mt-[var(--space-3)] whitespace-pre-wrap rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs italic text-secondary">
          {selected.bodyPreview}
        </p>
      )}
      {options.length === 0 && (
        <p className="mt-[var(--space-3)] text-xs text-secondary">
          No hay plantillas de esta categoría.{' '}
          <Link href="/settings/templates" className="font-semibold text-brand hover:underline">
            Ir a Plantillas de Meta
          </Link>
        </p>
      )}
    </div>
  );
}

function SatisfactionSurveyCard({
  organization,
  actionPending,
  update,
}: {
  organization: Organization;
  actionPending: boolean;
  update: Update;
}) {
  const [surveyMessageDraft, setSurveyMessageDraft] = useState(organization.satisfactionSurveyMessage ?? '');

  useEffect(() => {
    // Sincroniza el borrador con lo guardado en el servidor — solo cuando cambia ese valor, no en
    // cada tecleo (eso pisaría lo que el usuario está escribiendo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSurveyMessageDraft(organization.satisfactionSurveyMessage ?? '');
  }, [organization.satisfactionSurveyMessage]);

  return (
    <AutomationCard
      title="Encuesta de satisfacción"
      description="Se envía al cerrar un caso comercial (cliente o en seguimiento) — no corre a una hora fija, sino en el momento mismo del cierre."
      historyKind="SATISFACTION_SURVEY"
      toggle={{
        checked: organization.satisfactionSurveyEnabled,
        disabled: actionPending,
        onChange: (checked) => update({ satisfactionSurveyEnabled: checked }),
      }}
    >
      <div>
        <label htmlFor="satisfactionSurveyMessage" className={labelClass}>
          Texto de la encuesta
        </label>
        <textarea
          id="satisfactionSurveyMessage"
          value={surveyMessageDraft}
          onChange={(e) => setSurveyMessageDraft(e.target.value)}
          onBlur={() => update({ satisfactionSurveyMessage: surveyMessageDraft.trim() || null })}
          disabled={actionPending}
          rows={5}
          placeholder={DEFAULT_SATISFACTION_SURVEY_MESSAGE}
          className="w-full resize-y rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        />
        <div className="mt-[var(--space-3)] flex flex-wrap items-center justify-between gap-[var(--space-4)]">
          <p className="text-xs text-secondary">Vacío = se usa el texto por defecto (el que ves arriba en gris).</p>
          {surveyMessageDraft.trim() !== '' && (
            <button
              type="button"
              disabled={actionPending}
              onClick={() => {
                setSurveyMessageDraft('');
                update({ satisfactionSurveyMessage: null });
              }}
              className="shrink-0 text-xs font-semibold text-brand hover:underline disabled:opacity-50"
            >
              Restablecer al texto por defecto
            </button>
          )}
        </div>
      </div>
      <Link href="/reports/surveys" className="self-start text-xs font-semibold text-brand hover:underline">
        Ver respuestas recibidas →
      </Link>
    </AutomationCard>
  );
}

function GymSoftReminderCard({
  organization,
  actionPending,
  update,
}: {
  organization: Organization;
  actionPending: boolean;
  update: Update;
}) {
  const [clientsOpen, setClientsOpen] = useState(false);

  return (
    <AutomationCard
      title="Recordatorio de vencimiento de plan"
      description={
        <>
          Avisa a un cliente de GymSoft cuyo plan está por vencer. Requiere la integración GymSoft configurada.{' '}
          <button
            type="button"
            onClick={() => setClientsOpen(true)}
            className="font-semibold text-brand hover:underline"
          >
            Ver clientes sincronizados
          </button>
        </>
      }
      historyKind="GYMSOFT_EXPIRATION_REMINDER"
      toggle={{
        checked: organization.gymSoftReminderEnabled,
        disabled: actionPending,
        onChange: (checked) => update({ gymSoftReminderEnabled: checked }),
      }}
    >
      <GymSoftReminderRulesView />
      <GymSoftClientsDialog open={clientsOpen} onClose={() => setClientsOpen(false)} />
    </AutomationCard>
  );
}
