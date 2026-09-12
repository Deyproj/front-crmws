'use client';

import { useCallback, useEffect, useState } from 'react';
import { listGymSoftSubscriptions, syncGymSoftSubscriptions, type GymSoftSubscription } from '@/features/gymsoft';
import { XIcon } from '@/components/ui/icons';

/** Modal "Ver clientes sincronizados" del recordatorio de vencimiento de plan (GymSoft, BR-034). */
export function GymSoftClientsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [subscriptions, setSubscriptions] = useState<GymSoftSubscription[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    try {
      const result = await listGymSoftSubscriptions(targetPage);
      setSubscriptions(result.content);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la lista de clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page);
  }, [open, page, load]);

  if (!open) return null;

  function handleClose() {
    setPage(0);
    setSyncMessage(null);
    onClose();
  }

  async function handleSyncNow() {
    setSyncing(true);
    setSyncMessage(null);
    setError(null);
    try {
      const result = await syncGymSoftSubscriptions();
      setSyncMessage(`Sincronización completa: ${result.synced} cliente(s) guardado(s)/actualizado(s).`);
      await load(0);
      setPage(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo sincronizar con GymSoft');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[var(--space-8)]" onClick={handleClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gymsoft-clients-title"
        className="w-full max-w-2xl animate-dialog-pop rounded-xl bg-surface p-[var(--space-8)] shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-[var(--space-4)]">
          <p id="gymsoft-clients-title" className="text-sm font-semibold text-ink">
            Clientes sincronizados de GymSoft
          </p>
          <div className="flex items-center gap-[var(--space-4)]">
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={syncing}
              className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
            <button type="button" onClick={handleClose} aria-label="Cerrar" className="text-secondary hover:text-ink">
              <XIcon className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          {syncMessage && (
            <p className="rounded-md border border-success/30 bg-success-bg px-[var(--space-5)] py-[var(--space-4)] text-sm text-success">
              {syncMessage}
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}

          {loading ? (
            <p className="text-sm text-secondary">Cargando...</p>
          ) : subscriptions.length === 0 ? (
            <p className="text-sm text-secondary">
              Todavía no hay clientes sincronizados — la sincronización corre una vez al día, o usa &ldquo;Sincronizar ahora&rdquo;.
            </p>
          ) : (
            <div className="flex flex-col gap-[var(--space-5)]">
              <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="sticky top-0 bg-app text-xs font-semibold uppercase text-muted">
                    <tr>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Cliente</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Teléfono</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Vence</th>
                      <th className="px-[var(--space-6)] py-[var(--space-4)]">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {subscriptions.map((subscription) => (
                      <tr key={subscription.id}>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">
                          {subscription.fullName || 'Sin nombre'}
                        </td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">{subscription.phone}</td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">{subscription.expiresAt}</td>
                        <td className="px-[var(--space-6)] py-[var(--space-4)]">
                          {subscription.remindedForExpiresAt === subscription.expiresAt ? (
                            <span className="rounded-full bg-success-bg px-[var(--space-4)] py-[2px] text-[11px] font-semibold text-success">
                              Ya avisado
                            </span>
                          ) : (
                            <span className="rounded-full bg-app px-[var(--space-4)] py-[2px] text-[11px] font-semibold text-muted">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

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
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
