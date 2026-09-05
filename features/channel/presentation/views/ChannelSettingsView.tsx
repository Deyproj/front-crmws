'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/features/auth/presentation/context/AuthContext';
import { useChannels } from '../hooks/useChannels';
import { MetaChannelConnectDialog } from '../components/MetaChannelConnectDialog';
import { MessageTemplatesManager } from '../components/MessageTemplatesManager';
import {
  STATUS_LABELS,
  type Channel,
  type ChannelProvider,
  type ChannelSessionStatus,
  type ChannelStatus,
  type MetaCredentialsInput,
} from '@/features/channel';
import { QrCodeIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { Tabs } from '@/components/ui/Tabs';
import { AutomationToggle } from '@/features/organization/presentation/components/AutomationToggle';
import { TeamManager } from '@/features/organization/presentation/components/TeamManager';
import { AgentConfigForm } from '@/features/agent/presentation/components/AgentConfigForm';
import { AgentSimulator } from '@/features/agent/presentation/components/AgentSimulator';
import { KnowledgeEntriesManager } from '@/features/agent/presentation/components/KnowledgeEntriesManager';
import { FollowUpMessageRulesView } from '@/features/followups/presentation/views/FollowUpMessageRulesView';
import { SatisfactionSurveysView } from '@/features/feedback/presentation/views/SatisfactionSurveysView';
import { AiUsagePanel } from '@/features/usage/presentation/components/AiUsagePanel';

const MANAGER_ROLES = new Set(['OWNER']);

/**
 * Identidad visual fija por proveedor (icono + insignia "Oficial"/"No oficial") — comunica
 * FUNCIONALIDAD (qué es cada canal), independiente de si en este momento está conectado o no.
 * Nunca se atenúa según el estado, para no mezclar las dos señales en una sola.
 */
const PROVIDER_STYLE: Record<
  ChannelProvider,
  { icon: typeof QrCodeIcon; badgeLabel: string; badgeClass: string; avatarClass: string; shortLabel: string }
> = {
  BAILEYS: {
    icon: QrCodeIcon,
    badgeLabel: 'No oficial',
    badgeClass: 'bg-app text-secondary',
    avatarClass: 'bg-violet-bg text-violet',
    shortLabel: 'WhatsApp por código QR',
  },
  META_CLOUD_API: {
    icon: ShieldCheckIcon,
    badgeLabel: 'Oficial',
    badgeClass: 'bg-info-bg text-info',
    avatarClass: 'bg-info-bg text-info',
    shortLabel: 'WhatsApp Business',
  },
};

/**
 * Tono de ESTADO (activo/transición/inactivo/error) — señal separada de la identidad de
 * proveedor de arriba. `everLinked=false` fuerza "muted" fuera de este mapa (ver ChannelCard):
 * un canal que nunca se vinculó no es lo mismo que uno vinculado que se desconectó.
 */
type StatusTone = 'success' | 'warning' | 'danger' | 'muted';

const STATUS_TONE: Record<ChannelStatus, StatusTone> = {
  CONNECTED: 'success',
  CONNECTING: 'warning',
  RECONNECTING: 'warning',
  PAIRING_REQUIRED: 'warning',
  DISCONNECTED: 'muted',
  LOGGED_OUT: 'muted',
  ERROR: 'danger',
};

const TONE_CLASSES: Record<StatusTone, { badge: string; dot: string; ring: string }> = {
  success: { badge: 'bg-success-bg text-success', dot: 'bg-success', ring: 'border-success/40' },
  warning: { badge: 'bg-warning-bg text-warning', dot: 'bg-warning', ring: 'border-warning/40' },
  danger: { badge: 'bg-danger-bg text-danger', dot: 'bg-danger', ring: 'border-danger/40' },
  muted: { badge: 'bg-app text-muted', dot: 'bg-muted', ring: 'border-border' },
};

function ProviderAvatar({ provider }: { provider: ChannelProvider }) {
  const style = PROVIDER_STYLE[provider];
  const Icon = style.icon;
  return (
    <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${style.avatarClass}`}>
      <Icon className="size-5" />
    </div>
  );
}

function StatusBadge({ tone, label, pulsing = false }: { tone: StatusTone; label: string; pulsing?: boolean }) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-[var(--space-3)] whitespace-nowrap rounded-full px-[var(--space-5)] py-[var(--space-2)] text-xs font-semibold ${t.badge}`}
    >
      <span className={`size-2 rounded-full ${t.dot} ${pulsing ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  );
}

const MAIN_TABS = [
  { id: 'agent', label: 'Agente' },
  { id: 'followups', label: 'Seguimientos' },
  { id: 'feedback', label: 'Encuestas' },
  { id: 'usage', label: 'Consumo IA' },
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
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">Configuración</h1>
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
              {mainTab === 'usage' && <AiUsagePanel />}
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
                  className="flex items-center gap-[var(--space-3)] text-xs font-medium uppercase tracking-wide text-secondary"
                >
                  <QrCodeIcon className="size-4 text-violet" />
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
                className="inline-flex items-center gap-[var(--space-4)] self-start rounded-md border border-border px-[var(--space-7)] py-[var(--space-5)] text-sm font-semibold text-ink hover:bg-app"
              >
                <ShieldCheckIcon className="size-4 text-info" />
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

  const providerStyle = PROVIDER_STYLE[channel.provider];
  const tone: StatusTone = everLinked ? STATUS_TONE[s] : 'muted';
  const isTransitioning = tone === 'warning';

  return (
    <div className={`rounded-xl border bg-surface p-[var(--space-8)] transition-colors ${TONE_CLASSES[tone].ring}`}>
      <div className="mb-[var(--space-6)] flex items-start justify-between gap-[var(--space-5)]">
        <div className="flex min-w-0 items-start gap-[var(--space-5)]">
          <ProviderAvatar provider={channel.provider} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[var(--space-3)]">
              <p className="truncate text-sm font-semibold text-ink">{channel.externalAccountId}</p>
              <span
                className={`shrink-0 rounded-full px-[var(--space-4)] py-[var(--space-1)] text-[10px] font-semibold uppercase tracking-wide ${providerStyle.badgeClass}`}
              >
                {providerStyle.badgeLabel}
              </span>
            </div>
            <p className="text-xs text-secondary">{providerStyle.shortLabel}</p>
          </div>
        </div>
        <StatusBadge tone={tone} label={statusLabel} pulsing={isTransitioning} />
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
