'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { listMessageTemplates, type MessageTemplate } from '@/features/channel';

/**
 * Reemplaza el cuadro de texto libre cuando `ChatPanel` detecta que el envío manual falló con
 * 422 (`OutsideServiceWindowException`, BR-030) — solo pasa en canales Meta Cloud API, más de
 * 24h después del último mensaje del contacto (incluida la apertura de un "Nuevo chat", que
 * nunca tiene ventana porque no hay ningún mensaje entrante previo). Es el único camino para
 * volver a escribirle.
 *
 * **Filtro por categoría:** solo ofrece plantillas clasificadas como `FIRST_CONTACT` — ni las
 * atadas a una automatización específica (`FOLLOW_UP`/`COURTESY_REMINDER`/`GYMSOFT_REMINDER`, que
 * confundirían a un asesor eligiendo a mano) ni `GENERAL` (sin clasificar todavía: a pedido
 * explícito del usuario, 2026-09-12, una plantilla sin categoría asignada no debe poder elegirse
 * para usarse en ningún selector — el OWNER tiene que clasificarla primero en
 * `MessageTemplatesManager`).
 *
 * **Prellenado (2026-09-15, a pedido explícito del usuario):** la primera plantilla del catálogo
 * queda seleccionada y su variable `{{1}}` se rellena con el nombre del contacto — el caso real de
 * toda plantilla de reapertura ("Hola {{1}}, ..."), así el asesor solo confirma con un click en vez
 * de reescribir un nombre que la plataforma ya conoce. Sigue siendo editable, y si el contacto no
 * tiene nombre cargado el campo queda vacío como antes.
 */
export function TemplateSendPanel({
  channelId,
  contactName,
  draft,
  pending,
  onSend,
  onCancel,
}: {
  channelId: string;
  /** Nombre real del contacto — prellena `{{1}}`; `null` si todavía no tiene uno cargado. */
  contactName: string | null;
  /** Texto libre que el asesor había escrito y no pudo salir — solo para avisarle que no se perdió. */
  draft: string;
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
        const active = list.filter((t) => t.active && t.category === 'FIRST_CONTACT');
        setTemplates(active);
        if (active[0]) {
          setSelectedId(active[0].id);
          setParams(initialParams(active[0].variableCount, contactName));
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
  }, [channelId, contactName]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const previewText = selected
    ? params.reduce(
        (text, value, i) => text.replace(`{{${i + 1}}}`, value.trim() ? value : `{{${i + 1}}}`),
        selected.bodyPreview
      )
    : '';

  function handleSelect(id: string) {
    setSelectedId(id);
    const template = templates.find((t) => t.id === id);
    setParams(initialParams(template?.variableCount ?? 0, contactName));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected || params.some((v) => !v.trim())) return;
    const ok = await onSend(selected.id, params);
    if (ok) setParams(initialParams(selected.variableCount, contactName));
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

      {draft.trim() && (
        <p className="mb-[var(--space-4)] text-xs text-secondary">
          Lo que escribiste queda guardado en el cuadro de texto — vas a poder enviarlo apenas el contacto responda.
        </p>
      )}

      {loading && <p className="text-xs text-secondary">Cargando plantillas...</p>}
      {loadError && <p className="text-xs text-danger">{loadError}</p>}
      {!loading && !loadError && templates.length === 0 && (
        <p className="text-xs text-secondary">
          No hay plantillas cargadas para este canal — un propietario puede sincronizarlas en Configuración → Plantillas
          de Meta.
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
          {selected && (
            <p className="whitespace-pre-wrap rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)] text-xs italic text-secondary">
              {previewText}
            </p>
          )}
          {params.map((value, i) => (
            <input
              key={i}
              value={value}
              onChange={(e) => setParams((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
              placeholder={i === 0 ? 'Nombre del cliente' : `Variable {{${i + 1}}}`}
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

/**
 * Variables vacías salvo la primera, que arranca con el nombre del contacto — toda plantilla de
 * reapertura lo usa como `{{1}}` y el asesor no debería tener que escribirlo a mano.
 */
function initialParams(variableCount: number, contactName: string | null): string[] {
  const values = Array<string>(variableCount).fill('');
  if (values.length > 0 && contactName?.trim()) {
    values[0] = contactName.trim();
  }
  return values;
}
