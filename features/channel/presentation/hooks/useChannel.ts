'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  connectChannel,
  createChannel,
  disconnectChannel,
  getChannelStatus,
  listChannels,
  reconnectChannel,
  unlinkChannel,
  type Channel,
  type ChannelSessionStatus,
} from '@/features/channel';

const POLL_INTERVAL_MS = 4000;
const ACTIVE_POLL_STATUSES = new Set(['PAIRING_REQUIRED', 'CONNECTING', 'RECONNECTING']);

export function useChannel() {
  const [channel, setChannel] = useState<Channel | null>(null);
  const [status, setStatus] = useState<ChannelSessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChannel = useCallback(async () => {
    setLoading(true);
    try {
      const channels = await listChannels();
      const first = channels[0] ?? null;
      setChannel(first);
      if (first) setStatus(await getChannelStatus(first.id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el canal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChannel();
  }, [loadChannel]);

  useEffect(() => {
    if (!channel || !status || !ACTIVE_POLL_STATUSES.has(status.status)) return;
    const interval = setInterval(async () => {
      try {
        setStatus(await getChannelStatus(channel.id));
      } catch {
        // Silencioso: el próximo tick reintenta.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [channel, status]);

  async function create(externalAccountId: string) {
    setActionPending(true);
    setError(null);
    try {
      const created = await createChannel(externalAccountId);
      setChannel(created);
      setStatus(await getChannelStatus(created.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el canal');
    } finally {
      setActionPending(false);
    }
  }

  async function runAction(action: (channelId: string) => Promise<void>) {
    if (!channel) return;
    setActionPending(true);
    setError(null);
    try {
      await action(channel.id);
      setStatus(await getChannelStatus(channel.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La acción no se pudo completar');
    } finally {
      setActionPending(false);
    }
  }

  return {
    channel,
    status,
    loading,
    actionPending,
    error,
    create,
    connect: () => runAction(connectChannel),
    reconnect: () => runAction(reconnectChannel),
    disconnect: () => runAction(disconnectChannel),
    unlink: () => runAction(unlinkChannel),
  };
}
