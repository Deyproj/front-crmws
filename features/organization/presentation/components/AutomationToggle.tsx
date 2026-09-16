'use client';

import Link from 'next/link';
import { useAutomationToggle } from '../hooks/useAutomationToggle';

/**
 * Interruptor de emergencia del piloto (mvp-roadmap.md, Paso 4): pausa las
 * respuestas automaticas del agente en toda la organizacion. Un asesor sigue
 * pudiendo tomar cualquier conversacion manualmente mientras esta pausada
 * (ver ContactPanel/ChatPanel — el take-over ya funciona independiente de esto).
 */
export function AutomationToggle() {
  const { organization, loading, actionPending, error, toggle } = useAutomationToggle();

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;
  if (!organization) return null;

  const enabled = organization.automationEnabled;

  return (
    <div className="w-full rounded-lg border border-border bg-surface p-[var(--space-8)]">
      <div className="mb-[var(--space-6)] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Respuestas del agente de IA</p>
          <p className="text-xs text-secondary">
            {enabled
              ? 'El agente responde automáticamente en las conversaciones en modo IA.'
              : 'Pausado: los mensajes nuevos se escalan directo a un asesor, sin respuesta automática.'}
          </p>
          {/* Aclaración agregada el 2026-09-16: el usuario esperaba que esta pausa también detuviera los recordatorios (BR-036). */}
          <p className="mt-[var(--space-2)] text-xs text-secondary">
            No detiene recordatorios, seguimientos, encuestas ni vencimientos de plan —{' '}
            <Link href="/settings/automations" className="font-semibold text-brand hover:underline">
              esos se pausan en Automatizaciones
            </Link>
            .
          </p>
        </div>
        <span className={`size-3 shrink-0 rounded-full ${enabled ? 'bg-success' : 'bg-warning'}`} />
      </div>

      {error && (
        <p className="mb-[var(--space-6)] rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {enabled ? (
        <button
          type="button"
          onClick={() => toggle(false)}
          disabled={actionPending}
          className="rounded-md border border-danger/30 px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
        >
          Pausar automatización
        </button>
      ) : (
        <button
          type="button"
          onClick={() => toggle(true)}
          disabled={actionPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
        >
          Reanudar automatización
        </button>
      )}
    </div>
  );
}
