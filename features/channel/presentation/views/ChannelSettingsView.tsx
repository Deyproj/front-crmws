'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useChannel } from '../hooks/useChannel';
import { STATUS_LABELS } from '@/features/channel';
import { AutomationToggle } from '@/features/organization/presentation/components/AutomationToggle';

const MANAGER_ROLES = new Set(['OWNER', 'ADMIN']);

export function ChannelSettingsView() {
  const { user } = useAuth();
  const canManage = !!user && MANAGER_ROLES.has(user.role);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[var(--topbar-height)] shrink-0 items-center border-b border-border bg-surface px-[var(--space-9)]">
        <h1 className="text-xl font-bold text-ink">Configuración</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        {canManage ? (
          <div className="flex flex-col gap-[var(--space-9)]">
            <section className="flex flex-col gap-[var(--space-5)]">
              <h2 className="text-sm font-semibold uppercase text-muted">Automatización</h2>
              <AutomationToggle />
            </section>
            <section className="flex flex-col gap-[var(--space-5)]">
              <h2 className="text-sm font-semibold uppercase text-muted">Canal de WhatsApp</h2>
              <ChannelManager />
            </section>
          </div>
        ) : (
          <p className="text-sm text-secondary">
            Solo el propietario o un administrador de la organización puede gestionar la automatización o el canal de
            WhatsApp.
          </p>
        )}
      </div>
    </div>
  );
}

function ChannelManager() {
  const { channel, status, loading, actionPending, error, create, connect, disconnect, unlink } = useChannel();
  const [externalAccountId, setExternalAccountId] = useState('');

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;

  if (!channel) {
    return (
      <div className="max-w-md rounded-lg border border-border bg-surface p-[var(--space-8)]">
        <p className="mb-[var(--space-6)] text-sm text-secondary">
          Todavía no hay un canal de WhatsApp creado para esta organización.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (externalAccountId.trim()) create(externalAccountId.trim());
          }}
          className="flex flex-col gap-[var(--space-6)]"
        >
          <div>
            <label htmlFor="externalAccountId" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-secondary">
              Identificador de cuenta
            </label>
            <input
              id="externalAccountId"
              value={externalAccountId}
              onChange={(e) => setExternalAccountId(e.target.value)}
              placeholder="ej. gym-principal"
              className="w-full rounded-md border border-border bg-app px-3 py-2.5 text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={actionPending || !externalAccountId.trim()}
            className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            Crear canal
          </button>
        </form>
      </div>
    );
  }

  const s = status?.status ?? 'DISCONNECTED';
  const canConnect = s === 'DISCONNECTED' || s === 'LOGGED_OUT' || s === 'ERROR';
  const canDisconnect = s === 'CONNECTED' || s === 'CONNECTING' || s === 'RECONNECTING';

  return (
    <div className="max-w-md rounded-lg border border-border bg-surface p-[var(--space-8)]">
      <div className="mb-[var(--space-6)] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{channel.externalAccountId}</p>
          <p className="text-xs text-secondary">{STATUS_LABELS[s]}</p>
        </div>
        <StatusDot status={s} />
      </div>

      {error && (
        <p className="mb-[var(--space-6)] rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {s === 'PAIRING_REQUIRED' && status?.qrCode && (
        <div className="mb-[var(--space-7)] flex flex-col items-center gap-[var(--space-5)] rounded-md bg-app p-[var(--space-8)]">
          <QRCodeSVG value={status.qrCode} size={200} />
          <p className="text-center text-xs text-secondary">Escanea con WhatsApp: Dispositivos vinculados → Vincular dispositivo</p>
        </div>
      )}

      {s === 'CONNECTED' && status?.phoneNumber && (
        <p className="mb-[var(--space-7)] text-sm text-ink">
          Número conectado: <span className="font-semibold">{status.phoneNumber}</span>
        </p>
      )}

      <div className="flex flex-wrap gap-[var(--space-5)]">
        {canConnect && (
          <button
            type="button"
            onClick={connect}
            disabled={actionPending}
            className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
          >
            Conectar
          </button>
        )}
        {canDisconnect && (
          <button
            type="button"
            onClick={disconnect}
            disabled={actionPending}
            className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-ink hover:bg-app disabled:opacity-50"
          >
            Desconectar
          </button>
        )}
        <button
          type="button"
          onClick={unlink}
          disabled={actionPending}
          className="rounded-md px-4 py-2 text-sm font-semibold text-danger hover:bg-danger-bg disabled:opacity-50"
        >
          Desvincular
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'CONNECTED' ? 'bg-success' : status === 'ERROR' ? 'bg-danger' : 'bg-warning';
  return <span className={`size-3 rounded-full ${color}`} />;
}
