import type { ContactStats } from '@/features/contacts';

export function ContactStatsCards({
  stats,
  conversationsTotal,
}: {
  stats: ContactStats | null;
  conversationsTotal: number | null;
}) {
  const cards = [
    { label: 'Conversaciones', value: conversationsTotal },
    { label: 'Prospectos', value: stats?.leads ?? null },
    { label: 'Calificados', value: stats?.qualified ?? null },
    { label: 'Oportunidades', value: stats?.opportunities ?? null },
    { label: 'Ganados', value: stats?.customers ?? null },
    { label: 'Perdidos', value: stats?.lost ?? null },
  ];

  return (
    <div className="grid grid-cols-2 gap-[var(--space-6)] sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-lg border border-border bg-surface p-[var(--space-7)]">
          <p className="text-2xl font-bold text-ink">{card.value ?? '—'}</p>
          <p className="mt-1 text-xs text-secondary">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
