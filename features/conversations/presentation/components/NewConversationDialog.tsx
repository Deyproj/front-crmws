'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { startConversation } from '@/features/conversations';
import { listChannels, PROVIDER_LABELS, type Channel } from '@/features/channel';
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
  // Con Baileys + Meta Cloud API coexistiendo (ADR-017), el backend ya no puede elegir un canal
  // solo con más de uno activo — salvo que el OWNER haya marcado uno "preferido" en Configuración
  // (ver ChannelCard), en cuyo caso ni hace falta preguntar acá.
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelId, setChannelId] = useState('');

  useEffect(() => {
    if (!open) return;
    listChannels()
      .then((all) => {
        const active = all.filter((c) => c.active);
        setChannels(active);
        setChannelId(active.find((c) => c.preferred)?.id ?? active[0]?.id ?? '');
      })
      .catch(() => {
        // Silencioso: si falla, se sigue intentando sin channelId (funciona igual con 0 o 1 canal).
      });
  }, [open]);

  if (!open) return null;

  const needsChannelChoice = channels.length > 1 && !channels.some((c) => c.preferred);

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
    if (needsChannelChoice && !channelId) {
      setError('Elige desde qué canal iniciar la conversación.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      const conversation = await startConversation(`${dial}${digits}`, channelId || undefined);
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
          {needsChannelChoice && (
            <label className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
              Canal
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                aria-label="Canal de WhatsApp"
                className="rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-4)] text-xs font-normal normal-case text-ink focus:outline-none"
              >
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {PROVIDER_LABELS[c.provider]} ({c.externalAccountId})
                  </option>
                ))}
              </select>
            </label>
          )}
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
