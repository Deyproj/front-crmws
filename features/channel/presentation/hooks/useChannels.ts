'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  connectChannel,
  createChannel,
  disconnectChannel,
  getChannelStatus,
  listChannels,
  reconnectChannel,
  reconnectMetaChannel,
  setPreferredChannel,
  unlinkChannel,
  type Channel,
  type ChannelSessionStatus,
  type CreateChannelInput,
  type MetaCredentialsInput,
} from '@/features/channel';

const POLL_INTERVAL_MS = 4000;
const ACTIVE_POLL_STATUSES = new Set(['PAIRING_REQUIRED', 'CONNECTING', 'RECONNECTING']);

export interface ChannelWithStatus {
  channel: Channel;
  status: ChannelSessionStatus | null;
}

/**
 * Una organización puede tener varios canales activos a la vez desde que coexisten Baileys y Meta
 * Cloud API (ver ADR-017 en api-crmws) — reemplaza al viejo `useChannel` (singular, `channels[0]`).
 */
export function useChannels() {
  const [entries, setEntries] = useState<ChannelWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setLoading(true);
    try {
      const channels = await listChannels();
      const withStatus = await Promise.all(
        channels.map(async (channel) => ({
          channel,
          status: await getChannelStatus(channel.id).catch(() => null),
        })),
      );
      setEntries(withStatus);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los canales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    const pending = entries.filter((entry) => entry.status && ACTIVE_POLL_STATUSES.has(entry.status.status));
    if (pending.length === 0) return;
    const interval = setInterval(async () => {
      const updates = await Promise.all(
        pending.map(async (entry) => ({
          id: entry.channel.id,
          status: await getChannelStatus(entry.channel.id).catch(() => null),
        })),
      );
      setEntries((prev) =>
        prev.map((entry) => {
          const update = updates.find((u) => u.id === entry.channel.id);
          return update?.status ? { ...entry, status: update.status } : entry;
        }),
      );
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [entries]);

  async function create(input: CreateChannelInput): Promise<boolean> {
    setActionPending(true);
    setError(null);
    try {
      const created = await createChannel(input);
      const status = await getChannelStatus(created.id).catch(() => null);
      setEntries((prev) => [...prev, { channel: created, status }]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el canal');
      return false;
    } finally {
      setActionPending(false);
    }
  }

  async function runAction(channelId: string, action: (channelId: string) => Promise<void>) {
    setActionPending(true);
    setError(null);
    try {
      await action(channelId);
      const status = await getChannelStatus(channelId).catch(() => null);
      setEntries((prev) => prev.map((entry) => (entry.channel.id === channelId ? { ...entry, status } : entry)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'La acción no se pudo completar');
    } finally {
      setActionPending(false);
    }
  }

  /** Único camino real para volver a usar un canal Meta después de "Desvincular" (ver ChannelCard). */
  async function reconnectMeta(channelId: string, input: MetaCredentialsInput): Promise<boolean> {
    setActionPending(true);
    setError(null);
    try {
      await reconnectMetaChannel(channelId, input);
      const status = await getChannelStatus(channelId).catch(() => null);
      setEntries((prev) => prev.map((entry) => (entry.channel.id === channelId ? { ...entry, status } : entry)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reconectar el canal');
      return false;
    } finally {
      setActionPending(false);
    }
  }

  /** Marca preferido y refresca toda la lista — a lo sumo uno queda marcado, el resto se desmarca. */
  async function setPreferred(channelId: string): Promise<boolean> {
    setActionPending(true);
    setError(null);
    try {
      await setPreferredChannel(channelId);
      await loadChannels();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo marcar el canal preferido');
      return false;
    } finally {
      setActionPending(false);
    }
  }

  return {
    entries,
    loading,
    actionPending,
    error,
    create,
    connect: (channelId: string) => runAction(channelId, connectChannel),
    reconnect: (channelId: string) => runAction(channelId, reconnectChannel),
    disconnect: (channelId: string) => runAction(channelId, disconnectChannel),
    unlink: (channelId: string) => runAction(channelId, unlinkChannel),
    reconnectMeta,
    setPreferred,
  };
}
