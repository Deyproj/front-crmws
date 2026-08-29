'use client';

import { Fragment, useEffect, useState } from 'react';
import { useAgentConfig } from '../hooks/useAgentConfig';
import {
  AGENT_TONES,
  RESPONSE_LENGTHS,
  TONE_LABELS,
  RESPONSE_LENGTH_LABELS,
  WEEK_DAYS,
  WEEK_DAY_LABELS,
  emptyWeeklySchedule,
  parseHumanHoursSchedule,
  serializeHumanHoursSchedule,
  type AgentTone,
  type ResponseLength,
  type UpdateAgentConfigInput,
  type WeeklySchedule,
} from '@/features/agent';

const EMPTY_FORM: Omit<UpdateAgentConfigInput, 'humanHoursSchedule'> = {
  agentName: 'Asistente',
  tone: 'PROFESSIONAL',
  emojisAllowed: false,
  responseLength: 'SHORT',
  greetingStyle: '',
  farewellStyle: '',
  forbiddenWords: '',
};

export function AgentConfigForm() {
  const { config, loading, saving, error, save } = useAgentConfig();
  const [form, setForm] = useState(EMPTY_FORM);
  const [schedule, setSchedule] = useState<WeeklySchedule>(emptyWeeklySchedule());
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    if (!config) return;
    // Sincroniza el formulario con la config recién cargada del servidor — no derivable
    // de otra forma sin duplicar el estado inicial en dos lugares.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      agentName: config.agentName,
      tone: config.tone,
      emojisAllowed: config.emojisAllowed,
      responseLength: config.responseLength,
      greetingStyle: config.greetingStyle ?? '',
      farewellStyle: config.farewellStyle ?? '',
      forbiddenWords: config.forbiddenWords ?? '',
    });
    setSchedule(parseHumanHoursSchedule(config.humanHoursSchedule));
  }, [config]);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSavedMessage(false);
    const ok = await save({ ...form, humanHoursSchedule: serializeHumanHoursSchedule(schedule) });
    if (ok) {
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    }
  }

  function toggleDay(day: keyof WeeklySchedule, enabled: boolean) {
    setSchedule({ ...schedule, [day]: { ...schedule[day], enabled } });
  }

  function updateDayTime(day: keyof WeeklySchedule, field: 'start' | 'end', value: string) {
    setSchedule({ ...schedule, [day]: { ...schedule[day], [field]: value } });
  }

  const inputClass =
    'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';
  const labelClass = 'mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary';

  return (
    <div className="flex w-full flex-col gap-[var(--space-7)] lg:flex-row">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-[var(--space-6)] rounded-lg border border-border bg-surface p-[var(--space-8)]">
        <div>
          <label htmlFor="agentName" className={labelClass}>
            Nombre del agente
          </label>
          <input
            id="agentName"
            value={form.agentName}
            onChange={(e) => setForm({ ...form, agentName: e.target.value })}
            className={inputClass}
            placeholder="ej. Sofía"
          />
        </div>

        <div className="grid grid-cols-2 gap-[var(--space-6)]">
          <div>
            <label htmlFor="tone" className={labelClass}>
              Tono
            </label>
            <select
              id="tone"
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value as AgentTone })}
              className={inputClass}
            >
              {AGENT_TONES.map((t) => (
                <option key={t} value={t}>
                  {TONE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="responseLength" className={labelClass}>
              Longitud de respuesta
            </label>
            <select
              id="responseLength"
              value={form.responseLength}
              onChange={(e) => setForm({ ...form, responseLength: e.target.value as ResponseLength })}
              className={inputClass}
            >
              {RESPONSE_LENGTHS.map((l) => (
                <option key={l} value={l}>
                  {RESPONSE_LENGTH_LABELS[l]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-[var(--space-4)] text-sm text-ink">
          <input
            type="checkbox"
            checked={form.emojisAllowed}
            onChange={(e) => setForm({ ...form, emojisAllowed: e.target.checked })}
            className="size-4 rounded border-border accent-[var(--color-brand)]"
          />
          Permitir emojis
        </label>

        <div>
          <label htmlFor="greetingStyle" className={labelClass}>
            Estilo de saludo (opcional)
          </label>
          <input
            id="greetingStyle"
            value={form.greetingStyle}
            onChange={(e) => setForm({ ...form, greetingStyle: e.target.value })}
            className={inputClass}
            placeholder="ej. Cercano, usa el nombre si se conoce"
          />
        </div>

        <div>
          <label htmlFor="farewellStyle" className={labelClass}>
            Estilo de despedida (opcional)
          </label>
          <input
            id="farewellStyle"
            value={form.farewellStyle}
            onChange={(e) => setForm({ ...form, farewellStyle: e.target.value })}
            className={inputClass}
            placeholder="ej. Breve, invita a escribir de nuevo"
          />
        </div>

        <div>
          <label htmlFor="forbiddenWords" className={labelClass}>
            Palabras o expresiones prohibidas (separadas por coma, opcional)
          </label>
          <input
            id="forbiddenWords"
            value={form.forbiddenWords}
            onChange={(e) => setForm({ ...form, forbiddenWords: e.target.value })}
            className={inputClass}
            placeholder="ej. garantizado, gratis para siempre"
          />
        </div>

        <div>
          <label className={labelClass}>Horario de atención humana (opcional)</label>
          <p className="mb-[var(--space-3)] text-xs text-secondary">
            Si el agente escala una conversación fuera de este horario, se le avisa al contacto cuándo será atendido en
            vez del aviso genérico de transferencia.
          </p>
          <div className="grid grid-cols-1 items-center gap-x-[var(--space-4)] gap-y-[var(--space-4)] sm:grid-cols-[9rem_1fr_auto_1fr] sm:gap-y-[var(--space-3)]">
            {WEEK_DAYS.map((day) => (
              <Fragment key={day}>
                <label className="flex items-center gap-[var(--space-3)] text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={schedule[day].enabled}
                    onChange={(e) => toggleDay(day, e.target.checked)}
                    className="size-4 shrink-0 rounded border-border accent-[var(--color-brand)]"
                  />
                  {WEEK_DAY_LABELS[day]}
                </label>
                <input
                  type="time"
                  value={schedule[day].start}
                  onChange={(e) => updateDayTime(day, 'start', e.target.value)}
                  disabled={!schedule[day].enabled}
                  className={`${inputClass} disabled:opacity-40`}
                />
                <span className="hidden text-center text-sm text-secondary sm:block">a</span>
                <input
                  type="time"
                  value={schedule[day].end}
                  onChange={(e) => updateDayTime(day, 'end', e.target.value)}
                  disabled={!schedule[day].enabled}
                  className={`${inputClass} disabled:opacity-40`}
                />
              </Fragment>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
        {savedMessage && <p className="text-sm text-success">Guardado.</p>}

        <button
          type="submit"
          disabled={saving || !form.agentName.trim()}
          className="rounded-md bg-brand px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>

      <AgentConfigPreview form={form} schedule={schedule} />
    </div>
  );
}

function AgentConfigPreview({
  form,
  schedule,
}: {
  form: Omit<UpdateAgentConfigInput, 'humanHoursSchedule'>;
  schedule: WeeklySchedule;
}) {
  const forbidden = form.forbiddenWords
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);
  const activeDays = WEEK_DAYS.filter((day) => schedule[day].enabled);

  return (
    <aside className="flex w-full flex-col gap-[var(--space-5)] rounded-lg border border-border bg-app p-[var(--space-8)] lg:w-[280px]">
      <p className="text-xs font-semibold uppercase text-muted">Vista previa</p>
      <p className="text-sm text-ink">
        <span className="font-semibold">{form.agentName || 'El agente'}</span> responde con tono{' '}
        <span className="font-semibold">{TONE_LABELS[form.tone].toLowerCase()}</span>, en respuestas{' '}
        <span className="font-semibold">{form.responseLength === 'SHORT' ? 'cortas' : 'de longitud media'}</span>
        {form.emojisAllowed ? ', usando emojis con moderación' : ', sin emojis'}.
      </p>
      {form.greetingStyle && (
        <p className="text-xs text-secondary">
          <span className="font-semibold text-ink">Saludo:</span> {form.greetingStyle}
        </p>
      )}
      {form.farewellStyle && (
        <p className="text-xs text-secondary">
          <span className="font-semibold text-ink">Despedida:</span> {form.farewellStyle}
        </p>
      )}
      {forbidden.length > 0 && (
        <p className="text-xs text-secondary">
          <span className="font-semibold text-ink">Nunca dirá:</span> {forbidden.join(', ')}
        </p>
      )}
      {activeDays.length > 0 && (
        <p className="text-xs text-secondary">
          <span className="font-semibold text-ink">Horario humano:</span>{' '}
          {activeDays.map((day) => `${WEEK_DAY_LABELS[day]} ${schedule[day].start}-${schedule[day].end}`).join(', ')}
        </p>
      )}
    </aside>
  );
}
