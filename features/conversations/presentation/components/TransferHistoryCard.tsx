'use client';

import { useState } from 'react';
import { DateRangePresetPicker, useDateRangePreset } from '@/components/ui/DateRangePresetPicker';
import type { ConversationTransfer, ConversationTransferSummary } from '../../api';
import { useTransferHistory } from '../hooks/useTransferHistory';

const HOUR_AXIS_STEP = 3;

function pad(hour: number): string {
  return String(hour).padStart(2, '0');
}

function hourRange(hour: number): string {
  return `${pad(hour)}:00–${pad(hour)}:59`;
}

function transfersLabel(count: number): string {
  return `${count.toLocaleString('es-CO')} ${count === 1 ? 'transferencia' : 'transferencias'}`;
}

/** Fecha y hora absolutas en la zona horaria de la organización — acá importa "a qué hora", no "hace cuánto". */
function formatDateTime(iso: string, timeZone: string | undefined): string {
  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' };
  try {
    return new Intl.DateTimeFormat('es-CO', { ...options, timeZone }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat('es-CO', options).format(new Date(iso));
  }
}

/**
 * Reportes → Transferencias (solo OWNER, también exigido por el backend): historial de
 * transferencias entre asesores — cuántas entregó/recibió cada uno, en qué horas del día ocurren y
 * el detalle (quién a quién, cuándo, qué contacto).
 */
export function TransferHistoryCard() {
  const { preset, setPreset, customFrom, setCustomFrom, customTo, setCustomTo, range } = useDateRangePreset('thisMonth');
  const { summary, transfers, page, totalPages, loading, error, membershipId, setMembershipId, goToPage } =
    useTransferHistory(range);
  const selectedAdvisor = summary?.byAdvisor.find((advisor) => advisor.membershipId === membershipId) ?? null;

  return (
    <div className="w-full rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
        <div>
          <p className="text-sm font-semibold text-ink">Transferencias entre asesores</p>
          {summary && <p className="mt-[var(--space-1)] text-xs text-secondary">{transfersLabel(summary.total)} en el rango</p>}
        </div>
        <DateRangePresetPicker
          preset={preset}
          onPresetChange={setPreset}
          customFrom={customFrom}
          onCustomFromChange={setCustomFrom}
          customTo={customTo}
          onCustomToChange={setCustomTo}
        />
      </div>

      {error && <p className="mt-[var(--space-4)] text-sm text-danger">{error}</p>}

      {!summary ? (
        <p className="mt-[var(--space-6)] text-sm text-secondary">Cargando...</p>
      ) : (
        <>
          <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-8)] lg:grid-cols-2">
            <AdvisorTransferTable summary={summary} selectedId={membershipId} onSelect={setMembershipId} />
            <TransfersByHourChart byHour={summary.byHour} timezone={summary.timezone} />
          </div>

          <div className="mt-[var(--space-8)] flex flex-col gap-[var(--space-5)]">
            <div className="flex flex-wrap items-center justify-between gap-[var(--space-4)]">
              <p className="text-xs font-semibold uppercase text-muted">
                Detalle{selectedAdvisor ? ` · ${selectedAdvisor.name}` : ''}
              </p>
              {selectedAdvisor && (
                <button
                  type="button"
                  onClick={() => setMembershipId(null)}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Ver todo el equipo
                </button>
              )}
            </div>
            <TransferList
              transfers={transfers}
              timezone={summary.timezone}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

function AdvisorTransferTable({
  summary,
  selectedId,
  onSelect,
}: {
  summary: ConversationTransferSummary;
  selectedId: string | null;
  onSelect: (membershipId: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <p className="text-xs font-semibold uppercase text-muted">Por asesor</p>
      {summary.byAdvisor.length === 0 ? (
        <p className="text-sm text-secondary">Nadie transfirió conversaciones en este rango.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="bg-app text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-[var(--space-6)] py-[var(--space-4)]">Asesor</th>
                <th className="px-[var(--space-6)] py-[var(--space-4)] text-right">Transfirió</th>
                <th className="px-[var(--space-6)] py-[var(--space-4)] text-right">Recibió</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {summary.byAdvisor.map((advisor) => {
                const selected = advisor.membershipId === selectedId;
                return (
                  <tr key={advisor.membershipId} className={selected ? 'bg-app' : undefined}>
                    <td className="px-[var(--space-6)] py-[var(--space-4)]">
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => onSelect(selected ? null : advisor.membershipId)}
                        className="text-left font-semibold text-ink hover:underline"
                        title="Filtrar el detalle por este asesor"
                      >
                        {advisor.name}
                      </button>
                    </td>
                    <td className="px-[var(--space-6)] py-[var(--space-4)] text-right tabular-nums text-ink">{advisor.sent}</td>
                    <td className="px-[var(--space-6)] py-[var(--space-4)] text-right tabular-nums text-secondary">{advisor.received}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** Una sola serie (transferencias por hora local): columnas en el color de marca, sin leyenda — el título la nombra. */
function TransfersByHourChart({ byHour, timezone }: { byHour: number[]; timezone: string }) {
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const max = Math.max(0, ...byHour);
  const peakHour = max > 0 ? byHour.indexOf(max) : null;
  const shownHour = activeHour ?? peakHour;

  return (
    <div className="flex flex-col gap-[var(--space-4)]">
      <p className="text-xs font-semibold uppercase text-muted">Por hora del día</p>
      <p className="min-h-5 text-sm text-secondary" aria-live="polite">
        {shownHour === null ? (
          'Sin transferencias en este rango.'
        ) : (
          <>
            <span className="font-bold text-ink">{transfersLabel(byHour[shownHour])}</span>
            {' · '}
            {activeHour === null ? 'hora pico ' : ''}
            {hourRange(shownHour)}
          </>
        )}
      </p>

      <div className="flex h-32 items-end border-b border-border" onMouseLeave={() => setActiveHour(null)}>
        {byHour.map((count, hour) => (
          <button
            key={hour}
            type="button"
            aria-label={`${hourRange(hour)}: ${transfersLabel(count)}`}
            onMouseEnter={() => setActiveHour(hour)}
            onFocus={() => setActiveHour(hour)}
            onBlur={() => setActiveHour(null)}
            className={`flex h-full flex-1 items-end justify-center px-px focus:outline-none ${
              activeHour === hour ? 'bg-app' : ''
            }`}
          >
            {count > 0 && (
              <span
                className={`block w-full max-w-6 rounded-t-[4px] bg-brand ${activeHour === hour ? 'opacity-80' : ''}`}
                style={{ height: `${(count / max) * 100}%` }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="flex">
        {byHour.map((_, hour) => (
          <span key={hour} className="flex-1 text-center text-[10px] tabular-nums text-muted">
            {hour % HOUR_AXIS_STEP === 0 ? pad(hour) : ''}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted">Hora local ({timezone})</p>
    </div>
  );
}

function TransferList({
  transfers,
  timezone,
  loading,
  page,
  totalPages,
  onPageChange,
}: {
  transfers: ConversationTransfer[];
  timezone: string;
  loading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (!loading && transfers.length === 0) {
    return <p className="text-sm text-secondary">No hay transferencias en este rango.</p>;
  }

  return (
    <div className={`flex flex-col gap-[var(--space-5)] ${loading ? 'opacity-60' : ''}`}>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-app text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Fecha y hora</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Contacto</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">De</th>
              <th className="px-[var(--space-6)] py-[var(--space-4)]">Para</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transfers.map((transfer) => (
              <tr key={transfer.id}>
                <td className="whitespace-nowrap px-[var(--space-6)] py-[var(--space-4)] tabular-nums text-ink">
                  {formatDateTime(transfer.transferredAt, timezone)}
                </td>
                <td className="px-[var(--space-6)] py-[var(--space-4)] text-ink">{transfer.contactName}</td>
                <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">{transfer.fromName}</td>
                <td className="px-[var(--space-6)] py-[var(--space-4)] text-secondary">
                  {transfer.toName}
                  {transfer.forcedByName && (
                    <span className="block text-[11px] text-muted">forzado por {transfer.forcedByName}</span>
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
            onClick={() => onPageChange(page - 1)}
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
            onClick={() => onPageChange(page + 1)}
            className="rounded-md border border-border px-[var(--space-5)] py-[var(--space-3)] font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
