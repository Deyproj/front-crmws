'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { listFollowUpOptOuts, setFollowUpOptedOut, type FollowUpOptOut } from '@/features/contacts';

/**
 * Etiqueta de "quién lo hizo" para el origen de la baja. `performedByName` (presente solo cuando
 * se ejecutó a mano desde el botón del panel del contacto) siempre gana sobre `source` — ver
 * `ContactController#notificationsOptOut` / `GetFollowUpOptOutsHandler`.
 */
function originLabel(optOut: FollowUpOptOut): string {
  if (optOut.performedByName) return `Panel del contacto — ${optOut.performedByName}`;
  if (optOut.source === 'agente_ia') return 'Agente IA — petición explícita del cliente';
  if (optOut.source === 'respuesta_difusion') return 'Automático — respondió "BAJA" a una difusión';
  if (optOut.source === 'contacto_escribio_de_nuevo') return 'Automático — el contacto volvió a escribir';
  return `Automático — ${optOut.source}`;
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

/**
 * Configuración → Organización → Notificaciones (`/settings/notifications`, solo OWNER): quién
 * tiene los mensajes automáticos (recordatorio de cortesía, seguimiento, encuesta, vencimiento de
 * plan) desactivados ahora mismo, quién lo hizo y cuándo, con acceso directo a reactivar y a la
 * conversación del contacto. No afecta la respuesta del agente de IA a un mensaje que el contacto
 * escribe — ver `FollowUpOptOutToggle` en `ContactPanel` (BR-018).
 */
export function NotificationsOptOutView() {
  const router = useRouter();
  const [optOuts, setOptOuts] = useState<FollowUpOptOut[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingContactId, setPendingContactId] = useState<string | null>(null);

  const load = useCallback((targetPage: number) => {
    setLoading(true);
    listFollowUpOptOuts(targetPage)
      .then((result) => {
        setOptOuts(result.content);
        setTotalPages(result.totalPages);
        setPage(result.page);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo cargar la lista'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(0);
  }, [load]);

  async function reactivate(contactId: string) {
    setPendingContactId(contactId);
    setError(null);
    try {
      await setFollowUpOptedOut(contactId, false, 'asesor');
      // Ya no está desactivado — se retira de la lista en vez de recargar toda la página.
      setOptOuts((current) => current.filter((o) => o.contactId !== contactId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reactivar');
    } finally {
      setPendingContactId(null);
    }
  }

  return (
    <div className="w-full rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div>
        <h2 className="text-sm font-semibold text-ink">Notificaciones desactivadas</h2>
        <p className="mt-[var(--space-2)] text-xs text-secondary">
          Contactos que no reciben recordatorio de cortesía, mensajes de seguimiento, encuesta de satisfacción ni
          aviso de vencimiento de plan en este momento. No afecta la respuesta del agente de IA a lo que el contacto
          escribe, ni los mensajes manuales de un asesor.
        </p>
      </div>

      {error && (
        <p className="mt-[var(--space-5)] rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-[var(--space-6)] text-sm text-secondary">Cargando...</p>
      ) : optOuts.length === 0 ? (
        <p className="mt-[var(--space-6)] text-sm text-secondary">Nadie tiene las notificaciones desactivadas.</p>
      ) : (
        <div className="mt-[var(--space-6)] flex flex-col gap-[var(--space-5)]">
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-app text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-[var(--space-6)] py-[var(--space-4)]">Contacto</th>
                  <th className="px-[var(--space-6)] py-[var(--space-4)]">Desactivado por</th>
                  <th className="px-[var(--space-6)] py-[var(--space-4)]">Cuándo</th>
                  <th className="px-[var(--space-6)] py-[var(--space-4)]" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {optOuts.map((optOut) => (
                  <tr key={optOut.contactId}>
                    <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">
                      <span className="font-semibold">{optOut.contactName ?? optOut.contactPhone}</span>
                      {optOut.contactName && (
                        <span className="block text-[11px] text-muted">{optOut.contactPhone}</span>
                      )}
                    </td>
                    <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">{originLabel(optOut)}</td>
                    <td className="whitespace-nowrap px-[var(--space-6)] py-[var(--space-4)] tabular-nums text-secondary">
                      {formatDateTime(optOut.optedOutAt)}
                    </td>
                    <td className="px-[var(--space-6)] py-[var(--space-4)]">
                      <div className="flex items-center justify-end gap-[var(--space-4)]">
                        {optOut.conversationId && (
                          <button
                            type="button"
                            onClick={() => router.push(`/?conversation=${optOut.conversationId}`)}
                            className="text-xs font-semibold text-brand hover:underline"
                          >
                            Ver conversación
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={pendingContactId === optOut.contactId}
                          onClick={() => reactivate(optOut.contactId)}
                          className="rounded-md border border-success/30 bg-success-bg px-[var(--space-5)] py-[var(--space-3)] text-xs font-semibold text-success hover:bg-success-bg/80 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {pendingContactId === optOut.contactId ? 'Reactivando...' : 'Reactivar'}
                        </button>
                      </div>
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
                onClick={() => load(page - 1)}
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
                onClick={() => load(page + 1)}
                className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
