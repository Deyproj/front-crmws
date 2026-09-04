'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useChannels } from '../hooks/useChannels';
import { MetaChannelConnectDialog } from '../components/MetaChannelConnectDialog';
import { MessageTemplatesManager } from '../components/MessageTemplatesManager';
import {
  STATUS_LABELS,
  PROVIDER_LABELS,
  type Channel,
  type ChannelSessionStatus,
  type MetaCredentialsInput,
} from '@/features/channel';
import { Tabs } from '@/components/ui/Tabs';
import { AutomationToggle } from '@/features/organization/presentation/components/AutomationToggle';
import { TeamManager } from '@/features/organization/presentation/components/TeamManager';
import { AgentConfigForm } from '@/features/agent/presentation/components/AgentConfigForm';
import { AgentSimulator } from '@/features/agent/presentation/components/AgentSimulator';
import { KnowledgeEntriesManager } from '@/features/agent/presentation/components/KnowledgeEntriesManager';
import { FollowUpMessageRulesView } from '@/features/followups/presentation/views/FollowUpMessageRulesView';
import { SatisfactionSurveysView } from '@/features/feedback/presentation/views/SatisfactionSurveysView';

const MANAGER_ROLES = new Set(['OWNER']);

const MAIN_TABS = [
  { id: 'agent', label: 'Agente' },
  { id: 'followups', label: 'Seguimientos' },
  { id: 'feedback', label: 'Encuestas' },
  { id: 'team', label: 'Equipo' },
  { id: 'channel', label: 'Canal de WhatsApp' },
];

const AGENT_TABS = [
  { id: 'automation', label: 'Automatización' },
  { id: 'personalization', label: 'Personalización' },
  { id: 'knowledge', label: 'Conocimiento' },
  { id: 'simulator', label: 'Probar agente' },
];

export function ChannelSettingsView() {
  const { user } = useAuth();
  const canManage = !!user && MANAGER_ROLES.has(user.role);
  const [mainTab, setMainTab] = useState(MAIN_TABS[0].id);
  const [agentTab, setAgentTab] = useState(AGENT_TABS[0].id);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[var(--topbar-height)] shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
        <h1 className="text-2xl font-black tracking-tight text-ink">Configuración</h1>
      </header>
      {canManage ? (
        <>
          <div className="shrink-0 border-b border-border bg-surface px-[var(--space-9)]">
            <Tabs tabs={MAIN_TABS} activeId={mainTab} onChange={setMainTab} label="Secciones de configuración" />
          </div>
          <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-[var(--space-7)]">
              {mainTab === 'agent' && (
                <div className="flex w-full flex-col items-center gap-[var(--space-7)]">
                  <Tabs tabs={AGENT_TABS} activeId={agentTab} onChange={setAgentTab} size="sm" label="Secciones del agente" />
                  <div className="w-full">
                    {agentTab === 'automation' && <AutomationToggle />}
                    {agentTab === 'personalization' && <AgentConfigForm />}
                    {agentTab === 'knowledge' && <KnowledgeEntriesManager />}
                    {agentTab === 'simulator' && <AgentSimulator />}
                  </div>
                </div>
              )}
              {mainTab === 'channel' && <ChannelManager />}
              {mainTab === 'followups' && <FollowUpMessageRulesView />}
              {mainTab === 'feedback' && <SatisfactionSurveysView />}
              {mainTab === 'team' && <TeamManager />}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
          <p className="text-sm text-secondary">
            Solo el propietario o un administrador de la organización puede gestionar la automatización o el canal de
            WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}

function ChannelManager() {
  const { entries, loading, actionPending, error, create, connect, disconnect, unlink, reconnectMeta, setPreferred } =
    useChannels();
  const [externalAccountId, setExternalAccountId] = useState('');
  const [metaDialogOpen, setMetaDialogOpen] = useState(false);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;

  const hasBaileys = entries.some((entry) => entry.channel.provider === 'BAILEYS');
  const hasMeta = entries.some((entry) => entry.channel.provider === 'META_CLOUD_API');
  // Con un único canal no tiene sentido elegir "preferido" — solo importa cuando "Nuevo chat"
  // tendría que preguntar cuál usar (ver StartConversationHandler.getPrimary en api-crmws).
  const showPreferredControl = entries.length > 1;

  return (
    <div className="flex w-full max-w-md flex-col gap-[var(--space-7)]">
      {entries.map((entry) => (
        <ChannelCard
          key={entry.channel.id}
          channel={entry.channel}
          status={entry.status}
          actionPending={actionPending}
          error={error}
          showPreferredControl={showPreferredControl}
          onConnect={() => connect(entry.channel.id)}
          onDisconnect={() => disconnect(entry.channel.id)}
          onUnlink={() => unlink(entry.channel.id)}
          onReconnectMeta={(fields) => reconnectMeta(entry.channel.id, fields)}
          onSetPreferred={() => setPreferred(entry.channel.id)}
        />
      ))}

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger-bg px-[var(--space-6)] py-[var(--space-5)] text-sm text-danger">
          {error}
        </p>
      )}

      {(!hasBaileys || !hasMeta) && (
        <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
          <p className="mb-[var(--space-6)] text-sm font-semibold text-ink">Agregar canal</p>
          <div className="flex flex-col gap-[var(--space-7)]">
            {!hasBaileys && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (externalAccountId.trim()) {
                    create({ provider: 'BAILEYS', externalAccountId: externalAccountId.trim() });
                    setExternalAccountId('');
                  }
                }}
                className="flex flex-col gap-[var(--space-4)]"
              >
                <label
                  htmlFor="externalAccountId"
                  className="text-xs font-medium uppercase tracking-wide text-secondary"
                >
                  WhatsApp por QR — identificador de cuenta
                </label>
                <div className="flex gap-[var(--space-4)]">
                  <input
                    id="externalAccountId"
                    value={externalAccountId}
                    onChange={(e) => setExternalAccountId(e.target.value)}
                    placeholder="ej. gym-principal"
                    className="w-full rounded-md border border-border bg-app px-[var(--space-6)] py-[var(--space-5)] text-sm text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="submit"
                    disabled={actionPending || !externalAccountId.trim()}
                    className="shrink-0 rounded-md bg-brand px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Crear
                  </button>
                </div>
              </form>
            )}
            {!hasMeta && (
              <button
                type="button"
                onClick={() => setMetaDialogOpen(true)}
                className="self-start rounded-md border border-border px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-ink hover:bg-app"
              >
                Conectar Meta Cloud API (oficial)
              </button>
            )}
          </div>
        </div>
      )}

      <MetaChannelConnectDialog
        open={metaDialogOpen}
        onClose={() => setMetaDialogOpen(false)}
        onSubmit={(fields) => create({ provider: 'META_CLOUD_API', externalAccountId: fields.phoneNumberId, ...fields })}
        pending={actionPending}
        error={error}
      />
    </div>
  );
}

