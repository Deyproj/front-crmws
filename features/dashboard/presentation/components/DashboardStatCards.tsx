import type { ContactStats } from '@/features/contacts';
import type { ConversationStats } from '@/features/conversations';
import type { AppointmentStats } from '@/features/appointments';

export function DashboardStatCards({
  contactStats,
  conversationStats,
  appointmentStats,
}: {
  contactStats: ContactStats | null;
  conversationStats: ConversationStats | null;
  appointmentStats: AppointmentStats | null;
}) {
  const cards = [
    { label: 'Conversaciones totales', value: conversationStats?.total ?? null },
    { label: 'Primera respuesta (mediana)', value: formatSeconds(conversationStats?.medianFirstResponseSeconds ?? null) },
    {
      label: 'Transferidas a asesor',
      value: conversationStats ? `${conversationStats.transferredPercentage.toFixed(0)}%` : null,
    },
    { label: 'Clientes ganados', value: contactStats?.customers ?? null },
    { label: 'Cortesías confirmadas', value: appointmentStats?.confirmed ?? null },
    { label: 'Cortesías asistidas', value: appointmentStats?.completed ?? null },
  ];

  return (
    <div className="grid grid-cols-2 gap-[var(--space-6)] sm:grid-cols-3 lg:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-border bg-surface p-[var(--space-8)]">
          <p className="text-3xl font-black text-ink">{card.value ?? '—'}</p>
          <p className="mt-[var(--space-3)] text-xs text-secondary">{card.label}</p>
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
