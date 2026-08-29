'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation, Message } from '@/features/conversations';
import { MODE_LABELS, STATUS_LABELS } from '@/features/conversations';
import { useAgentConfig } from '@/features/agent/presentation/hooks/useAgentConfig';
import { useTeamMembers } from '@/features/organization/presentation/hooks/useTeamMembers';
import type { Contact } from '@/features/contacts';
import { initials } from '@/lib/utils/initials';
import { formatWhatsAppText } from '@/lib/utils/formatWhatsAppText';
import { SendIcon, BotIcon, UserIcon, ChevronLeftIcon, InfoIcon } from '@/components/ui/icons';

export function ChatPanel({
  conversation,
  messages,
  contact,
  myMembershipId,
  actionPending,
  actionError,
  onTakeOver,
  onRelease,
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
  onSend: (text: string) => Promise<boolean>;
  className?: string;
  onBack?: () => void;
  onOpenContact?: () => void;
}) {
  const [draft, setDraft] = useState('');
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
      <div className={`flex-1 items-center justify-center bg-app ${className}`}>
        <p className="text-sm text-secondary">Selecciona una conversación</p>
      </div>
    );
  }

  // Cuando el agente escala (Conversation.escalateToHuman en el backend), el mode ya
  // queda en HUMAN pero sin asesor asignado (status WAITING) — sigue siendo tomable.
  const isUnassignedHuman = conversation.mode === 'HUMAN' && !conversation.currentAssigneeMembershipId;
  const canTakeOver = conversation.mode === 'AI' || conversation.mode === 'HYBRID' || isUnassignedHuman;
  const canRelease = conversation.mode !== 'AI';
  const isMine = conversation.currentAssigneeMembershipId === myMembershipId;
  const canSend = conversation.mode === 'HUMAN' && isMine;
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
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

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

function ChatBubble({
  message,
  agentName,
  advisorName,
}: {
  message: Message;
  agentName: string;
  advisorName: string | null;
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
      <p className="whitespace-pre-wrap text-sm">{formatWhatsAppText(message.content)}</p>
      <p className="self-end text-[10px] text-secondary">{time}</p>
    </div>
  );
}
