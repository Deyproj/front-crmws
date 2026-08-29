'use client';

import { useState } from 'react';
import { useKnowledgeEntries } from '../hooks/useKnowledgeEntries';
import type { KnowledgeEntry } from '@/features/agent';

const inputClass =
  'w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';
const labelClass = 'mb-[var(--space-3)] block text-xs font-medium uppercase tracking-wide text-secondary';

type StatusFilter = 'all' | 'active' | 'inactive';

const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'active', label: 'Activas' },
  { id: 'inactive', label: 'Inactivas' },
];

export function KnowledgeEntriesManager() {
  const { entries, loading, saving, error, create, update } = useKnowledgeEntries();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const filteredEntries = entries.filter((entry) => {
    if (statusFilter === 'active' && !entry.active) return false;
    if (statusFilter === 'inactive' && entry.active) return false;
    const q = search.trim().toLowerCase();
    if (q && !entry.question.toLowerCase().includes(q) && !entry.answer.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="flex w-full flex-col gap-[var(--space-6)]">
      <p className="max-w-3xl text-sm text-secondary">
        Preguntas y respuestas que el agente puede usar para responder. Nunca inventa condiciones fuera de esta
        lista — si una pregunta no está aquí, escala a un asesor.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-[var(--space-5)]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por pregunta o respuesta..."
          className="w-full max-w-xs rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-4)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand"
        />
        <div className="flex gap-[var(--space-3)]" role="tablist" aria-label="Filtrar por estado">
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold transition-colors ${
                  active ? 'bg-brand text-on-brand' : 'bg-app text-secondary hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-secondary">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 gap-[var(--space-5)] sm:grid-cols-2 xl:grid-cols-3">
          {filteredEntries.length === 0 && !creating && (
            <p className="text-sm text-secondary">
              {entries.length === 0
                ? 'Todavía no hay conocimiento cargado.'
                : 'Ninguna entrada coincide con la búsqueda o el filtro.'}
            </p>
          )}
          {filteredEntries.map((entry) =>
            editingId === entry.id ? (
              <KnowledgeEntryForm
                key={entry.id}
                initial={entry}
                saving={saving}
                onCancel={() => setEditingId(null)}
                onSubmit={async (question, answer, active) => {
                  const ok = await update(entry.id, question, answer, active);
                  if (ok) setEditingId(null);
                }}
              />
            ) : (
              <KnowledgeEntryCard
                key={entry.id}
                entry={entry}
                saving={saving}
                onEdit={() => setEditingId(entry.id)}
                onToggleActive={() => update(entry.id, entry.question, entry.answer, !entry.active)}
              />
            )
          )}
        </div>
      )}

      {creating ? (
        <KnowledgeEntryForm
          saving={saving}
          onCancel={() => setCreating(false)}
          onSubmit={async (question, answer) => {
            const ok = await create(question, answer);
            if (ok) setCreating(false);
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="self-start rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-sm font-semibold text-ink hover:bg-app"
        >
          Agregar entrada
        </button>
      )}
    </div>
  );
}

function KnowledgeEntryCard({
  entry,
  saving,
  onEdit,
  onToggleActive,
}: {
  entry: KnowledgeEntry;
  saving: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-4)] rounded-lg border border-border bg-surface p-[var(--space-7)]">
      <div className="flex items-start justify-between gap-[var(--space-5)]">
        <p className="text-sm font-semibold text-ink">{entry.question}</p>
        <span
          className={`shrink-0 rounded-full px-[var(--space-4)] py-[2px] text-[10px] font-semibold uppercase ${
            entry.active ? 'bg-success-bg text-success' : 'bg-app text-muted'
          }`}
        >
          {entry.active ? 'Activa' : 'Inactiva'}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm text-secondary">{entry.answer}</p>
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
          onClick={onToggleActive}
          className="rounded-md px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-secondary hover:bg-app disabled:opacity-50"
        >
          {entry.active ? 'Desactivar' : 'Activar'}
        </button>
      </div>
    </div>
  );
}

function KnowledgeEntryForm({
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: KnowledgeEntry;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (question: string, answer: string, active: boolean) => void;
}) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [active, setActive] = useState(initial?.active ?? true);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (question.trim() && answer.trim()) onSubmit(question.trim(), answer.trim(), active);
      }}
      className="flex flex-col gap-[var(--space-5)] rounded-lg border border-border bg-surface p-[var(--space-7)]"
    >
      <div>
        <label className={labelClass}>Pregunta</label>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="ej. ¿Cuál es el horario del gimnasio?"
          className={inputClass}
          autoFocus
        />
      </div>
      <div>
        <label className={labelClass}>Respuesta</label>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="ej. Lunes a viernes de 5am a 10pm, sábados de 7am a 4pm."
          rows={3}
          className={inputClass}
        />
      </div>
      {initial && (
        <label className="flex items-center gap-[var(--space-4)] text-sm text-ink">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="size-4 rounded border-border accent-[var(--color-brand)]"
          />
          Activa
        </label>
      )}
      <div className="flex gap-[var(--space-4)]">
        <button
          type="submit"
          disabled={saving || !question.trim() || !answer.trim()}
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
