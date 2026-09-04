'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  createMessageTemplate,
  listMessageTemplates,
  syncMessageTemplates,
  updateMessageTemplate,
  type MessageTemplate,
} from '@/features/channel';

const EMPTY_CREATE_FORM = { name: '', languageCode: 'es', bodyPreview: '', variableCount: '0' };

/**
 * Deshabilitada a pedido explícito del usuario (2026-09-04): la carga manual era la fuente del
 * riesgo de typo (el nombre debe coincidir exacto con Meta) que "Sincronizar con Meta" elimina.
 * El backend también la rechaza (ver CreateMessageTemplateHandler) — este flag solo evita mostrar
 * un formulario que de todas formas fallaría. Se deja el código listo para reactivar si hiciera
 * falta un camino manual cuando la sincronización no esté disponible.
 */
const MANUAL_CREATION_ENABLED = false;

/**
 * Catálogo de plantillas de un canal Meta Cloud API — el OWNER las carga a mano después de que
 * Meta las apruebe en Meta Business Manager (BR-030). `name`/`languageCode` deben coincidir
 * exactamente con la plantilla real registrada ahí, por eso no son editables una vez creadas.
 */
export function MessageTemplatesManager({ channelId }: { channelId: string }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setTemplates(await listMessageTemplates(channelId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las plantillas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const variableCount = Number(createForm.variableCount);
    if (!createForm.name.trim() || !createForm.languageCode.trim() || !createForm.bodyPreview.trim() || Number.isNaN(variableCount)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const template = await createMessageTemplate(channelId, {
        name: createForm.name.trim(),
        languageCode: createForm.languageCode.trim(),
        bodyPreview: createForm.bodyPreview.trim(),
        variableCount,
      });
      setTemplates((prev) => [...prev, template]);
      setCreateForm(EMPTY_CREATE_FORM);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la plantilla');
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const synced = await syncMessageTemplates(channelId);
      setTemplates(synced);
      setSyncMessage(
        synced.length === 0
          ? 'Meta no devolvió ninguna plantilla aprobada todavía.'
          : `${synced.length} plantilla(s) aprobada(s) sincronizada(s).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sincronizar con Meta');
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggleActive(template: MessageTemplate) {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateMessageTemplate(channelId, template.id, {
        bodyPreview: template.bodyPreview,
        variableCount: template.variableCount,
        active: !template.active,
      });
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la plantilla');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-[var(--space-6)] border-t border-border pt-[var(--space-6)]">
      <div className="mb-[var(--space-5)] flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-secondary">Plantillas aprobadas</p>
        <div className="flex items-center gap-[var(--space-4)]">
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
          >
            {syncing ? 'Sincronizando...' : 'Sincronizar con Meta'}
          </button>
          {MANUAL_CREATION_ENABLED && (
            <button
              type="button"
              onClick={() => setCreating((v) => !v)}
              className="text-xs font-semibold text-brand hover:underline"
            >
              {creating ? 'Cancelar' : '+ Agregar a mano'}
            </button>
          )}
        </div>
      </div>

      {syncMessage && <p className="mb-[var(--space-4)] text-xs text-secondary">{syncMessage}</p>}
      {error && <p className="mb-[var(--space-4)] text-xs text-danger">{error}</p>}

      {MANUAL_CREATION_ENABLED && creating && (
        <form
          onSubmit={handleCreate}
          className="mb-[var(--space-6)] flex flex-col gap-[var(--space-4)] rounded-md border border-border bg-app p-[var(--space-6)]"
        >
          <p className="text-[10px] text-secondary">
            El nombre y el idioma deben coincidir exactamente con la plantilla ya aprobada en Meta Business Manager.
          </p>
          <div className="flex gap-[var(--space-4)]">
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre exacto en Meta"
              className="w-full min-w-0 flex-1 rounded-md border border-border bg-surface px-[var(--space-4)] py-[var(--space-4)] text-xs text-ink placeholder-secondary focus:outline-none"
            />
            <input
              value={createForm.languageCode}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, languageCode: e.target.value }))}
              placeholder="es"
              className="w-20 shrink-0 rounded-md border border-border bg-surface px-[var(--space-4)] py-[var(--space-4)] text-xs text-ink placeholder-secondary focus:outline-none"
            />
          </div>
          <textarea
            value={createForm.bodyPreview}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, bodyPreview: e.target.value }))}
            placeholder="Hola {{1}}, tu cortesía quedó confirmada para el {{2}}."
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-surface px-[var(--space-4)] py-[var(--space-4)] text-xs text-ink placeholder-secondary focus:outline-none"
          />
          <label className="flex items-center gap-[var(--space-3)] text-xs text-secondary">
            Cantidad de variables
            <input
              type="number"
              min={0}
              value={createForm.variableCount}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, variableCount: e.target.value }))}
              className="w-16 rounded-md border border-border bg-surface px-[var(--space-3)] py-[var(--space-3)] text-xs text-ink focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="self-end rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Crear plantilla'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-secondary">Cargando...</p>
      ) : templates.length === 0 ? (
        <p className="text-xs text-secondary">Sin plantillas cargadas todavía.</p>
      ) : (
        <ul className="flex flex-col gap-[var(--space-4)]">
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-start justify-between gap-[var(--space-4)] rounded-md border border-border bg-app px-[var(--space-5)] py-[var(--space-4)]"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink">
                  {template.name} <span className="font-normal text-secondary">({template.languageCode})</span>
                </p>
                <p className="mt-1 truncate text-xs text-secondary">{template.bodyPreview}</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(template)}
                disabled={saving}
                className={`shrink-0 rounded-md px-[var(--space-4)] py-[var(--space-3)] text-[10px] font-semibold ${
                  template.active ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                } disabled:opacity-50`}
              >
                {template.active ? 'Activa' : 'Inactiva'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
