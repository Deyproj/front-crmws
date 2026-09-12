'use client';

import { useEffect, useState } from 'react';
import { listOrganizationTemplates, type MessageTemplate } from '@/features/channel';
import { useReminderSchedule } from '../hooks/useReminderSchedule';
import { FollowUpMessageRulesView } from '@/features/followups/presentation/views/FollowUpMessageRulesView';
import { AutomationHistoryView } from '@/features/automation/presentation/views/AutomationHistoryView';
import { GymSoftClientsDialog } from '@/features/gymsoft/presentation/components/GymSoftClientsDialog';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const DAYS_BEFORE_OPTIONS = [1, 2, 3, 5, 7, 10, 14];

/** Mismo texto que `SatisfactionSurveyDirectoryServiceImpl.DEFAULT_QUESTIONS_TEXT` en api-crmws — se muestra como placeholder cuando la organización no lo personalizó. */
const DEFAULT_SATISFACTION_SURVEY_MESSAGE =
  'Antes de terminar, nos gustaría conocer tu opinión:\n' +
  '1. ¿Tu consulta fue resuelta?\n' +
  '2. ¿Cómo calificarías la atención recibida, de 1 a 5?\n' +
  '3. ¿Deseas que te contacte un asesor?\n\n' +
  'Puedes responder este mismo mensaje con lo que gustes, ¡gracias por tu tiempo!';

