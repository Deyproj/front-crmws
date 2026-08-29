'use client';

import { useState } from 'react';
import { useAgentSimulator } from '../hooks/useAgentSimulator';
import { SendIcon, BotIcon } from '@/components/ui/icons';

/**
 * "Probar agente" (Paso 5) — no persiste nada en conversation/contact, solo
 * llama a POST /api/agent/simulate. Ver docs/02-requirements/agent-personalization-and-tools.md.
 */
export function AgentSimulator() {
  const { turns, lastResult, sending, error, send, reset } = useAgentSimulator();
  const [draft, setDraft] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    await send(text);
  }

  return (
    <div className="flex w-full flex-col gap-[var(--space-7)] lg:flex-row">
      <div className="flex flex-1 flex-col rounded-lg border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-[var(--space-7)] py-[var(--space-5)]">
          <p className="text-xs font-semibold uppercase text-muted">Chat de prueba</p>
          <button type="button" onClick={reset} className="text-xs font-semibold text-secondary hover:text-ink">
            Reiniciar
          </button>
        </div>

        <div className="flex min-h-[280px] flex-1 flex-col gap-[var(--space-6)] overflow-y-auto p-[var(--space-7)]">
          {turns.length === 0 && (
            <p className="text-xs text-secondary">Escribe como si fueras un prospecto para ver cómo respondería el agente.</p>
          )}
          {turns.map((turn, i) => (
            <div
              key={i}
              className={`flex max-w-[85%] flex-col gap-1 rounded-[var(--radius-lg)] p-[var(--space-6)] text-sm ${
                turn.role === 'CUSTOMER'
                  ? 'self-start rounded-tl-[var(--radius-sm)] border border-border bg-app text-ink'
                  : 'self-end rounded-tr-[var(--radius-sm)] bg-info-bg text-ink'
              }`}
            >
              {turn.role === 'ASSISTANT' && (
                <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-info">
                  <BotIcon className="size-3" /> Agente
                </span>
              )}
              <p className="whitespace-pre-wrap">{turn.text}</p>
            </div>
          ))}
          {lastResult?.escalate && (
            <p className="self-end rounded-md border border-warning/30 bg-warning-bg px-[var(--space-5)] py-[var(--space-4)] text-xs text-warning">
              El agente escalaría a un asesor humano{lastResult.escalationReason ? ` (${lastResult.escalationReason})` : ''}, sin
              responder.
            </p>
          )}
        </div>

        {error && <p className="px-[var(--space-7)] pb-[var(--space-4)] text-xs text-danger">{error}</p>}

        <form onSubmit={handleSubmit} className="flex items-center gap-[var(--space-5)] border-t border-border p-[var(--space-6)]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escribe como un prospecto..."
            className="flex-1 rounded-full bg-app px-[var(--space-7)] py-[var(--space-4)] text-sm text-ink placeholder-secondary focus:outline-none focus:ring-2 focus:ring-brand"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon className="size-[16px]" />
          </button>
        </form>
      </div>

      <aside className="flex w-full flex-col gap-[var(--space-5)] rounded-lg border border-border bg-app p-[var(--space-8)] lg:w-[280px]">
        <p className="text-xs font-semibold uppercase text-muted">Detalle del último turno</p>
        {!lastResult ? (
          <p className="text-xs text-secondary">Envía un mensaje para ver el detalle.</p>
        ) : (
          <>
            <div>
              <p className="text-[11px] text-secondary">¿Escalaría?</p>
              <p className="text-sm font-semibold text-ink">{lastResult.escalate ? 'Sí' : 'No'}</p>
            </div>
            {(lastResult.qualificationGoal ||
              lastResult.qualificationSchedule ||
              lastResult.qualificationPlanOfInterest ||
              lastResult.qualificationIntent) && (
              <div className="flex flex-col gap-[var(--space-3)]">
                <p className="text-[11px] text-secondary">Datos que confirmaría</p>
                {lastResult.qualificationGoal && <p className="text-xs text-ink">Objetivo: {lastResult.qualificationGoal}</p>}
                {lastResult.qualificationSchedule && <p className="text-xs text-ink">Horario: {lastResult.qualificationSchedule}</p>}
                {lastResult.qualificationPlanOfInterest && (
                  <p className="text-xs text-ink">Plan: {lastResult.qualificationPlanOfInterest}</p>
                )}
                {lastResult.qualificationIntent && <p className="text-xs text-ink">Intención: {lastResult.qualificationIntent}</p>}
              </div>
            )}
            <div>
              <p className="text-[11px] text-secondary">Fuente de conocimiento consultada</p>
              {lastResult.knowledgeQuestionsUsed.length === 0 ? (
                <p className="text-xs text-ink">Ninguna cargada todavía</p>
              ) : (
                <ul className="list-inside list-disc text-xs text-ink">
                  {lastResult.knowledgeQuestionsUsed.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
