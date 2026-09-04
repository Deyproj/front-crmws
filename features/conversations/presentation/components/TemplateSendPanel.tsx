'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { listMessageTemplates, type MessageTemplate } from '@/features/channel';

/**
 * Reemplaza el cuadro de texto libre cuando `ChatPanel` detecta que el envío manual falló con
 * 422 (`OutsideServiceWindowException`, BR-030) — solo pasa en canales Meta Cloud API, más de
 * 24h después del último mensaje del contacto. Es el único camino para volver a escribirle.
 */
export function TemplateSendPanel({
  channelId,
  pending,
  onSend,
  onCancel,
}: {
  channelId: string;
  pending: boolean;
  onSend: (templateId: string, parameters: string[]) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [params, setParams] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError(null);
    listMessageTemplates(channelId)
      .then((list) => {
        if (cancelled) return;
        const active = list.filter((t) => t.active);
        setTemplates(active);
        if (active[0]) {
          setSelectedId(active[0].id);
          setParams(Array(active[0].variableCount).fill(''));
        }
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId(id);
    const template = templates.find((t) => t.id === id);
    setParams(Array(template?.variableCount ?? 0).fill(''));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected || params.some((v) => !v.trim())) return;
    const ok = await onSend(selected.id, params);
    if (ok) setParams(Array(selected.variableCount).fill(''));
  }

  return (
    <div className="rounded-md border border-warning/30 bg-warning-bg p-[var(--space-6)]">
      <div className="mb-[var(--space-4)] flex items-start justify-between gap-[var(--space-4)]">
        <p className="text-xs text-ink">
          Pasaron más de 24h desde el último mensaje del contacto — este canal exige una plantilla aprobada para
          escribirle de nuevo.
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="shrink-0 text-xs font-semibold text-secondary hover:text-ink"
        >
          Cancelar
        </button>
      </div>

      {loading && <p className="text-xs text-secondary">Cargando plantillas...</p>}
      {loadError && <p className="text-xs text-danger">{loadError}</p>}
      {!loading && !loadError && templates.length === 0 && (
        <p className="text-xs text-secondary">
          No hay plantillas cargadas para este canal — un propietario puede agregarlas en Configuración → Canal de
          WhatsApp.
        </p>
      )}

      {!loading && templates.length > 0 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-[var(--space-4)]">
          <select
            value={selectedId}
            onChange={(e) => handleSelect(e.target.value)}
            className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs text-ink focus:outline-none"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.languageCode})
              </option>
            ))}
          </select>
          {selected && <p className="text-xs italic text-secondary">{selected.bodyPreview}</p>}
          {params.map((value, i) => (
            <input
              key={i}
              value={value}
              onChange={(e) => setParams((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
              placeholder={`Variable {{${i + 1}}}`}
              className="rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs text-ink placeholder-secondary focus:outline-none"
            />
          ))}
          <button
            type="submit"
            disabled={pending || !selected || params.some((v) => !v.trim())}
            className="self-end rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Enviando...' : 'Enviar plantilla'}
          </button>
        </form>
      )}
    </div>
  );
}
