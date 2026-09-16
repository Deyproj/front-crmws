'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  BROADCAST_RECIPIENT_STATUS_LABELS,
  BROADCAST_REPLY_HANDLING_LABELS,
  listBroadcastRecipients,
  type Broadcast,
  type BroadcastRecipient,
  type BroadcastRecipientStatus,
} from '@/features/broadcast';
import { XIcon } from '@/components/ui/icons';

const STATUS_CLASSES: Record<BroadcastRecipientStatus, string> = {
  SENT: 'bg-success-bg text-success',
  FAILED: 'bg-danger-bg text-danger',
  SKIPPED_OPTED_OUT: 'bg-app text-muted',
  CANCELLED: 'bg-app text-muted',
  PENDING: 'bg-info-bg text-info',
};

/** Quién recibió qué, y por qué no le llegó a quien no le llegó. */
export function BroadcastRecipientsDialog({ broadcast, onClose }: { broadcast: Broadcast | null; onClose: () => void }) {
  const [recipients, setRecipients] = useState<BroadcastRecipient[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const broadcastId = broadcast?.id ?? null;

  const load = useCallback(
    async (targetPage: number) => {
      if (!broadcastId) return;
      setLoading(true);
      try {
        const result = await listBroadcastRecipients(broadcastId, targetPage);
        setRecipients(result.content);
        setTotalPages(result.totalPages);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los destinatarios');
      } finally {
        setLoading(false);
      }
    },
    [broadcastId]
  );

  useEffect(() => {
    if (!broadcastId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
  }, [broadcastId, page, load]);

  if (!broadcast) return null;

  function handleClose() {
    setPage(0);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--space-8)]" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="broadcast-recipients-title"
        className="w-full max-w-3xl animate-dialog-pop rounded-xl bg-surface p-[var(--space-8)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-[var(--space-4)]">
          <p id="broadcast-recipients-title" className="text-sm font-semibold text-ink">
            Destinatarios de &ldquo;{broadcast.name}&rdquo;
          </p>
          <button type="button" onClick={handleClose} aria-label="Cerrar" className="text-secondary hover:text-ink">
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          {error && <p className="text-sm text-danger">{error}</p>}

          {loading ? (
            <p className="text-sm text-secondary">Cargando...</p>
          ) : recipients.length === 0 ? (
            <p className="text-sm text-secondary">Esta difusión no tiene destinatarios.</p>
          ) : (
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="sticky top-0 bg-app text-xs font-semibold uppercase text-muted">
                  <tr>
                    <th className="px-[var(--space-6)] py-[var(--space-4)]">Cliente</th>
                    <th className="px-[var(--space-6)] py-[var(--space-4)]">Teléfono</th>
                    <th className="px-[var(--space-6)] py-[var(--space-4)]">Estado</th>
                    <th className="px-[var(--space-6)] py-[var(--space-4)]">Respuesta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">{recipient.fullName || 'Sin nombre'}</td>
                      <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">{recipient.phoneE164}</td>
                      <td className="px-[var(--space-6)] py-[var(--space-4)]">
                        <span
                          className={`rounded-full px-[var(--space-4)] py-[2px] text-[11px] font-semibold ${STATUS_CLASSES[recipient.status]}`}
                          title={recipient.errorReason ?? undefined}
                        >
                          {BROADCAST_RECIPIENT_STATUS_LABELS[recipient.status]}
                        </span>
                        {recipient.errorReason && (
                          <span className="ml-[var(--space-3)] text-[11px] text-danger">{recipient.errorReason}</span>
                        )}
                      </td>
                      <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                        {recipient.repliedAt
                          ? `Respondió · ${recipient.replyRoutedTo ? BROADCAST_REPLY_HANDLING_LABELS[recipient.replyRoutedTo] : ''}`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-[var(--space-4)] text-sm">
              <button
                type="button"
                disabled={page <= 0}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-secondary">
                Página {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
