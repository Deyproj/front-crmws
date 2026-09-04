'use client';

import { useState } from 'react';
import type { QuickReply } from '@/features/quickReplies';
import { PencilIcon, PlusIcon, TrashIcon, XIcon, ZapIcon } from '@/components/ui/icons';

const inputClass =
  'w-full rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand';

/**
 * Pila flotante de mensajes rápidos (2026-09-03, a pedido del usuario) — se abre desde
 * ChatPanel al escribir "/" en el cuadro de texto. Compartidos por toda la organización
 * (QuickReply en api-crmws); cualquier asesor puede crear/editar/eliminar entradas desde
 * aquí mismo, sin pasar por Configuración.
 */
export function QuickReplyPicker({
  query,
  items,
  allCount,
  highlightedIndex,
  onHighlight,
  onSelect,
  onClose,
  loading,
  saving,
  error,
  onCreate,
  onUpdate,
  onDelete,
}: {
  query: string;
  items: QuickReply[];
  allCount: number;
  highlightedIndex: number;
  onHighlight: (index: number) => void;
  onSelect: (item: QuickReply) => void;
  onClose: () => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onCreate: (shortcut: string, content: string) => Promise<boolean>;
  onUpdate: (id: string, shortcut: string, content: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="absolute inset-x-[var(--space-7)] bottom-full z-10 mb-[var(--space-4)] flex max-h-80 flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
      <div className="flex shrink-0 items-center justify-between gap-[var(--space-4)] border-b border-border px-[var(--space-6)] py-[var(--space-4)]">
        <span className="flex items-center gap-[var(--space-3)] text-xs font-semibold text-secondary">
          <ZapIcon className="size-3.5 text-brand" /> Mensajes rápidos
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar mensajes rápidos"
          className="rounded p-1 text-secondary hover:bg-app hover:text-ink"
        >
          <XIcon className="size-3.5" />
        </button>
      </div>

      {error && <p className="shrink-0 px-[var(--space-6)] py-[var(--space-3)] text-xs text-danger">{error}</p>}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-[var(--space-6)] py-[var(--space-5)] text-xs text-secondary">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="px-[var(--space-6)] py-[var(--space-5)] text-xs text-secondary">
            {allCount === 0
              ? 'Todavía no hay mensajes rápidos — crea el primero abajo.'
              : `Sin resultados para "${query}".`}
          </p>
        ) : (
          items.map((item, index) =>
            editingId === item.id ? (
              <QuickReplyForm
                key={item.id}
                initial={item}
                saving={saving}
                onCancel={() => setEditingId(null)}
                onSubmit={async (shortcut, content) => {
                  const ok = await onUpdate(item.id, shortcut, content);
                  if (ok) setEditingId(null);
                }}
              />
            ) : (
              <div
                key={item.id}
                className={`group flex items-center gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-4)] ${
                  index === highlightedIndex ? 'bg-app' : ''
                }`}
                onMouseEnter={() => onHighlight(index)}
              >
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-xs font-semibold text-ink">/{item.shortcut}</p>
                  <p className="line-clamp-1 text-xs text-secondary">{item.content}</p>
                </button>
                <div className="flex shrink-0 items-center gap-[var(--space-2)] opacity-0 group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => setEditingId(item.id)}
                    aria-label="Editar mensaje rápido"
                    className="rounded p-1 text-secondary hover:bg-surface hover:text-ink"
                  >
                    <PencilIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "/${item.shortcut}"?`)) onDelete(item.id);
                    }}
                    aria-label="Eliminar mensaje rápido"
                    className="rounded p-1 text-secondary hover:bg-surface hover:text-danger"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      <div className="shrink-0 border-t border-border">
        {creating ? (
          <QuickReplyForm
            saving={saving}
            onCancel={() => setCreating(false)}
            onSubmit={async (shortcut, content) => {
              const ok = await onCreate(shortcut, content);
              if (ok) setCreating(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex w-full items-center gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-brand hover:bg-app"
          >
            <PlusIcon className="size-3.5" /> Nuevo mensaje rápido
          </button>
        )}
      </div>
    </div>
  );
}

function QuickReplyForm({
  initial,
  saving,
  onCancel,
  onSubmit,
}: {
  initial?: QuickReply;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (shortcut: string, content: string) => void;
}) {
  const [shortcut, setShortcut] = useState(initial?.shortcut ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const isValid = shortcut.trim().length > 0 && content.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) onSubmit(shortcut.trim(), content.trim());
      }}
      className="flex flex-col gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-4)]"
    >
      <input
        value={shortcut}
        onChange={(e) => setShortcut(e.target.value)}
        placeholder="Acceso, ej. saludo"
        maxLength={60}
        autoFocus
        className={inputClass}
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Mensaje que se insertará"
        rows={2}
        className={inputClass}
      />
      <div className="flex gap-[var(--space-3)]">
        <button
          type="submit"
          disabled={saving || !isValid}
          className="rounded-md bg-brand px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
