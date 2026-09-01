import type { ContactStats } from '@/features/contacts';
import type { ConversationStats } from '@/features/conversations';
import type { AppointmentStats } from '@/features/appointments';

export function ContactStatsCards({
  stats,
  conversationStats,
  appointmentStats,
}: {
  stats: ContactStats | null;
  conversationStats: ConversationStats | null;
  appointmentStats: AppointmentStats | null;
}) {
  const cards = [
    { label: 'Conversaciones', value: conversationStats?.total ?? null },
    { label: 'Prospectos', value: stats?.leads ?? null },
    { label: 'Calificados', value: stats?.qualified ?? null },
    { label: 'Oportunidades', value: stats?.opportunities ?? null },
    { label: 'Ganados', value: stats?.customers ?? null },
    { label: 'Perdidos', value: stats?.lost ?? null },
    {
      label: 'Transferidas a asesor',
      value: conversationStats ? `${conversationStats.transferredPercentage.toFixed(0)}%` : null,
    },
    {
      label: 'Primera respuesta (mediana)',
      value: formatSeconds(conversationStats?.medianFirstResponseSeconds ?? null),
    },
    { label: 'Cortesías confirmadas', value: appointmentStats?.confirmed ?? null },
    { label: 'Cortesías asistidas', value: appointmentStats?.completed ?? null },
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

function formatSeconds(seconds: number | null): string | null {
  if (seconds === null) return null;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)} min`;
}
