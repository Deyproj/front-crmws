'use client';

import { useState } from 'react';
import { useFollowUpMessageRules } from '../hooks/useFollowUpMessageRules';
import { REASON_LABELS, type FollowUpMessageRule, type FollowUpReason } from '@/features/followups';

const inputClass =
  'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';
const labelClass = 'mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary';

export function FollowUpMessageRulesView() {
  const { rules, loading, saving, error, create, update, remove } = useFollowUpMessageRules();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <p className="max-w-3xl text-sm text-secondary">
        Mensajes automáticos por WhatsApp según cuánto tiempo lleve un contacto pendiente en{' '}
        <span className="font-semibold text-ink">Seguimientos</span>. Cada regla dispara una sola vez al cumplirse su
        umbral; usa <code className="rounded bg-app px-1">{'{{nombre}}'}</code> para incluir el nombre del contacto.
        Elige un motivo específico (ej. &quot;No asistió&quot;) para un mensaje distinto solo para ese caso, o &quot;Cualquier
        motivo&quot; para una regla universal.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <p className="text-sm text-secondary">Cargando...</p>
      ) : (
        <div className="flex flex-col gap-[var(--space-5)]">
          {rules.length === 0 && !creating && (
            <p className="text-sm text-secondary">Todavía no hay reglas configuradas — no se envía ningún mensaje.</p>
          )}
          {rules.map((rule) =>
            editingId === rule.id ? (
              <FollowUpMessageRuleForm
                key={rule.id}
                initial={rule}
                saving={saving}
                onCancel={() => setEditingId(null)}
                onSubmit={async (thresholdDays, messageTemplate, reason) => {
                  const ok = await update(rule.id, thresholdDays, messageTemplate, reason);
                  if (ok) setEditingId(null);
                }}
              />
            ) : (
              <FollowUpMessageRuleCard
                key={rule.id}
                rule={rule}
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
          saving={saving}
          onCancel={() => setCreating(false)}
          onSubmit={async (thresholdDays, messageTemplate, reason) => {
            const ok = await create(thresholdDays, messageTemplate, reason);
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
  saving,
  onEdit,
  onDelete,
}: {
  rule: FollowUpMessageRule;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-4)] rounded-lg border border-border bg-surface p-[var(--space-7)]">
      <div className="flex items-start justify-between gap-[var(--space-5)]">
        <p className="text-sm font-semibold text-ink">
          A partir de {rule.thresholdDays} día(s) — {rule.reason ? REASON_LABELS[rule.reason] : 'cualquier motivo'}
        </p>
      </div>
      <p className="whitespace-pre-wrap text-sm text-secondary">{rule.messageTemplate}</p>
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
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: FollowUpMessageRule;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (thresholdDays: number, messageTemplate: string, reason: FollowUpReason | null) => void;
}) {
  const [thresholdDays, setThresholdDays] = useState(String(initial?.thresholdDays ?? ''));
  const [messageTemplate, setMessageTemplate] = useState(initial?.messageTemplate ?? '');
  const [reason, setReason] = useState<FollowUpReason | ''>(initial?.reason ?? '');

  const parsedDays = Number(thresholdDays);
  const isValid = Number.isInteger(parsedDays) && parsedDays > 0 && messageTemplate.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onSubmit(parsedDays, messageTemplate.trim(), reason || null);
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
        <label className={labelClass}>Mensaje</label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          placeholder="ej. Hola {{nombre}}, ¿seguimos con tu inscripción?"
          rows={3}
          className={inputClass}
        />
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
