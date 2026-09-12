'use client';

import { useEffect, useState } from 'react';
import { useFollowUpMessageRules } from '../hooks/useFollowUpMessageRules';
import { REASON_LABELS, type FollowUpMessageRule, type FollowUpReason } from '@/features/followups';
import { listOrganizationTemplates, type MessageTemplate } from '@/features/channel';

const inputClass =
  'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';
const labelClass = 'mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary';

export function FollowUpMessageRulesView() {
  const { rules, loading, saving, error, create, update, remove } = useFollowUpMessageRules();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);

  useEffect(() => {
    listOrganizationTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  /**
   * El selector de "qué plantilla usar" solo ofrece las clasificadas como Seguimiento
   * (2026-09-12) — reemplaza el filtro anterior por `variableCount`, que se prestaba a confundir
   * una plantilla de otro propósito con la misma cantidad de variables. `templates` sin filtrar
   * se sigue usando para mostrar el cuerpo de la plantilla ya asignada de una regla existente,
   * aunque haya sido reclasificada después.
   */
  const metaTemplates = templates.filter((t) => t.category === 'FOLLOW_UP');

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <p className="max-w-3xl text-sm text-secondary">
        Mensajes automáticos según cuánto tiempo lleve un contacto en <span className="font-semibold text-ink">Seguimientos</span>.
        Cada regla dispara una sola vez, con el texto de la plantilla que elijas.
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
              <FollowUpMessageRuleForm
                key={rule.id}
                initial={rule}
                templates={metaTemplates}
                saving={saving}
                onCancel={() => setEditingId(null)}
                onSubmit={async (thresholdDays, reason, metaTemplateId) => {
                  const ok = await update(rule.id, thresholdDays, reason, metaTemplateId);
                  if (ok) setEditingId(null);
                }}
              />
            ) : (
              <FollowUpMessageRuleCard
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
        <FollowUpMessageRuleForm
          templates={metaTemplates}
          saving={saving}
          onCancel={() => setCreating(false)}
          onSubmit={async (thresholdDays, reason, metaTemplateId) => {
            const ok = await create(thresholdDays, reason, metaTemplateId);
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

function FollowUpMessageRuleCard({
  rule,
  templates,
  saving,
  onEdit,
  onDelete,
}: {
  rule: FollowUpMessageRule;
  templates: MessageTemplate[];
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const template = templates.find((t) => t.id === rule.metaTemplateId);
  return (
    <div className="flex flex-col gap-[var(--space-4)] rounded-lg border border-border bg-surface p-[var(--space-7)]">
      <div className="flex items-start justify-between gap-[var(--space-5)]">
        <p className="text-sm font-semibold text-ink">
          A partir de {rule.thresholdDays} día(s) — {rule.reason ? REASON_LABELS[rule.reason] : 'cualquier motivo'}
        </p>
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
            if (window.confirm('¿Eliminar esta regla? Los contactos que ya la cumplieron no recibirán un mensaje nuevo.')) {
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

function FollowUpMessageRuleForm({
  initial,
  templates,
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: FollowUpMessageRule;
  templates: MessageTemplate[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (thresholdDays: number, reason: FollowUpReason | null, metaTemplateId: string) => void;
}) {
  const [thresholdDays, setThresholdDays] = useState(String(initial?.thresholdDays ?? ''));
  const [reason, setReason] = useState<FollowUpReason | ''>(initial?.reason ?? '');
  const [metaTemplateId, setMetaTemplateId] = useState(initial?.metaTemplateId ?? '');

  const parsedDays = Number(thresholdDays);
  const isValid = Number.isInteger(parsedDays) && parsedDays > 0 && metaTemplateId.trim().length > 0;
  const selectedTemplate = templates.find((t) => t.id === metaTemplateId) ?? null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onSubmit(parsedDays, reason || null, metaTemplateId);
      }}
      className="flex flex-col gap-[var(--space-5)] rounded-lg border border-border bg-surface p-[var(--space-7)]"
    >
      <div>
        <label className={labelClass}>Motivo</label>
        <select value={reason} onChange={(e) => setReason(e.target.value as FollowUpReason | '')} className={inputClass}>
          <option value="">Cualquier motivo</option>
          {(Object.entries(REASON_LABELS) as [FollowUpReason, string][]).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>A partir de cuántos días</label>
        <input
          type="number"
          min={1}
          step={1}
          value={thresholdDays}
          onChange={(e) => setThresholdDays(e.target.value)}
          placeholder="ej. 3"
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
        <p className="mt-[var(--space-2)] text-xs text-secondary">Solo plantillas de 1 variable ({'{{1}}'}=nombre).</p>
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
