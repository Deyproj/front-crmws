'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation, Message } from '@/features/conversations';
import { MODE_LABELS, STATUS_LABELS } from '@/features/conversations';
import { useAgentConfig } from '@/features/agent/presentation/hooks/useAgentConfig';
import { useTeamMembers } from '@/features/organization/presentation/hooks/useTeamMembers';
import type { Membership } from '@/features/organization';
import type { Contact } from '@/features/contacts';
import { initials } from '@/lib/utils/initials';
import { formatWhatsAppText } from '@/lib/utils/formatWhatsAppText';
import { SendIcon, BotIcon, UserIcon, UsersIcon, ChevronLeftIcon, InfoIcon, MessageSquareIcon, ZoomInIcon, XIcon } from '@/components/ui/icons';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';

export function ChatPanel({
  conversation,
  messages,
  contact,
  myMembershipId,
  actionPending,
  actionError,
  onTakeOver,
  onRelease,
  onTransfer,
  onSend,
  className = 'flex',
  onBack,
  onOpenContact,
}: {
  conversation: Conversation | null;
  messages: Message[];
  contact: Contact | null;
  myMembershipId: string;
  actionPending: boolean;
  actionError: string | null;
  onTakeOver: () => void;
  onRelease: () => void;
  onTransfer: (targetMembershipId: string) => void;
  onSend: (text: string) => Promise<boolean>;
  className?: string;
  onBack?: () => void;
  onOpenContact?: () => void;
}) {
  const [draft, setDraft] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { config: agentConfig } = useAgentConfig();
  const agentName = agentConfig?.agentName || 'IA';
  // Un mismo contacto puede pasar por varios asesores distintos (uno responde, se
  // libera a la IA, se escala de nuevo y lo toma otro) — se identifica cada mensaje
  // ADVISOR con el nombre de quien lo envió, no solo con la etiqueta genérica.
  const { members } = useTeamMembers();
  const advisorNameById = useMemo(
    () => new Map(members.map((m) => [m.id, m.name || m.email || 'Asesor'])),
    [members]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className={`flex-1 flex-col bg-app ${className}`}>
        <EmptyState
          icon={<MessageSquareIcon className="size-6" />}
          title="Selecciona una conversación"
          description="Elige una conversación de la bandeja para ver el hilo completo."
        />
      </div>
    );
  }

  // Cuando el agente escala (Conversation.escalateToHuman en el backend), el mode ya
  // queda en HUMAN pero sin asesor asignado (status WAITING) — sigue siendo tomable.
  const isUnassignedHuman = conversation.mode === 'HUMAN' && !conversation.currentAssigneeMembershipId;
  const canTakeOver = conversation.mode === 'AI' || conversation.mode === 'HYBRID' || isUnassignedHuman;
  const isMine = conversation.currentAssigneeMembershipId === myMembershipId;
  // Si otro asesor tiene la conversación asignada, solo él puede liberarla a la IA —
  // sin asignar (recién escalada, WAITING) cualquiera puede hacerlo, nadie es "dueño" todavía.
  const canRelease = conversation.mode !== 'AI' && (isMine || !conversation.currentAssigneeMembershipId);
  const canSend = conversation.mode === 'HUMAN' && isMine;
  // Transferir solo tiene sentido sobre una conversación que el propio asesor tiene
  // asignada, y solo si hay a quién pasársela — en una organización de un solo
  // miembro (el owner solo) la lista de destinos queda vacía y el botón no aparece.
  const transferCandidates = members.filter((m) => m.id !== myMembershipId && m.active);
  const canTransfer = isMine && transferCandidates.length > 0;
  const label = contact?.name || contact?.phone || 'Contacto sin nombre';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const sent = await onSend(draft);
    // Solo se limpia si de verdad se envió — si falla, el asesor no pierde lo que escribió.
    if (sent) setDraft('');
  }

  return (
    <div className={`h-full flex-1 flex-col bg-app ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-y-[var(--space-4)] border-b border-border bg-surface px-[var(--space-8)] py-[var(--space-6)]">
        <div className="flex min-w-0 items-center gap-[var(--space-4)]">
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver a la bandeja"
            className="-ml-2 shrink-0 rounded-md p-2 text-secondary hover:bg-app hover:text-ink lg:hidden"
          >
            <ChevronLeftIcon className="size-[18px]" />
          </button>
          <div className="flex min-w-0 items-center gap-[var(--space-6)]">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
              {initials(contact?.name, contact?.phone ?? '?')}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{label}</p>
              <p className="truncate text-xs text-secondary">
                {MODE_LABELS[conversation.mode]} · {STATUS_LABELS[conversation.status]}
              </p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-[var(--space-5)]">
          <button
            type="button"
            onClick={onOpenContact}
            aria-label="Ver información del contacto"
            className="rounded-md p-2 text-secondary hover:bg-app hover:text-ink lg:hidden"
          >
            <InfoIcon className="size-[18px]" />
          </button>
          {canTakeOver && (
            <button
              type="button"
              onClick={onTakeOver}
              disabled={actionPending}
              className="rounded-md bg-brand px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-on-brand hover:bg-brand-hover disabled:opacity-50"
            >
              Tomar conversación
            </button>
          )}
          {canTransfer && (
            <TransferMenu members={transferCandidates} disabled={actionPending} onSelect={onTransfer} />
          )}
          {canRelease && (
            <button
              type="button"
              onClick={onRelease}
              disabled={actionPending}
              className="flex items-center gap-[var(--space-3)] rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
            >
              <BotIcon className="size-3" />
              Liberar a {agentName}
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <p className="border-b border-danger/30 bg-danger-bg px-[var(--space-8)] py-[var(--space-4)] text-xs text-danger">
          {actionError}
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-[var(--space-8)] py-[var(--space-7)]">
        <div className="flex flex-col gap-[var(--space-7)]">
          {messages.map((message) => (
            <ChatBubble
              key={message.id}
              message={message}
              agentName={agentName}
              advisorName={message.senderMembershipId ? (advisorNameById.get(message.senderMembershipId) ?? 'Asesor') : null}
              onOpenImage={setLightboxUrl}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />

      <form onSubmit={handleSubmit} className="border-t border-border bg-surface p-[var(--space-7)]">
        {canSend ? (
          <div className="flex items-center gap-[var(--space-6)]">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 rounded-full bg-app px-[var(--space-8)] py-[var(--space-5)] text-sm text-ink placeholder-secondary focus:outline-none focus:ring-2 focus:ring-brand"
            />
            <button
              type="submit"
              disabled={actionPending || !draft.trim()}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand hover:bg-brand-hover disabled:opacity-50"
            >
              <SendIcon className="size-[18px]" />
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-secondary">
            {conversation.mode === 'HUMAN' && !isMine
              ? conversation.currentAssigneeMembershipId
                ? 'Otro asesor tiene esta conversación asignada.'
                : 'Esperando respuesta de un asesor. Toma la conversación para responder manualmente.'
              : 'Toma la conversación para responder manualmente.'}
          </p>
        )}
      </form>
    </div>
  );
}

function TransferMenu({
  members,
  disabled,
  onSelect,
}: {
  members: Membership[];
  disabled: boolean;
  onSelect: (targetMembershipId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<Membership | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        className="flex items-center gap-[var(--space-3)] rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
      >
        <UsersIcon className="size-3" />
        Transferir
      </button>
      {open && (
        <div className="absolute right-0 top-full z-10 mt-[var(--space-3)] w-56 rounded-md border border-border bg-surface py-[var(--space-3)] shadow-sm">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => {
                setOpen(false);
                setPendingTarget(member);
              }}
              className="block w-full truncate px-[var(--space-6)] py-[var(--space-4)] text-left text-xs text-ink hover:bg-app"
            >
              {member.name || member.email || 'Asesor'}
            </button>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={pendingTarget !== null}
        title="Transferir conversación"
        description={`¿Transferir esta conversación a ${pendingTarget?.name || pendingTarget?.email || 'este asesor'}? Dejarás de poder responderla hasta que te la transfieran de vuelta.`}
        confirmLabel="Transferir"
        pending={disabled}
        onConfirm={() => {
          if (!pendingTarget) return;
          const targetId = pendingTarget.id;
          setPendingTarget(null);
          onSelect(targetId);
        }}
        onCancel={() => setPendingTarget(null)}
      />
    </div>
  );
}

function ChatBubble({
  message,
  agentName,
  advisorName,
  onOpenImage,
}: {
  message: Message;
  agentName: string;
  advisorName: string | null;
  onOpenImage: (url: string) => void;
}) {
  const time = new Date(message.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const isInbound = message.direction === 'INBOUND';
  // SYSTEM es el aviso de transferencia que el propio agente envía al escalar — es su
  // decisión, aunque el texto sea fijo, así que se muestra igual que una respuesta de IA.
  const isAi = message.senderType === 'AI' || message.senderType === 'SYSTEM';
  const isAdvisor = message.senderType === 'ADVISOR';

  const bubbleClass = isInbound
    ? 'bg-surface border border-border text-ink self-start rounded-tl-[var(--radius-sm)]'
    : isAi
      ? 'bg-info-bg text-ink self-end rounded-tr-[var(--radius-sm)]'
      : 'bg-success-bg text-ink self-end rounded-tr-[var(--radius-sm)]';

  return (
    <div className={`flex max-w-[70%] flex-col gap-1 rounded-[var(--radius-lg)] p-[var(--space-6)] ${bubbleClass}`}>
      {isAi && (
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-info">
          <BotIcon className="size-3" /> {agentName}
        </span>
      )}
      {isAdvisor && advisorName && (
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-success">
          <UserIcon className="size-3" /> {advisorName}
        </span>
      )}
      <MessageAttachment message={message} onOpenImage={onOpenImage} />
      {!isAutoGeneratedAttachmentCaption(message) && (
        <p className="whitespace-pre-wrap text-sm">{formatWhatsAppText(message.content)}</p>
      )}
      <p className="self-end text-[10px] text-secondary">{time}</p>
    </div>
  );
}

/**
 * Texto que api-crmws sintetiza para adjuntos sin caption (ver
 * Message.placeholderFor en api-crmws) — se oculta porque ya es redundante
 * con el propio adjunto renderizado arriba.
 */
const AUTO_GENERATED_ATTACHMENT_CAPTIONS = new Set([
  '[Imagen adjunta]',
  '[Video adjunto]',
  '[Audio adjunto]',
  '[Documento adjunto]',
  '[Sticker adjunto]',
  '[Adjunto]',
]);

function isAutoGeneratedAttachmentCaption(message: Message): boolean {
  return AUTO_GENERATED_ATTACHMENT_CAPTIONS.has(message.content);
}

function MessageAttachment({
  message,
  onOpenImage,
}: {
  message: Message;
  onOpenImage: (url: string) => void;
}) {
  if (!message.mediaUrl) return null;

  switch (message.messageType) {
    case 'IMAGE':
    case 'STICKER': {
      const mediaUrl = message.mediaUrl;
      return (
        <button
          type="button"
          onClick={() => onOpenImage(mediaUrl)}
          aria-label="Ampliar imagen"
          className="group relative block overflow-hidden rounded-[var(--radius-sm)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- viene de un host dinámico (gateway de WhatsApp), no del propio sitio */}
          <img src={mediaUrl} alt="Imagen adjunta" className="max-w-full rounded-[var(--radius-sm)]" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
            <ZoomInIcon className="size-6 text-white" />
          </span>
        </button>
      );
    }
    case 'VIDEO':
      return (
        <video src={message.mediaUrl} controls className="max-w-full rounded-[var(--radius-sm)]">
          Tu navegador no soporta la reproducción de video.
        </video>
      );
    case 'AUDIO':
      return (
        <audio src={message.mediaUrl} controls className="max-w-full">
          Tu navegador no soporta la reproducción de audio.
        </audio>
      );
    case 'DOCUMENT':
      return (
        <a
          href={message.mediaUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-info underline"
        >
          {documentLabel(message.mediaUrl)}
        </a>
      );
    default:
      return null;
  }
}

function ImageLightbox({ url, onClose }: { url: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!url) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-[var(--space-8)]"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute right-[var(--space-8)] top-[var(--space-8)] rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
      >
        <XIcon className="size-5" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- viene de un host dinámico (gateway de WhatsApp), no del propio sitio */}
      <img
        src={url}
        alt="Imagen ampliada"
        className="max-h-full max-w-full rounded-[var(--radius-sm)] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

function documentLabel(mediaUrl: string): string {
  const lastSegment = mediaUrl.split('/').pop();
  if (!lastSegment) return 'Documento adjunto';
  try {
    return decodeURIComponent(lastSegment);
  } catch {
    return lastSegment;
  }
}
