'use client';

import { useContactsOverview } from '../hooks/useContactsOverview';
import { ContactStatsCards } from '../components/ContactStatsCards';
import { ContactsTable } from '../components/ContactsTable';

export function ContactsView() {
  const { contacts, contactStats, conversationStats, appointmentStats, loading, error } = useContactsOverview();

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
            <ContactStatsCards stats={contactStats} conversationStats={conversationStats} appointmentStats={appointmentStats} />
            <ContactsTable contacts={contacts} />
          </div>
        )}
      </div>
    </div>
  );
}
