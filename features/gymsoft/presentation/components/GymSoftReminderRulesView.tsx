'use client';

import { useEffect, useState } from 'react';
import { useGymSoftReminderRules } from '../hooks/useGymSoftReminderRules';
import type { GymSoftReminderRule } from '@/features/gymsoft';
import { listOrganizationTemplates, type MessageTemplate } from '@/features/channel';

const inputClass =
  'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';
const labelClass = 'mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary';

/**
 * Lista de reglas de recordatorio de vencimiento de plan (2026-09-17, a pedido explícito del
 * usuario: "poder crear 2, una de 2 días y otra de 1 día") — reemplaza el selector único de
 * plantilla + input de días que tenía Configuración → Recordatorios. El switch maestro
 * "Recordatorio de vencimiento de plan" (`gymSoftReminderEnabled`) sigue viviendo en
 * ReminderScheduleSettings y activa/desactiva todas las reglas de esta lista a la vez.
 */
export function GymSoftReminderRulesView() {
  const { rules, loading, saving, error, create, update, remove } = useGymSoftReminderRules();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    listOrganizationTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const gymSoftTemplates = templates.filter((t) => t.category === 'GYMSOFT_REMINDER');

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <p className="max-w-3xl text-sm text-secondary">
        Cada regla avisa a los clientes cuyo plan (datos de GymSoft) vence en la cantidad de días que definas, con el
        texto de la plantilla que elijas. Puedes tener varias reglas activas a la vez, por ejemplo una a 2 días y otra
        a 1 día del vencimiento.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-secondary">Cargando...</p>
      ) : (
        <div className="flex flex-col gap-[var(--space-5)]">
          {rules.length === 0 && !creating && (
            <p className="text-sm text-secondary">Todavía no hay reglas configuradas.</p>
          )}
          {rules.map((rule) =>
            editingId === rule.id ? (
              <GymSoftReminderRuleForm
                key={rule.id}
                initial={rule}
                templates={gymSoftTemplates}
                saving={saving}
                onCancel={() => setEditingId(null)}
                onSubmit={async (daysBefore, metaTemplateId) => {
                  const ok = await update(rule.id, daysBefore, metaTemplateId);
                  if (ok) setEditingId(null);
                }}
              />
            ) : (
              <GymSoftReminderRuleCard
                key={rule.id}
                rule={rule}
                templates={templates}
                saving={saving}
                onEdit={() => setEditingId(rule.id)}
                onDelete={() => remove(rule.id)}
              />
            )
          )}
        </div>
      )}

      {creating ? (
        <GymSoftReminderRuleForm
          templates={gymSoftTemplates}
          saving={saving}
          onCancel={() => setCreating(false)}
          onSubmit={async (daysBefore, metaTemplateId) => {
            const ok = await create(daysBefore, metaTemplateId);
            if (ok) setCreating(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="self-start rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-sm font-semibold text-ink hover:bg-app"
        >
          Agregar regla
        </button>
      )}
    </div>
  );
}

function GymSoftReminderRuleCard({
  rule,
  templates,
  saving,
  onEdit,
  onDelete,
}: {
  rule: GymSoftReminderRule;
  templates: MessageTemplate[];
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const template = templates.find((t) => t.id === rule.metaTemplateId);
  return (
    <div className="flex flex-col gap-[var(--space-4)] rounded-lg border border-border bg-surface p-[var(--space-7)]">
      <div className="flex items-start justify-between gap-[var(--space-5)]">
        <p className="text-sm font-semibold text-ink">{rule.daysBefore} día(s) antes del vencimiento</p>
      </div>
      <p className="whitespace-pre-wrap text-sm text-secondary">
        {template ? template.bodyPreview : `Plantilla ${rule.metaTemplateId} (ya no disponible)`}
      </p>
      <div className="flex gap-[var(--space-4)]">
        <button
          type="button"
          disabled={saving}
          onClick={onEdit}
          className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
        >
          Editar
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (window.confirm('¿Eliminar esta regla?')) {
              onDelete();
            }
          }}
          className="rounded-md px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-secondary hover:bg-app disabled:opacity-50"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}

function GymSoftReminderRuleForm({
  initial,
  templates,
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: GymSoftReminderRule;
  templates: MessageTemplate[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (daysBefore: number, metaTemplateId: string) => void;
}) {
  const [daysBefore, setDaysBefore] = useState(String(initial?.daysBefore ?? ''));
  const [metaTemplateId, setMetaTemplateId] = useState(initial?.metaTemplateId ?? '');

  const parsedDays = Number(daysBefore);
  const isValid = Number.isInteger(parsedDays) && parsedDays > 0 && metaTemplateId.trim().length > 0;
  const selectedTemplate = templates.find((t) => t.id === metaTemplateId) ?? null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onSubmit(parsedDays, metaTemplateId);
      }}
      className="flex flex-col gap-[var(--space-5)] rounded-lg border border-border bg-surface p-[var(--space-7)]"
    >
      <div>
        <label className={labelClass}>Días antes del vencimiento</label>
        <input
          type="number"
          min={1}
          step={1}
          value={daysBefore}
          onChange={(e) => setDaysBefore(e.target.value)}
          placeholder="ej. 2"
          className={inputClass}
          autoFocus
        />
      </div>
      <div>
        <label className={labelClass}>Plantilla de Meta</label>
        <select value={metaTemplateId} onChange={(e) => setMetaTemplateId(e.target.value)} className={inputClass}>
          <option value="">Selecciona una plantilla...</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.languageCode})
            </option>
          ))}
        </select>
        <p className="mt-[var(--space-2)] text-xs text-secondary">
          Solo plantillas de 2 variables (nombre y fecha de vencimiento).
        </p>
        {selectedTemplate && (
          <p className="mt-[var(--space-3)] whitespace-pre-wrap rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs italic text-secondary">
            {selectedTemplate.bodyPreview}
          </p>
        )}
      </div>
      <div className="flex gap-[var(--space-4)]">
        <button
          type="submit"
          disabled={saving || !isValid}
          className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
