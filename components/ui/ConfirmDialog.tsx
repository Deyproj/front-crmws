'use client';

/**
 * Modal de confirmación genérico — reemplaza `window.confirm` para acciones destructivas
 * o irreversibles (revocar acceso, resetear contraseña, transferir una conversación),
 * donde el diálogo nativo del navegador no se puede estilizar ni testear.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--space-8)]"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm animate-dialog-pop rounded-xl bg-surface p-[var(--space-8)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-dialog-title" className="text-sm font-semibold text-ink">
          {title}
        </p>
        {description && <p className="mt-[var(--space-4)] text-xs text-secondary">{description}</p>}
        <div className="mt-[var(--space-8)] flex justify-end gap-[var(--space-4)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`rounded-md px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand disabled:opacity-50 ${
              destructive ? 'bg-danger hover:bg-danger/90' : 'bg-brand hover:bg-brand-hover'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