function ChannelCard({
  channel,
  status,
  actionPending,
  error,
  showPreferredControl,
  onConnect,
  onDisconnect,
  onUnlink,
  onReconnectMeta,
  onSetPreferred,
}: {
  channel: Channel;
  status: ChannelSessionStatus | null;
  actionPending: boolean;
  error: string | null;
  showPreferredControl: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onUnlink: () => void;
  onReconnectMeta: (fields: MetaCredentialsInput) => Promise<boolean>;
  onSetPreferred: () => void;
}) {
  const [confirmingUnlink, setConfirmingUnlink] = useState(false);
  const [reconnectDialogOpen, setReconnectDialogOpen] = useState(false);
  const isMeta = channel.provider === 'META_CLOUD_API';

  const s = status?.status ?? 'DISCONNECTED';
  // Desvincular un canal Meta borra sus credenciales por completo (BR-030) — a diferencia de
  // Baileys, donde un QR nuevo reactiva la misma sesión sin perder nada. "Verificar conexión"
  // (POST .../connect) reusa las credenciales guardadas, así que no sirve de nada en este estado
  // puntual: hace falta volver a cargarlas con MetaChannelConnectDialog (modo reconexión).
  const metaNeedsNewCredentials = isMeta && s === 'LOGGED_OUT';
  const canConnect = (s === 'DISCONNECTED' || s === 'LOGGED_OUT' || s === 'ERROR') && !metaNeedsNewCredentials;
  const canDisconnect = s === 'CONNECTED' || s === 'CONNECTING' || s === 'RECONNECTING';
  // phoneNumber solo se guarda al completarse una vinculación real (ver ChannelSession.markConnected
  // en api-crmws) y NUNCA se borra al desconectar/desvincular (markLoggedOut no lo toca) — por eso
  // no alcanza como única señal: una vez vinculado alguna vez, quedaba pegado ahí para siempre y
  // "Desvincular" no desaparecía ni después de desvincular de verdad (hallazgo real, 2026-09-04).
  // LOGGED_OUT es el estado terminal real de "ya no hay nada vinculado" para ambos proveedores —
  // Meta lo alcanza al desvincular (borra credenciales), Baileys al desvincular o al cerrar sesión
  // desde el teléfono.
  const everLinked = s !== 'LOGGED_OUT' && (isMeta || !!status?.phoneNumber);
  const statusLabel = !everLinked && (s === 'DISCONNECTED' || s === 'LOGGED_OUT') ? 'Sin vincular todavía' : STATUS_LABELS[s];
  // Con un QR pendiente (PAIRING_REQUIRED) y sin vinculación previa, ni "Vincular" (canConnect
  // es false mientras ya hay un intento en curso) ni "Desvincular" (everLinked es false, nada
  // real que deshacer) aparecían — el QR quedaba sin ninguna acción posible. Mismo botón que
  // "Desvincular" (unlink limpia credenciales/QR pendiente en Node y Java), pero con el texto
  // correcto para un intento que nunca llegó a vincularse. Meta nunca pasa por PAIRING_REQUIRED.
  const canCancelPairing = !isMeta && s === 'PAIRING_REQUIRED' && !everLinked;

  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="mb-[var(--space-6)] flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{channel.externalAccountId}</p>
          <p className="text-xs text-secondary">
            {PROVIDER_LABELS[channel.provider]} · {statusLabel}
          </p>
        </div>
        <StatusDot status={s} />
      </div>

      {showPreferredControl && (
        <div className="mb-[var(--space-6)]">
          {channel.preferred ? (
            <span className="rounded-full bg-brand/10 px-[var(--space-5)] py-[var(--space-3)] text-[10px] font-semibold uppercase tracking-wide text-brand">
              ★ Canal por defecto
            </span>
          ) : (
            <button
              type="button"
              onClick={onSetPreferred}
              disabled={actionPending}
              className="text-xs font-semibold text-brand hover:underline disabled:opacity-50"
            >
              Usar como canal por defecto
            </button>
          )}
        </div>
      )}

      {!isMeta && s === 'PAIRING_REQUIRED' && status?.qrCode && (
        <div className="mb-[var(--space-7)] flex flex-col items-center gap-[var(--space-5)] rounded-xl bg-app p-[var(--space-8)]">
          <QRCodeSVG value={status.qrCode} size={200} />
          <p className="text-center text-xs text-secondary">Escanea con WhatsApp: Dispositivos vinculados → Vincular dispositivo</p>
        </div>
      )}

      {s === 'CONNECTED' && status?.phoneNumber && (
        <p className="mb-[var(--space-7)] text-sm text-ink">
          Número conectado: <span className="font-semibold">{status.phoneNumber}</span>
        </p>
      )}

      {confirmingUnlink ? (
        <div className="flex flex-wrap items-center gap-[var(--space-5)] rounded-md border border-danger/30 bg-danger-bg p-[var(--space-6)]">
          <p className="text-sm text-danger">
            {isMeta ? '¿Desvincular? Se borran las credenciales guardadas de este canal.' : '¿Desvincular? Se cierra la sesión real de WhatsApp.'}
          </p>
          <div className="ml-auto flex gap-[var(--space-4)]">
            <button
              type="button"
              onClick={() => setConfirmingUnlink(false)}
              disabled={actionPending}
              className="rounded-md border border-border bg-surface px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onUnlink();
                setConfirmingUnlink(false);
              }}
              disabled={actionPending}
              className="rounded-md bg-danger px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:opacity-90 disabled:opacity-50"
            >
              Sí, desvincular
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-[var(--space-5)]">
          {metaNeedsNewCredentials && (
            <button
              type="button"
              onClick={() => setReconnectDialogOpen(true)}
              disabled={actionPending}
              className="rounded-md bg-brand px-[var(--space-7)] py-[var(--space-4)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reconectar
            </button>
          )}
          {canConnect && (
            <button
              type="button"
              onClick={onConnect}
              disabled={actionPending}
              className="rounded-md bg-brand px-[var(--space-7)] py-[var(--space-4)] text-sm font-semibold text-on-brand hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isMeta ? 'Verificar conexión' : everLinked ? 'Conectar' : 'Vincular'}
            </button>
          )}
          {canCancelPairing && (
            <button
              type="button"
              onClick={onUnlink}
              disabled={actionPending}
              className="rounded-md border border-border px-[var(--space-7)] py-[var(--space-4)] text-sm font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancelar
            </button>
          )}
          {canDisconnect && (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={actionPending}
              className="rounded-md border border-border px-[var(--space-7)] py-[var(--space-4)] text-sm font-semibold text-ink hover:bg-app disabled:cursor-not-allowed disabled:opacity-50"
            >
              Desconectar
            </button>
          )}
          {everLinked && (
            <button
              type="button"
              onClick={() => setConfirmingUnlink(true)}
              disabled={actionPending}
              className="rounded-md px-[var(--space-7)] py-[var(--space-4)] text-sm font-semibold text-danger hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
            >
              Desvincular
            </button>
          )}
        </div>
      )}

      {isMeta && <MessageTemplatesManager channelId={channel.id} />}

      {isMeta && (
        <MetaChannelConnectDialog
          open={reconnectDialogOpen}
          onClose={() => setReconnectDialogOpen(false)}
          onSubmit={onReconnectMeta}
          pending={actionPending}
          error={error}
          title="Reconectar Meta Cloud API"
          submitLabel="Reconectar"
          submitPendingLabel="Reconectando..."
        />
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'CONNECTED' ? 'bg-success' : status === 'ERROR' ? 'bg-danger' : 'bg-warning';
  return <span className={`size-3 rounded-full ${color}`} />;
}
