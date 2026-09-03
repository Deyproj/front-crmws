'use client';

import { useState, type FormEvent } from 'react';
import { startConversation } from '@/features/conversations';
import { XIcon } from '@/components/ui/icons';

/**
 * Indicativos disponibles para "Nuevo chat": Colombia por defecto (la organización
 * piloto opera ahí) más los países vecinos desde donde suelen escribir clientes o
 * hacerse pruebas — no es un catálogo exhaustivo de indicativos mundiales.
 */
const COUNTRY_CODES = [
  { code: 'CO', dial: '+57', label: 'Colombia' },
  { code: 'MX', dial: '+52', label: 'México' },
  { code: 'PE', dial: '+51', label: 'Perú' },
  { code: 'EC', dial: '+593', label: 'Ecuador' },
  { code: 'VE', dial: '+58', label: 'Venezuela' },
  { code: 'CL', dial: '+56', label: 'Chile' },
  { code: 'AR', dial: '+54', label: 'Argentina' },
  { code: 'ES', dial: '+34', label: 'España' },
  { code: 'US', dial: '+1', label: 'Estados Unidos' },
] as const;

export function NewConversationDialog({
  open,
  onClose,
  onStarted,
}: {
  open: boolean;
  onClose: () => void;
  /** Se llama con el id de la conversación (nueva o ya existente) resuelta por el backend. */
  onStarted: (conversationId: string) => void;
}) {
  const [dial, setDial] = useState<string>(COUNTRY_CODES[0].dial);
  const [number, setNumber] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setNumber('');
    setError(null);
    setPending(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const digits = number.replace(/\D/g, '');
    if (!digits) {
      setError('Escribe un número de teléfono.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const conversation = await startConversation(`${dial}${digits}`);
      reset();
      onStarted(conversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar el chat.');
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--space-8)]"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-conversation-title"
        className="w-full max-w-sm animate-dialog-pop rounded-xl bg-surface p-[var(--space-8)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p id="new-conversation-title" className="text-sm font-semibold text-ink">
            Nuevo chat
          </p>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="text-secondary hover:text-ink"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
            Número de WhatsApp
            <div className="flex gap-[var(--space-3)]">
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                aria-label="Indicativo de país"
                className="shrink-0 rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-4)] text-xs text-ink focus:outline-none"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.dial}>
                    {c.label} ({c.dial})
                  </option>
                ))}
              </select>
              <input
                autoFocus
                type="tel"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="3001234567"
                aria-label="Número de teléfono"
                className="w-full min-w-0 flex-1 rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-4)] text-xs font-normal normal-case text-ink placeholder-secondary focus:outline-none"
              />
            </div>
          </label>

          {error && <p className="text-xs text-danger">{error}</p>}

          <div className="mt-[var(--space-3)] flex justify-end gap-[var(--space-4)]">
            <button
              type="button"
              onClick={handleClose}
              disabled={pending}
              className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
            >
              {pending ? 'Iniciando...' : 'Iniciar chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
