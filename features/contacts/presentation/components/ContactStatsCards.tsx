import type { ContactStats } from '@/features/contacts';

/** Solo lo relacionado al número de clientes por etapa — conversaciones/citas viven en el Dashboard. */
export function ContactStatsCards({ stats }: { stats: ContactStats | null }) {
  const cards = [
    { label: 'Prospectos', value: stats?.leads ?? null },
    { label: 'Calificados', value: stats?.qualified ?? null },
    { label: 'Oportunidades', value: stats?.opportunities ?? null },
    { label: 'Ganados', value: stats?.customers ?? null },
    { label: 'Pausados', value: stats?.followUp ?? null },
  ];

  return (
    <div className="grid grid-cols-2 gap-[var(--space-6)] sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-surface p-[var(--space-7)]">
          <p className="text-2xl font-black text-ink">{card.value ?? '—'}</p>
          <p className="mt-1 text-xs text-secondary">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
