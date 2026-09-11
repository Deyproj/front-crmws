import Link from 'next/link';
import type { RecentConversationItem } from '../hooks/useDashboardOverview';
import { MODE_LABELS, STATUS_LABELS } from '@/features/conversations';
import { formatRelativeTime } from '@/lib/utils/formatRelativeTime';
import { initials } from '@/lib/utils/initials';
import { EmptyState } from '@/components/ui/EmptyState';
import { MessageSquareIcon } from '@/components/ui/icons';

export function RecentConversationsCard({ items }: { items: RecentConversationItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
      <div className="flex items-center justify-between gap-[var(--space-4)]">
        <h2 className="text-sm font-bold text-ink">Conversaciones recientes</h2>
        <Link href="/" className="text-xs font-semibold text-brand hover:underline">
          Ver todas
        </Link>
      </div>
      <div className="mt-[var(--space-6)] flex flex-col">
        {items.length === 0 && (
          <EmptyState icon={<MessageSquareIcon className="size-6" />} title="Sin conversaciones" description="Todavía no hay actividad." />
        )}
        {items.map(({ conversation, contact }) => {
          const label = contact?.name || contact?.phone || 'Contacto sin nombre';
          return (
            <Link
              key={conversation.id}
              href="/"
              className="flex items-center gap-[var(--space-5)] border-b border-border py-[var(--space-5)] last:border-0 hover:bg-app"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-on-brand">
                {initials(contact?.name, contact?.phone ?? '?')}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-[var(--space-4)]">
                  <p className="truncate text-sm font-semibold text-ink">{label}</p>
                  <p className="shrink-0 text-[11px] text-secondary">{formatRelativeTime(conversation.lastMessageAt)}</p>
                </div>
                <span className="mt-1 inline-block rounded-full bg-info-bg px-[var(--space-4)] py-[1px] text-[10px] font-semibold uppercase text-info">
                  {MODE_LABELS[conversation.mode]} · {STATUS_LABELS[conversation.status]}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
