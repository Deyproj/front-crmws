'use client';

import { useState, type FormEvent } from 'react';
import { XIcon } from '@/components/ui/icons';
import type { MetaCredentialsInput } from '@/features/channel';

const FIELD_LABELS: Record<keyof MetaCredentialsInput, string> = {
  phoneNumberId: 'Phone Number ID',
  wabaId: 'WABA ID',
  accessToken: 'Token de acceso (System User)',
  appSecret: 'App Secret',
  verifyToken: 'Verify Token (lo eliges tú)',
};

const EMPTY_FORM = { phoneNumberId: '', wabaId: '', accessToken: '', appSecret: '', verifyToken: '' };

/**
 * Formulario para conectar un canal Meta Cloud API — a diferencia de Baileys, no hay QR: las
 * credenciales se validan contra la Graph API real al enviar (CreateChannelHandler, api-crmws) y
 * la creación falla con el mensaje de Meta si son inválidas. `externalAccountId` se deriva de
 * `phoneNumberId` (único por canal) en vez de pedirlo aparte — sería un campo redundante.
 */
export function MetaChannelConnectDialog({
  open,
  onClose,
  onSubmit,
  pending,
  error,
  title = 'Conectar Meta Cloud API',
  submitLabel = 'Conectar',
  submitPendingLabel = 'Conectando...',
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: MetaCredentialsInput) => Promise<boolean>;
  pending: boolean;
  error: string | null;
  title?: string;
  submitLabel?: string;
  submitPendingLabel?: string;
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!open) return null;

  function reset() {
    setForm(EMPTY_FORM);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await onSubmit({
      phoneNumberId: form.phoneNumberId.trim(),
      wabaId: form.wabaId.trim(),
      accessToken: form.accessToken.trim(),
      appSecret: form.appSecret.trim(),
      verifyToken: form.verifyToken.trim(),
    });
    if (ok) {
      reset();
      onClose();
    }
  }

  const allFilled = Object.values(form).every((value) => value.trim().length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--space-8)]"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meta-channel-title"
        className="w-full max-w-md animate-dialog-pop rounded-xl bg-surface p-[var(--space-8)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p id="meta-channel-title" className="text-sm font-semibold text-ink">
            {title}
          </p>
          <button type="button" onClick={handleClose} aria-label="Cerrar" className="text-secondary hover:text-ink">
            <XIcon className="size-4" />
          </button>
        </div>
        <p className="mt-[var(--space-3)] text-xs text-secondary">
          Datos de la app/WABA en developers.facebook.com → WhatsApp → API Setup y Business Settings → System Users.
        </p>

        <form onSubmit={handleSubmit} className="mt-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          {(Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>).map((field) => (
            <label key={field} className="flex flex-col gap-[var(--space-3)] text-xs font-semibold text-secondary">
              {FIELD_LABELS[field]}
              <input
                type={field === 'accessToken' || field === 'appSecret' ? 'password' : 'text'}
                value={form[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                autoComplete="off"
                className="w-full rounded-md border border-border bg-app px-[var(--space-4)] py-[var(--space-4)] text-xs font-normal normal-case text-ink placeholder-secondary focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
          ))}

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
              disabled={pending || !allFilled}
              className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? submitPendingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
