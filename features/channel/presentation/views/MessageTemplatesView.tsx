'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listChannels, type Channel } from '@/features/channel';
import { MessageTemplatesManager } from '../components/MessageTemplatesManager';
import { ShieldCheckIcon } from '@/components/ui/icons';
import { EmptyState } from '@/components/ui/EmptyState';

/**
 * Configuración → WhatsApp → Plantillas de Meta (`/settings/templates`). Hasta el 2026-09-16 el
 * catálogo vivía embebido dentro de la tarjeta del canal Meta, aunque lo consumen también los
 * recordatorios, la difusión masiva y la reapertura de conversaciones — se sacó a su propia ruta
 * para que esas pantallas puedan enlazar directo acá. Las plantillas pertenecen a un canal
 * `META_CLOUD_API` (BR-030); Baileys no las usa.
 */
export function MessageTemplatesView() {
  const [metaChannels, setMetaChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listChannels()
      .then((channels) => setMetaChannels(channels.filter((channel) => channel.provider === 'META_CLOUD_API')))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los canales'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-secondary">Cargando...</p>;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <>
      <p className="max-w-3xl text-sm text-secondary">
        Mensajes preaprobados por Meta — los únicos que se pueden enviar fuera de la ventana de 24h. Se usan en los
        recordatorios automáticos, la difusión masiva y para reabrir una conversación. Créalas en Meta Business Manager
        y sincronízalas acá.
      </p>

      {metaChannels.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-border bg-surface">
          <EmptyState
            icon={<ShieldCheckIcon className="size-6" />}
            title="Sin canal de WhatsApp Business"
            description="Las plantillas pertenecen a un canal oficial de Meta Cloud API. Conéctalo primero."
          />
          <Link
            href="/settings/whatsapp"
            className="mb-[var(--space-9)] rounded-md bg-brand px-[var(--space-7)] py-[var(--space-4)] text-sm font-semibold text-on-brand hover:bg-brand-hover"
          >
            Ir a Canales
          </Link>
        </div>
      ) : (
        metaChannels.map((channel) => (
          <div key={channel.id} className="flex flex-col gap-[var(--space-4)]">
            {metaChannels.length > 1 && <p className="text-sm font-semibold text-ink">{channel.externalAccountId}</p>}
            <MessageTemplatesManager channelId={channel.id} />
          </div>
        ))
      )}
    </>
  );
}