function formatHour(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Interruptor tipo pastilla — no hay un componente Switch compartido todavía en components/ui,
 * así que se construye acá inline (dos usos en esta misma vista, no amerita extraerlo).
 */
function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
        checked ? 'bg-brand' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

/**
 * Configuración de horario de los recordatorios automáticos (2026-09-07, cierra BR-027 — ver
 * UpdateReminderScheduleHandler en api-crmws). Antes ambos jobs revisaban cada hora con una
 * ventana rodante fija en código; ahora el OWNER define una hora local fija y activa/desactiva
 * cada tipo de recordatorio sin depender de un redeploy.
 */
export function ReminderScheduleSettings() {
  const { organization, loading, actionPending, error, update } = useReminderSchedule();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [surveyMessageDraft, setSurveyMessageDraft] = useState('');
  const [gymSoftClientsOpen, setGymSoftClientsOpen] = useState(false);

  useEffect(() => {
    listOrganizationTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    if (!organization) return;
    // Sincroniza el borrador con lo cargado del servidor — solo al llegar/cambiar de
    // organización, no en cada tecleo (eso pisaría lo que el usuario está escribiendo).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSurveyMessageDraft(organization.satisfactionSurveyMessage ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization?.satisfactionSurveyMessage]);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;
  if (!organization) return null;

  function saveSurveyMessage() {
    update({ satisfactionSurveyMessage: surveyMessageDraft.trim() || null });
  }

  // Filtra por categoría (2026-09-12), no por variableCount — evita confundir una plantilla de
  // otro propósito que por coincidencia tenga la misma cantidad de variables.
  const courtesyTemplates = templates.filter((t) => t.category === 'COURTESY_REMINDER');
  const selectedCourtesyTemplate = courtesyTemplates.find((t) => t.id === organization.courtesyReminderTemplateId) ?? null;

  const gymSoftTemplates = templates.filter((t) => t.category === 'GYMSOFT_REMINDER');
  const selectedGymSoftTemplate = gymSoftTemplates.find((t) => t.id === organization.gymSoftReminderTemplateId) ?? null;

  return (
    <div className="w-full rounded-lg border border-border bg-surface p-[var(--space-8)]">
      <div className="mb-[var(--space-6)]">
        <p className="text-sm font-semibold text-ink">Recordatorios automáticos</p>
        <p className="text-xs text-secondary">
          Recordatorio de cortesía (a quien tiene cita al día siguiente) y mensajes de seguimiento — ambos corren una
          vez al día, a la hora local que elijas ({organization.timezone}).
        </p>
      </div>

      {error && (
        <p className="mb-[var(--space-6)] rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="mb-[var(--space-7)]">
        <label htmlFor="dailyReminderHour" className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary">
          Hora del día
        </label>
        <select
          id="dailyReminderHour"
          value={organization.dailyReminderHour}
          onChange={(e) => update({ dailyReminderHour: Number(e.target.value) })}
          disabled={actionPending}
          className="w-full max-w-[160px] rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {formatHour(hour)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-[var(--space-6)]">
        <div className="flex items-center justify-between gap-[var(--space-5)]">
          <div>
            <p className="text-sm font-medium text-ink">Recordatorio de cortesía</p>
            <p className="text-xs text-secondary">Avisa a quien tiene cita agendada para el día siguiente.</p>
          </div>
          <ToggleSwitch
            label="Recordatorio de cortesía"
            checked={organization.courtesyReminderEnabled}
            disabled={actionPending}
            onChange={(checked) => update({ courtesyReminderEnabled: checked })}
          />
        </div>

        <div>
          <label
            htmlFor="courtesyReminderTemplateId"
            className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
          >
            Plantilla de Meta (fuera de la ventana de 24h)
          </label>
          <select
            id="courtesyReminderTemplateId"
            value={organization.courtesyReminderTemplateId ?? ''}
            onChange={(e) => update({ courtesyReminderTemplateId: e.target.value || null })}
            disabled={actionPending}
            className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          >
            <option value="">Ninguna — se omite el envío fuera de la ventana de 24h</option>
            {courtesyTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.languageCode})
              </option>
            ))}
          </select>
          {selectedCourtesyTemplate && (
            <p className="mt-[var(--space-3)] whitespace-pre-wrap rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs italic text-secondary">
              {selectedCourtesyTemplate.bodyPreview}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-[var(--space-5)]">
          <div>
            <p className="text-sm font-medium text-ink">Mensajes de seguimiento</p>
            <p className="text-xs text-secondary">Reglas por umbral de días.</p>
          </div>
          <ToggleSwitch
            label="Mensajes de seguimiento"
            checked={organization.followUpReminderEnabled}
            disabled={actionPending}
            onChange={(checked) => update({ followUpReminderEnabled: checked })}
          />
        </div>

        <FollowUpMessageRulesView />

        <div className="flex items-center justify-between gap-[var(--space-5)] border-t border-border pt-[var(--space-6)]">
          <div>
            <p className="text-sm font-medium text-ink">Encuesta de satisfacción</p>
            <p className="text-xs text-secondary">
              Se envía al cerrar un caso comercial (cliente o en seguimiento) — a diferencia de los dos anteriores, no
              corre a una hora fija, sino en el momento mismo del cierre.
            </p>
          </div>
          <ToggleSwitch
            label="Encuesta de satisfacción"
            checked={organization.satisfactionSurveyEnabled}
            disabled={actionPending}
            onChange={(checked) => update({ satisfactionSurveyEnabled: checked })}
          />
        </div>

        <div>
          <label
            htmlFor="satisfactionSurveyMessage"
            className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
          >
            Texto de la encuesta
          </label>
          <textarea
            id="satisfactionSurveyMessage"
            value={surveyMessageDraft}
            onChange={(e) => setSurveyMessageDraft(e.target.value)}
            onBlur={saveSurveyMessage}
            disabled={actionPending}
            rows={5}
            placeholder={DEFAULT_SATISFACTION_SURVEY_MESSAGE}
            className="w-full resize-y rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-secondary focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          />
          <div className="mt-[var(--space-3)] flex items-center justify-between gap-[var(--space-4)]">
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

        <div className="flex items-center justify-between gap-[var(--space-5)] border-t border-border pt-[var(--space-6)]">
          <div>
            <p className="text-sm font-medium text-ink">Recordatorio de vencimiento de plan</p>
            <p className="text-xs text-secondary">
              Avisa a un cliente de GymSoft cuyo plan está por vencer. Requiere la integración GymSoft configurada.
            </p>
            <button
              type="button"
              onClick={() => setGymSoftClientsOpen(true)}
              className="mt-[var(--space-3)] text-xs font-semibold text-brand hover:underline"
            >
              Ver clientes sincronizados
            </button>
          </div>
          <ToggleSwitch
            label="Recordatorio de vencimiento de plan"
            checked={organization.gymSoftReminderEnabled}
            disabled={actionPending}
            onChange={(checked) => update({ gymSoftReminderEnabled: checked })}
          />
        </div>

        <div>
          <label
            htmlFor="gymSoftReminderDaysBefore"
            className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
          >
            Días de anticipación
          </label>
          <select
            id="gymSoftReminderDaysBefore"
            value={organization.gymSoftReminderDaysBefore}
            onChange={(e) => update({ gymSoftReminderDaysBefore: Number(e.target.value) })}
            disabled={actionPending}
            className="w-full max-w-[160px] rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          >
            {DAYS_BEFORE_OPTIONS.map((days) => (
              <option key={days} value={days}>
                {days} {days === 1 ? 'día' : 'días'} antes
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="gymSoftReminderTemplateId"
            className="mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary"
          >
            Plantilla de Meta (recordatorio de vencimiento)
          </label>
          <select
            id="gymSoftReminderTemplateId"
            value={organization.gymSoftReminderTemplateId ?? ''}
            onChange={(e) => update({ gymSoftReminderTemplateId: e.target.value || null })}
            disabled={actionPending}
            className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand disabled:opacity-50"
          >
            <option value="">Ninguna — se omite el envío a quien nunca ha escrito por WhatsApp</option>
            {gymSoftTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.languageCode})
              </option>
            ))}
          </select>
          {selectedGymSoftTemplate && (
            <p className="mt-[var(--space-3)] whitespace-pre-wrap rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs italic text-secondary">
              {selectedGymSoftTemplate.bodyPreview}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-[var(--space-6)]">
          <AutomationHistoryView />
        </div>
      </div>

      <GymSoftClientsDialog open={gymSoftClientsOpen} onClose={() => setGymSoftClientsOpen(false)} />
    </div>
  );
}
