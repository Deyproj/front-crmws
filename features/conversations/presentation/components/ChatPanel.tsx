'use client';

import { useEffect, useRef, useState } from 'react';
import type { Conversation, Message } from '@/features/conversations';
import { MODE_LABELS, STATUS_LABELS } from '@/features/conversations';
import type { Contact } from '@/features/contacts';
import { initials } from '@/lib/utils/initials';
import { SendIcon, BotIcon } from '@/components/ui/icons';

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
}) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center bg-app">
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
    <div className="flex h-full flex-1 flex-col bg-app">
      <div className="flex items-center justify-between border-b border-border bg-surface px-[var(--space-8)] py-[var(--space-6)]">
        <div className="flex items-center gap-[var(--space-6)]">
          <div className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-on-brand">
            {initials(contact?.name, contact?.phone ?? '?')}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{label}</p>
            <p className="text-xs text-secondary">
              {MODE_LABELS[conversation.mode]} · {STATUS_LABELS[conversation.status]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[var(--space-5)]">
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
              className="rounded-md border border-border px-[var(--space-6)] py-[var(--space-4)] text-xs font-semibold text-ink hover:bg-app disabled:opacity-50"
            >
              Liberar a IA
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
            <ChatBubble key={message.id} message={message} />
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
              ? 'Otro asesor tiene esta conversación asignada.'
              : 'Toma la conversación para responder manualmente.'}
          </p>
        )}
      </form>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const time = new Date(message.sentAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

  const isInbound = message.direction === 'INBOUND';
  // SYSTEM es el aviso de transferencia que el propio agente envía al escalar — es su
  // decisión, aunque el texto sea fijo, así que se muestra igual que una respuesta de IA.
  const isAi = message.senderType === 'AI' || message.senderType === 'SYSTEM';

  const bubbleClass = isInbound
    ? 'bg-surface border border-border text-ink self-start rounded-tl-[var(--radius-sm)]'
    : isAi
      ? 'bg-info-bg text-ink self-end rounded-tr-[var(--radius-sm)]'
      : 'bg-success-bg text-ink self-end rounded-tr-[var(--radius-sm)]';

  return (
    <div className={`flex max-w-[70%] flex-col gap-1 rounded-[var(--radius-lg)] p-[var(--space-6)] ${bubbleClass}`}>
      {isAi && (
        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-info">
          <BotIcon className="size-3" /> IA
        </span>
      )}
      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
      <p className="self-end text-[10px] text-secondary">{time}</p>
    </div>
  );
}
