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

/** Refleja ChannelResponse (api-crmws, channel/presentation/ChannelResponse.java). */
export interface Channel {
  id: string;
  type: 'WHATSAPP';
  externalAccountId: string;
  active: boolean;
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

export async function listChannels(): Promise<Channel[]> {
  return apiFetch<Channel[]>('/api/channels');
}

export async function createChannel(externalAccountId: string): Promise<Channel> {
  return apiFetch<Channel>('/api/channels', {
    method: 'POST',
    body: JSON.stringify({ type: 'WHATSAPP', externalAccountId }),
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
