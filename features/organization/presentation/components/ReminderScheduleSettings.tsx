'use client';

import { useEffect, useState } from 'react';
import { listOrganizationTemplates, type MessageTemplate } from '@/features/channel';
import { useReminderSchedule } from '../hooks/useReminderSchedule';
import { FollowUpMessageRulesView } from '@/features/followups/presentation/views/FollowUpMessageRulesView';

/**
 * Convención fija del recordatorio de cortesía: {{1}}=nombre, {{2}}=fecha, {{3}}=hora (ver
 * UpdateReminderScheduleHandler en api-crmws). Antes del 2026-09-10 eran 2 variables (fecha y
 * hora combinadas en una sola) — si esto no coincide con el backend, el selector de abajo queda
 * vacío en silencio porque ninguna plantilla real cumple el filtro.
 */
const COURTESY_REMINDER_TEMPLATE_VARIABLE_COUNT = 3;

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

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

  useEffect(() => {
    listOrganizationTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;
  if (!organization) return null;

  const courtesyTemplates = templates.filter((t) => t.variableCount === COURTESY_REMINDER_TEMPLATE_VARIABLE_COUNT);

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
          <p className="mt-[var(--space-2)] text-xs text-secondary">
            Sin plantilla, el recordatorio no sale si el contacto lleva más de 24h sin escribir.
          </p>
        </div>

        <div className="flex items-center justify-between gap-[var(--space-5)]">
          <div>
            <p className="text-sm font-medium text-ink">Mensajes de seguimiento</p>
            <p className="text-xs text-secondary">Reglas por umbral de días — configúralas justo debajo.</p>
          </div>
          <ToggleSwitch
            label="Mensajes de seguimiento"
            checked={organization.followUpReminderEnabled}
            disabled={actionPending}
            onChange={(checked) => update({ followUpReminderEnabled: checked })}
          />
        </div>

        <FollowUpMessageRulesView />
      </div>
    </div>
  );
}
