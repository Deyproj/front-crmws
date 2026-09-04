import { apiFetch } from '@/lib/http/apiFetch';

export const CHANNEL_STATUSES = [
  'PAIRING_REQUIRED',
  'CONNECTING',
  'CONNECTED',
  'RECONNECTING',
  'DISCONNECTED',
  'LOGGED_OUT',
  'ERROR',
] as const;
export type ChannelStatus = (typeof CHANNEL_STATUSES)[number];

export const STATUS_LABELS: Record<ChannelStatus, string> = {
  PAIRING_REQUIRED: 'Escanea el código QR',
  CONNECTING: 'Conectando...',
  CONNECTED: 'Conectado',
  RECONNECTING: 'Reconectando...',
  DISCONNECTED: 'Desconectado',
  LOGGED_OUT: 'Sesión cerrada',
  ERROR: 'Error',
};

/** Refleja SessionProvider (api-crmws, channel/domain/SessionProvider.java). */
export type ChannelProvider = 'BAILEYS' | 'META_CLOUD_API';

export const PROVIDER_LABELS: Record<ChannelProvider, string> = {
  BAILEYS: 'WhatsApp (QR)',
  META_CLOUD_API: 'WhatsApp Business oficial (Meta Cloud API)',
};

/** Refleja ChannelResponse (api-crmws, channel/presentation/ChannelResponse.java). */
export interface Channel {
  id: string;
  type: 'WHATSAPP';
  externalAccountId: string;
  active: boolean;
  provider: ChannelProvider;
  /** A lo sumo un canal por organización — lo usa "Nuevo chat" cuando hay más de uno activo. */
  preferred: boolean;
}

/** Refleja ChannelSessionStatusResponse (api-crmws, channel/presentation/ChannelSessionStatusResponse.java). */
export interface ChannelSessionStatus {
  status: ChannelStatus;
  phoneNumber: string | null;
  qrCode: string | null;
  lastDisconnectReason: string | null;
  lastHeartbeatAt: string | null;
  connectedAt: string | null;
}

export interface CreateBaileysChannelInput {
  provider: 'BAILEYS';
  externalAccountId: string;
}

/**
 * Los 5 campos se validan contra la Graph API real antes de crear el canal (CreateChannelHandler,
 * api-crmws) — si son inválidos, la creación falla con el mensaje que devuelve Meta.
 */
export interface CreateMetaChannelInput {
  provider: 'META_CLOUD_API';
  externalAccountId: string;
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  appSecret: string;
  verifyToken: string;
}

export type CreateChannelInput = CreateBaileysChannelInput | CreateMetaChannelInput;

export async function listChannels(): Promise<Channel[]> {
  return apiFetch<Channel[]>('/api/channels');
}

export async function createChannel(input: CreateChannelInput): Promise<Channel> {
  return apiFetch<Channel>('/api/channels', {
    method: 'POST',
    body: JSON.stringify({ type: 'WHATSAPP', ...input }),
  });
}

export async function getChannelStatus(channelId: string): Promise<ChannelSessionStatus> {
  return apiFetch<ChannelSessionStatus>(`/api/channels/${channelId}/status`);
}

export async function connectChannel(channelId: string): Promise<void> {
  await apiFetch<void>(`/api/channels/${channelId}/connect`, { method: 'POST' });
}

export async function reconnectChannel(channelId: string): Promise<void> {
  await apiFetch<void>(`/api/channels/${channelId}/reconnect`, { method: 'POST' });
}

export async function disconnectChannel(channelId: string): Promise<void> {
  await apiFetch<void>(`/api/channels/${channelId}/disconnect`, { method: 'POST' });
}

export async function unlinkChannel(channelId: string): Promise<void> {
  await apiFetch<void>(`/api/channels/${channelId}/session`, { method: 'DELETE' });
}

/**
 * Con más de un canal activo coexistiendo, "Nuevo chat" pide elegir uno cada vez salvo que haya
 * un preferido marcado — a lo sumo uno por organización, así que marcar este desmarca cualquier
 * otro del lado del backend.
 */
export async function setPreferredChannel(channelId: string): Promise<void> {
  await apiFetch<void>(`/api/channels/${channelId}/preferred`, { method: 'PUT' });
}

export interface MetaCredentialsInput {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  appSecret: string;
  verifyToken: string;
}

/**
 * Único camino real para volver a usar un canal Meta Cloud API después de "Desvincular" —
 * desvincular Meta borra las credenciales por completo (a diferencia de Baileys, donde un QR
 * nuevo reactiva la misma sesión); `connectChannel` no tiene nada con qué reconectar sin esto.
 */
export async function reconnectMetaChannel(channelId: string, input: MetaCredentialsInput): Promise<void> {
  await apiFetch<void>(`/api/channels/${channelId}/meta-credentials`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** Refleja MessageTemplateResponse (api-crmws, channel/presentation/MessageTemplateResponse.java). */
export interface MessageTemplate {
  id: string;
  name: string;
  languageCode: string;
  bodyPreview: string;
  variableCount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageTemplateInput {
  name: string;
  languageCode: string;
  bodyPreview: string;
  variableCount: number;
}

export interface UpdateMessageTemplateInput {
  bodyPreview: string;
  variableCount: number;
  active: boolean;
}

export async function listMessageTemplates(channelId: string): Promise<MessageTemplate[]> {
  return apiFetch<MessageTemplate[]>(`/api/channels/${channelId}/templates`);
}

export async function createMessageTemplate(
  channelId: string,
  input: CreateMessageTemplateInput
): Promise<MessageTemplate> {
  return apiFetch<MessageTemplate>(`/api/channels/${channelId}/templates`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateMessageTemplate(
  channelId: string,
  templateId: string,
  input: UpdateMessageTemplateInput
): Promise<MessageTemplate> {
  return apiFetch<MessageTemplate>(`/api/channels/${channelId}/templates/${templateId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/** Trae del catálogo real de Meta las plantillas ya aprobadas y las guarda/actualiza localmente. */
export async function syncMessageTemplates(channelId: string): Promise<MessageTemplate[]> {
  return apiFetch<MessageTemplate[]>(`/api/channels/${channelId}/templates/sync`, {
    method: 'POST',
  });
}
