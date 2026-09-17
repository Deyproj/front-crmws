'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useContactsOverview } from '../hooks/useContactsOverview';
import { ContactStatsCards } from '../components/ContactStatsCards';
import { ContactsTable } from '../components/ContactsTable';
import { NewConversationDialog } from '@/features/conversations/presentation/components/NewConversationDialog';
import type { Contact, ContactLifecycleStage } from '@/features/contacts';
import { useDebouncedValue } from '@/lib/utils/useDebouncedValue';

export function ContactsView() {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<ContactLifecycleStage | 'ALL'>('ALL');
  // Búsqueda, etapa y paginación se resuelven en el backend sobre todo el catálogo.
  const debouncedQuery = useDebouncedValue(query.trim());
  const filters = useMemo(
    () => ({ q: debouncedQuery || undefined, stage: stage === 'ALL' ? undefined : stage }),
    [debouncedQuery, stage]
  );
  const { contacts, page, totalPages, goToPage, contactStats, loading, error } = useContactsOverview(filters);
  const router = useRouter();
  const [chatContact, setChatContact] = useState<Contact | null>(null);

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center border-b border-border bg-surface px-[var(--space-7)] sm:px-[var(--space-9)]">
        <h1 className="text-base font-bold tracking-tight text-ink">Clientes</h1>
      </header>
      <div className="flex-1 overflow-y-auto p-[var(--space-9)]">
        {loading ? (
          <p className="text-sm text-secondary">Cargando...</p>
        ) : (
          <div className="flex flex-col gap-[var(--space-8)]">
            {error && (
              <p className="rounded-md border border-danger/30 bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>
            )}
            <ContactStatsCards stats={contactStats} />
            <ContactsTable
              contacts={contacts}
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              query={query}
              onQueryChange={setQuery}
              stage={stage}
              onStageChange={setStage}
              onOpenChat={setChatContact}
            />
          </div>
        )}
      </div>

      <NewConversationDialog
        open={chatContact !== null}
        contact={chatContact}
        onClose={() => setChatContact(null)}
        onStarted={(conversationId) => {
          setChatContact(null);
          router.push(`/?conversation=${conversationId}`);
        }}
      />
    </div>
  );
}
